#!/usr/bin/env node
/**
 * Helix Agent — minimal orchestrator shell on top of Helix Smart Router.
 *
 * Architecture (per spec):
 *   Perception -> Planning -> Task Mapping -> Context Builder -> Helix Client
 *   -> Tool Executor -> Memory -> Orchestration Loop
 *
 * The agent NEVER picks a provider or model. It only classifies intent,
 * plans steps, and calls Helix with a task type. Helix's SmartRouter picks
 * the model.
 *
 * Usage:
 *   node helix-agent.js "Build a login form in React"
 *   node helix-agent.js --helix http://localhost:8080/v1/chat/completions "Open the project, find build errors, fix them, and summarize"
 *
 * Config (env vars, all optional):
 *   HELIX_URL     - default http://localhost:8080/v1/chat/completions
 *   HELIX_API_KEY - sent as Bearer token if set
 *   HELIX_POLICY  - default policy string sent with every request (default: BALANCED)
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const CONFIG = {
  helixUrl: process.env.HELIX_URL || 'http://localhost:8080/v1/chat/completions',
  apiKey: process.env.HELIX_API_KEY || null,
  defaultPolicy: process.env.HELIX_POLICY || 'BALANCED',
  memoryFile: path.join(__dirname, '.helix-agent-memory.json'),
  maxLoopIterations: 8,
};

// ---------------------------------------------------------------------------
// 1) Perception layer — classify what the user wants
// ---------------------------------------------------------------------------
const TaskType = {
  CODE: 'CODE',
  REASONING: 'REASONING',
  VISION: 'VISION',
  SUMMARIZATION: 'SUMMARIZATION',
  TRANSLATION: 'TRANSLATION',
  CLASSIFICATION: 'CLASSIFICATION',
  SEARCH: 'SEARCH',
  DOCUMENT_QA: 'DOCUMENT_QA',
  AGENT: 'AGENT',
  CHAT: 'CHAT',
  GENERAL: 'GENERAL',
};

// Ordered rules: first match wins. Keep this list tunable — it's the whole
// "brain" of the perception layer and nothing else in the system should
// need to know about providers or models.
const INTENT_RULES = [
  { type: TaskType.VISION, patterns: [/\bimage\b/i, /\bscreenshot\b/i, /\bphoto\b/i, /what.?s wrong here/i] },
  { type: TaskType.DOCUMENT_QA, patterns: [/\bpdf\b/i, /\bdocument\b/i, /\buploaded file\b/i] },
  { type: TaskType.TRANSLATION, patterns: [/\btranslate\b/i] },
  { type: TaskType.SUMMARIZATION, patterns: [/\bsummar(y|ize|ise)\b/i, /\btl;?dr\b/i] },
  { type: TaskType.SEARCH, patterns: [/\bresearch\b/i, /\blook up\b/i, /\bfind (out |information )?about\b/i] },
  { type: TaskType.REASONING, patterns: [/\bsolve\b/i, /\blogic(al)?\b/i, /\bprove\b/i, /\bwhy does\b/i] },
  { type: TaskType.CODE, patterns: [/\bcode\b/i, /\bfunction\b/i, /\bbug\b/i, /\bbuild (a|an|the)\b/i, /\bfix\b/i, /\bimplement\b/i, /\brefactor\b/i, /\bcompile\b/i] },
  { type: TaskType.CLASSIFICATION, patterns: [/\bclassify\b/i, /\bcategoriz(e|ation)\b/i, /\blabel this\b/i] },
];

// Signals that this needs the full agent loop (tools + multi-step), not a
// single Helix call.
const MULTISTEP_SIGNALS = [
  /\bthen\b/i,
  /,\s*(and )?then\b/i,
  /\bopen the (file|project)\b/i,
  /\brun (build|tests?)\b/i,
  /\band (summarize|report|test|verify)\b/i,
];

const TOOL_SIGNALS = [
  { tool: 'build', patterns: [/\brun build\b/i, /\bcompile\b/i, /\bnpm run build\b/i] },
  { tool: 'test', patterns: [/\brun tests?\b/i, /\btest (it|this|the app)\b/i] },
  { tool: 'read_file', patterns: [/\bopen the file\b/i, /\bread the file\b/i, /\bopen the project\b/i] },
];

function classifyTaskType(input) {
  for (const rule of INTENT_RULES) {
    if (rule.patterns.some((p) => p.test(input))) return rule.type;
  }
  return TaskType.CHAT;
}

function detectAttachments(input, files) {
  return {
    hasFiles: Boolean(files && files.length),
    files: files || [],
  };
}

// ---------------------------------------------------------------------------
// 2) Planning layer — single-step vs multi-step vs tool-based
// ---------------------------------------------------------------------------
function isMultiStep(input) {
  return MULTISTEP_SIGNALS.some((p) => p.test(input));
}

function detectNeededTools(input) {
  const tools = [];
  for (const t of TOOL_SIGNALS) {
    if (t.patterns.some((p) => p.test(input))) tools.push(t.tool);
  }
  return tools;
}

// Naive splitter for "do X, then Y, then Z" style instructions.
// Good enough for the 1-hour version — swap for a Helix REASONING call
// later if you want smarter decomposition.
function planSteps(input) {
  if (!isMultiStep(input)) {
    return [{ type: 'helix_call', instruction: input }];
  }

  const rawParts = input
    .split(/,?\s*(?:and )?then\s+|,\s*and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const tools = detectNeededTools(input);
  const steps = [];

  for (const part of rawParts) {
    const partTools = TOOL_SIGNALS.filter((t) => t.patterns.some((p) => p.test(part))).map((t) => t.tool);
    if (partTools.length) {
      for (const tool of partTools) steps.push({ type: 'tool', tool, instruction: part });
    } else {
      steps.push({ type: 'helix_call', instruction: part });
    }
  }

  return steps.length ? steps : [{ type: 'helix_call', instruction: input }];
}

// ---------------------------------------------------------------------------
// 3) Context builder — minimum useful context, nothing more
// ---------------------------------------------------------------------------
function buildRequest(instruction, taskType, memory, extra = {}) {
  const recentHistory = memory.history.slice(-4); // last few turns only
  return {
    prompt: instruction,
    taskType,
    policy: extra.policy || CONFIG.defaultPolicy,
    metadata: {
      history: recentHistory,
      ...extra.metadata,
    },
  };
}

// ---------------------------------------------------------------------------
// 4) Helix client — the ONLY place that talks over the network
// ---------------------------------------------------------------------------
function callHelix(requestBody) {
  return new Promise((resolve, reject) => {
    const url = new URL(CONFIG.helixUrl);
    const lib = url.protocol === 'https:' ? https : http;

    const payload = JSON.stringify({
      // Helix's OpenAI-compatible shape; adjust field names here only if
      // your SmartRouter expects something different — this is the single
      // seam between agent and router.
      messages: [{ role: 'user', content: requestBody.prompt }],
      taskType: requestBody.taskType,
      policy: requestBody.policy,
      metadata: requestBody.metadata,
    });

    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (CONFIG.apiKey) headers['Authorization'] = `Bearer ${CONFIG.apiKey}`;

    const req = lib.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'POST',
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 400) {
            reject(new Error(`Helix returned ${res.statusCode}: ${data}`));
            return;
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse Helix response: ${data}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// 5) Tool executor — terminal only for the 1hr version
// ---------------------------------------------------------------------------
function runTool(tool, instruction, cwd) {
  try {
    switch (tool) {
      case 'build': {
        const out = execSync('npm run build', { cwd, encoding: 'utf8', stdio: 'pipe' });
        return { ok: true, output: out };
      }
      case 'test': {
        const out = execSync('npm test', { cwd, encoding: 'utf8', stdio: 'pipe' });
        return { ok: true, output: out };
      }
      case 'read_file': {
        // Very naive — looks for a path-like token in the instruction.
        const match = instruction.match(/[\w./-]+\.(js|ts|jsx|tsx|json|py|md)/i);
        if (!match) return { ok: false, output: 'No file path detected in instruction.' };
        const filePath = path.resolve(cwd, match[0]);
        const content = fs.readFileSync(filePath, 'utf8');
        return { ok: true, output: content };
      }
      default:
        return { ok: false, output: `Unknown tool: ${tool}` };
    }
  } catch (err) {
    // Build/test failures are expected input to the next Helix step, not
    // agent crashes — surface stdout+stderr so it can be summarized/fixed.
    return { ok: false, output: (err.stdout || '') + (err.stderr || '') + err.message };
  }
}

// ---------------------------------------------------------------------------
// 6) Memory layer — flat file, minimal
// ---------------------------------------------------------------------------
function loadMemory() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG.memoryFile, 'utf8'));
  } catch {
    return { history: [] };
  }
}

function saveMemory(memory) {
  fs.writeFileSync(CONFIG.memoryFile, JSON.stringify(memory, null, 2));
}

// ---------------------------------------------------------------------------
// 7) Orchestration loop
// ---------------------------------------------------------------------------
async function runAgent(userInput, opts = {}) {
  const memory = loadMemory();
  const cwd = opts.cwd || process.cwd();
  const steps = planSteps(userInput);

  console.log(`\n[agent] classified plan (${steps.length} step${steps.length > 1 ? 's' : ''}):`);
  steps.forEach((s, i) => console.log(`  ${i + 1}. [${s.type}] ${s.instruction}`));

  let finalResult = null;
  let iterations = 0;

  for (const step of steps) {
    if (++iterations > CONFIG.maxLoopIterations) {
      console.warn('[agent] max iterations reached, stopping.');
      break;
    }

    if (step.type === 'tool') {
      console.log(`\n[agent] running tool: ${step.tool}`);
      const result = runTool(step.tool, step.instruction, cwd);
      memory.history.push({ role: 'tool', tool: step.tool, output: result.output.slice(0, 2000) });
      finalResult = result;

      // If a tool fails (e.g. build errors), automatically hand the error
      // output to Helix as a CODE task to fix it — this is the "retry via
      // model" branch from the spec's loop.
      if (!result.ok) {
        console.log('[agent] tool failed — sending error output to Helix as CODE task');
        const req = buildRequest(
          `The following command failed. Diagnose and propose a fix:\n\n${result.output}`,
          TaskType.CODE,
          memory
        );
        const helixResult = await callHelix(req);
        memory.history.push({ role: 'assistant', content: extractText(helixResult) });
        finalResult = helixResult;
      }
      continue;
    }

    // helix_call step
    const taskType = classifyTaskType(step.instruction);
    console.log(`\n[agent] -> Helix  (taskType=${taskType})`);
    const req = buildRequest(step.instruction, taskType, memory);
    memory.history.push({ role: 'user', content: step.instruction });

    const helixResult = await callHelix(req);
    const text = extractText(helixResult);
    memory.history.push({ role: 'assistant', content: text });
    finalResult = helixResult;

    console.log(`[agent] <- Helix  (provider=${helixResult.provider || '?'}, model=${helixResult.model || '?'})`);
  }

  saveMemory(memory);
  return finalResult;
}

function extractText(helixResult) {
  if (typeof helixResult.content === 'string') return helixResult.content;
  if (Array.isArray(helixResult.content)) {
    return helixResult.content.map((c) => c.text || '').join('\n');
  }
  if (helixResult.choices && helixResult.choices[0]) {
    return helixResult.choices[0].message?.content || helixResult.choices[0].text || '';
  }
  return JSON.stringify(helixResult);
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------
async function main() {
  const args = process.argv.slice(2);
  const helixIdx = args.indexOf('--helix');
  if (helixIdx !== -1) {
    CONFIG.helixUrl = args[helixIdx + 1];
    args.splice(helixIdx, 2);
  }
  const userInput = args.join(' ').trim();

  if (!userInput) {
    console.error('Usage: node helix-agent.js [--helix <url>] "your request"');
    process.exit(1);
  }

  try {
    const result = await runAgent(userInput);
    console.log('\n=== FINAL RESULT ===\n');
    console.log(extractText(result));
  } catch (err) {
    console.error('\n[agent] error:', err.message);
    console.error(`Check that Helix is running and reachable at ${CONFIG.helixUrl}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runAgent, classifyTaskType, planSteps, TaskType };
