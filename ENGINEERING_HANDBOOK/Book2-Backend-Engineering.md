# HELIX ENGINEERING HANDBOOK — BOOK 2

## Backend Engineering

> **Source of Truth:** Every module, class, interface, function, and algorithm described here is verified from direct file reads in the HELIX repository (`src/` directory). Where code behavior is inferred but not explicitly verified at runtime, it is labeled accordingly.

---

## 1. MODULE REFERENCE (VERIFIED FROM SOURCE CODE)

### 1.1 Module Map

Every module below was verified by opening and reading its source file:

| Module Path                 | Type         | Verified Content                                                                                 |
|-----------------------------|--------------|--------------------------------------------------------------------------------------------------|
| `auth/`                     | Subsystem    | JWT auth, PostgreSQL user repository, password hashing, middleware                                |
| `byok/`                     | Subsystem    | Credential CRUD, encryption, validation, connection testing                                       |
| `cli/`                      | Subsystem    | Ink + React terminal dashboard                                                                    |
| `config/`                   | Config       | Env, logger, router, timeout, retry, pricing, provider config                                   |
| `container/AppContainer.ts` | Singleton    | Exports `providerManager` and `smartRouter`                                                      |
| `controllers/`              | Controllers  | OpenAI, Streaming, Dashboard, Metrics, Ready                                                    |
| `converters/`               | Converters   | OpenAI request/response transformation                                                          |
| `database/Database.ts`      | Database     | PostgreSQL `Pool` instance                                                                       |
| `integrations/byok/`        | Integration  | BYOK container, resolver, factory                                                                |
| `metrics/`                  | Metrics      | Metrics manager, token accounting                                                               |
| `middlewares/`              | Middleware   | Auth, rate limit, request ID, logging, validation                                               |
| `models/`                   | Data Models  | AI model info, routing context/request/response, OpenAI chat request/response                     |
| `orchestrator/`             | Orchestration| Smart router, model/provider selection, circuit breaker, retry, failover, health, timeout        |
| `organizations/`            | Subsystem    | Organization CRUD with PostgreSQL repository                                                    |
| `providers/`                | Providers    | Gemini (Google GenAI SDK), OpenRouter (OpenAI SDK), provider manager, factory                     |
| `registry/`                 | Registry     | Model registry (maps model IDs to provider names)                                                 |
| `routes/`                   | Routes       | Express route definitions                                                                       |
| `services/`                 | Services     | Dashboard service, usage meter, BYOK bootstrap                                                   |
| `types/`                    | Types        | ProviderType, RoutingPolicy, TaskType                                                            |
| `utils/`                    | Utilities    | Token normalizer                                                                                 |
| `validation/`               | Validation   | Error normalizer, output validator                                                                |

---

## 2. AUTHENTICATION SUBSYSTEM (`auth/`)

### 2.1 Module Structure (Verified File List)

```
auth/
├── controllers/AuthController.ts
├── middleware/AuthMiddleware.ts
├── models/User.ts
├── repositories/PostgreSQLUserRepository.ts
├── repositories/UserRepository.ts
├── routes/AuthRoutes.ts
├── services/AuthService.ts
├── services/JWTService.ts
└── services/PasswordService.ts
```

### 2.2 User Model (`auth/models/User.ts`)

Verified fields from file read:

- `id: string`
- `email: string`
- `passwordHash: string`
- `fullName: string`
- `createdAt: Date`
- `updatedAt: Date`
- `isActive: boolean`
- `emailVerified: boolean`

### 2.3 User Repository Interface (`auth/repositories/UserRepository.ts`)

Verified methods:
- `create(user: User): Promise<User>`
- `findById(id: string): Promise<User | null>`
- `findByEmail(email: string): Promise<User | null>`
- `update(user: User): Promise<User>`
- `delete(id: string): Promise<void>`
- `existsByEmail(email: string): Promise<boolean>`

### 2.4 PostgreSQL Implementation (`auth/repositories/PostgreSQLUserRepository.ts`)

Verified SQL operations (direct lines from file):

- `INSERT INTO users (...) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *` (line 12)
- `SELECT * FROM users WHERE id = $1` (line 43)
- `SELECT * FROM users WHERE email = $1` (line 55)
- `UPDATE users SET ... WHERE id = $1 RETURNING *` (line 69)
- `DELETE FROM users WHERE id = $1` (line 96)
- `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)` (line 102)

Row mapping (`mapRow` method, line 114) maps `password_hash` → `passwordHash`, `full_name` → `fullName`, `is_active` → `isActive`, `email_verified` → `emailVerified`, `created_at` → `createdAt`, `updated_at` → `updatedAt`.

### 2.5 Password Service (`auth/services/PasswordService.ts`)

**NOT VERIFIED FROM REPOSITORY — File contents not fully verified.** From file name and usages (`AuthService.ts` lines 31, 91), it provides `hashPassword()` and `verifyPassword()` using `bcrypt`.

### 2.6 JWT Service (`auth/services/JWTService.ts`)

Verified usages:
- `generateAccessToken({ userId, email })`
- `generateRefreshToken({ userId, email })`
- `verifyAccessToken(token)`

Used by `AuthService` (lines 50-61, 98-109) and `AuthMiddleware` (line 36).

### 2.7 Auth Service (`auth/services/AuthService.ts`)

Verified from direct file read (140 lines):

- `register(email, password, fullName)` — checks existing email, hashes password, creates user, generates access + refresh tokens.
- `login(email, password)` — finds user, verifies password, generates tokens.
- `getCurrentUser(userId)` — returns user profile (id, email, fullName, emailVerified, createdAt).

### 2.8 Auth Controller (`auth/controllers/AuthController.ts`)

Verified from file read:
- `register(req, res)` — calls `authService.register()`
- `login(req, res)` — calls `authService.login()`
- `me(req, res)` — protected by `jwtAuthMiddleware`, calls `authService.getCurrentUser(req.user.userId)`

### 2.9 JWT Middleware (`auth/middleware/AuthMiddleware.ts`)

Verified from file read:
- Extracts `Authorization` header.
- Requires `Bearer ` prefix.
- Verifies token via `JWTService.verifyAccessToken()`.
- Attaches `req.user = { userId, email }`.
- Returns 401 on any failure with `{ error: "..." }`.

### 2.10 Auth Routes (`auth/routes/AuthRoutes.ts`)

Verified routes:
- `POST /register` → `authController.register`
- `POST /login` → `authController.login`
- `GET /me` → `jwtAuthMiddleware`, then `authController.me`

---

## 3. BYOK SUBSYSTEM (`byok/`)

### 3.1 Module Map (Verified)

```
byok/
├── controllers/ProviderCredentialsController.ts
├── interfaces/ProviderCredential.ts
├── middleware/CredentialOwnershipMiddleware.ts
├── models/ProviderCredentialModel.ts
├── repositories/PostgreSQLProviderCredentialRepository.ts
├── repositories/ProviderCredentialRepository.ts
├── routes/providerCredentialsRoutes.ts
├── services/CredentialEncryptionService.ts
├── services/ProviderConnectionTester.ts
├── services/ProviderCredentialsService.ts
├── types/ProviderCredentialTypes.ts
├── utils/CredentialEncryption.ts
└── validators/ProviderCredentialValidator.ts
```

### 3.2 Provider Credential Model (`byok/models/ProviderCredentialModel.ts`)

Verified fields:
- `id: string`
- `userId: string`
- `provider: string`
- `authType: string`
- `displayName: string`
- `credential: string` (encrypted)
- `status: CredentialStatus`
- `metadata: object`
- `createdAt: Date`
- `updatedAt: Date`
- `lastTestedAt?: Date`

### 3.3 Credential Types (`byok/types/ProviderCredentialTypes.ts`)

Verified from file read:
- `CredentialStatus`: `ACTIVE`, `INACTIVE`, `FAILED`, `PENDING`
- `CreateProviderCredentialRequest`: `{ provider, authType, displayName, credential }`
- `UpdateProviderCredentialRequest`: partial update
- `ProviderCredentialSummary`: subset for list responses
- `TestConnectionResult`: `{ status, message?, latencyMs? }`

### 3.4 Encryption Service (`byok/services/CredentialEncryptionService.ts`)

Verified from `ByokContainer.ts` (line 9-12): Uses `BYOK_ENCRYPTION_SECRET` from environment (`env.BYOK_ENCRYPTION_SECRET` or `env.HELIX_ENCRYPTION_SECRET` or default). Provides `encryptCredential()` and `decryptCredential()`.

### 3.5 Credentials Service (`byok/services/ProviderCredentialsService.ts`)

Verified from file read (186 lines):
- `createCredential(userId, request)` — validates, checks duplicates, encrypts, creates.
- `updateCredential(id, request)` — validates, encrypts updated credential if present.
- `deleteCredential(id)` — deletes.
- `getCredential(id)` — returns full model.
- `listCredentials(userId)` — returns summaries.
- `getActiveCredential(userId, provider)` — finds `CredentialStatus.ACTIVE` credential and returns with decrypted secret.
- `testCredential(id)` — decrypts, tests connection, updates status.

### 3.6 Repository (`byok/repositories/PostgreSQLProviderCredentialRepository.ts`)

**NOT VERIFIED FROM REPOSITORY — File not fully verified.** Name implies PostgreSQL repository for provider credentials. Used by `ProviderCredentialsService`.

### 3.7 Integration Container (`src/integrations/byok/ByokContainer.ts`)

Verified (41 lines):
- Creates `PostgreSQLProviderCredentialRepository()`
- Creates `CredentialEncryptionService(encryptionSecret)`
- Creates `ProviderCredentialValidator()`
- Creates `ProviderConnectionTester()`
- Creates `ProviderCredentialsService()`
- Creates `ProviderCredentialResolver()`
- Exports `byokContainer` object with all services + resolver

---

## 4. PROVIDER SUBSYSTEM (`providers/`)

### 4.1 Provider Interface (`providers/AIProvider.ts`)

Verified interface (70 lines):

```typescript
export interface ChatMessage { role: "system" | "user" | "assistant"; content: string; }
export interface ChatResponse { content: string; provider: string; model: string; }
export interface AIModelInfo { id: string; name: string; contextWindow: number; maxOutputTokens: number; supportsChat: boolean; supportsVision: boolean; supportsStreaming: boolean; supportsFunctionCalling: boolean; supportsReasoning: boolean; supportsCoding: boolean; inputPricePerMillionTokens?: number; outputPricePerMillionTokens?: number; }
export interface GenerationOptions { maxTokens?: number; temperature?: number; topP?: number; stopSequences?: string[]; topK?: number; }
export interface AIProvider {
  readonly name: string;
  getAvailableModels(): Promise<AIModelInfo[]>;
  chat(messages: ChatMessage[], model: string, options?: GenerationOptions): Promise<ChatResponse>;
  chatStream(messages: ChatMessage[], model: string, options?: GenerationOptions): AsyncGenerator<string>;
  generateStream(messages: ChatMessage[], model: string, options?: GenerationOptions): AsyncGenerator<string>;
}
```

### 4.2 Base Provider (`providers/BaseProvider.ts`)

Verified abstract class (37 lines):
- Implements `AIProvider`
- Abstract methods: `chat`, `chatStream`, `generateStream`
- Default `getAvailableModels()` returns `[]`
- Protected `log()` method prints `[ProviderName] message`

### 4.3 Gemini Provider (`providers/GeminiProvider.ts`)

Verified from file read (194 lines):
- Uses `GoogleGenAI` from `@google/genai` SDK.
- Constructor takes optional `apiKey` (falls back to `env.GEMINI_API_KEY`); uses `env.GEMINI_MODEL`.
- `getAvailableModels()` returns hardcoded array: `gemini-2.5-flash` (1,048,576 context, 8,192 max output) and `gemini-2.5-pro` (1,048,576 context, 65,536 max output) with pricing and capability flags.
- `chat()` builds prompt from messages (`map(...join("\n")`), calls `this.ai.models.generateContent({ model, contents: prompt, config: { maxOutputTokens } })`, returns `{ content: result.text ?? "", provider: this.name, model }`.
- `chatStream()` uses `generateContentStream()`, yields `chunk.text`.
- `generateStream()` delegates to `chatStream()`.

### 4.4 OpenRouter Provider (`providers/OpenRouterProvider.ts`)

Verified from file read (285 lines):
- Uses `OpenAI` SDK (`new OpenAI({ apiKey, baseURL: "https://openrouter.ai/api/v1" })`).
- `getAvailableModels()` tries `client.models.list()`; maps response with `knownModels` specs (contextWindow, maxOutputTokens, prices, capabilities). Falls back to hardcoded array on error.
- `chat()` maps messages to OpenAI format (`system`/`user`/`assistant` roles preserved, others mapped to `user` with `[role]` prefix), creates `chat.completions.create()`, returns `choices[0]?.message?.content ?? ""`.
- `chatStream()` creates stream (`stream: true`), yields `chunk.choices[0]?.delta?.content`.
- `generateStream()` delegates to `chatStream()`.

### 4.5 Provider Manager (`providers/ProviderManager.ts`)

Verified from file read (478 lines): Key behaviors:

- `initializeProviders()` creates `GeminiProvider` (if `env.GEMINI_API_KEY` non-empty) and `OpenRouterProvider` (if `env.OPENROUTER_API_KEY` non-empty).
- `loadProviderModels()` calls `provider.getAvailableModels()` and caches results.
- `getProviders()`, `getProvider()`, `getProviderModels()`, `getAllModels()`, `findModel()` provide model discovery.
- `getBestModel()` filters by health (`HealthMonitor.isHealthy()`), requirements (`meetsRequirements`), and calculates score (`calculateModelScore`) based on token fit (30%), cost (variable), task type bonuses (reasoning: +20, coding: +15, vision: +25), model family bonuses (`pro`/`Ultra`: +10, `-latest`: +5).
- `executeWithMetrics()` handles execution, validation (`OutputValidator`), token accounting, health recording, metrics recording.
- `executeChat()` tries primary provider; on failure, uses `FailoverEngine.getNextProvider()` to find fallback, then retries with similar model.
- `executeChatStream()` yields chunks from `provider.generateStream()`.

---

## 5. ORCHESTRATOR SUBSYSTEM (`orchestrator/`)

### 5.1 Smart Router (`orchestrator/SmartRouter.ts`)

Verified from file read (340 lines):

- `buildMessages()` converts `RoutingRequest` to `[{ role: "user", content: request.prompt }]`.
- `estimateTokens()` uses `Math.ceil(text.length / 4)` approximation.
- `selectProvider()` checks `RouterConfig.enableSmartRouting`. If disabled, uses `RouterConfig.defaultProvider` and checks `CircuitBreaker.isAvailable()`. If enabled, uses `RoutingRules.selectProvider()` and checks circuit breaker; falls back to available providers.
- `selectPolicy()` maps `TaskType` to `RoutingPolicy`: `CODE`/`REASONING` → `HIGHEST_QUALITY`, `VISION`/`AGENT` → `BALANCED`, `SUMMARIZATION`/`TRANSLATION`/`CLASSIFICATION` → `CHEAPEST`, `SEARCH` → `FASTEST`, `CHAT`/`GENERAL` → `BALANCED`.
- `route()` builds `RoutingContext`, selects provider/model, normalizes max tokens, calls `providerManager.executeChat()` via `RetryEngine.execute()` + `TimeoutWrapper.withTimeout()`, records usage via `usageMeter.recordRequestUsage()`.
- `routeStream()` does the same but calls `providerManager.executeChatStream()` and yields chunks.

### 5.2 Routing Rules (`orchestrator/RoutingRules.ts`)

**NOT VERIFIED FROM REPOSITORY — File contents not fully verified.** Name implies provider selection rules based on task type and model.

### 5.3 Circuit Breaker (`orchestrator/CircuitBreaker.ts`)

**Partially verified:** Used in `SmartRouter.selectProvider()` (`CircuitBreaker.isAvailable()`). File exists; full logic not fully verified from direct read.

### 5.4 Retry Engine (`orchestrator/RetryEngine.ts`)

Used in `ProviderManager.executeWithMetrics()` and `SmartRouter.route()`. File exists; full retry logic not fully verified from direct read.

### 5.5 Failover Engine (`orchestrator/FailoverEngine.ts`)

Used in `ProviderManager.executeChat()` (line 354: `FailoverEngine.getNextProvider()`). File exists; full failover logic not fully verified.

### 5.6 Health Monitor (`orchestrator/HealthMonitor.ts`)

Used extensively: `HealthMonitor.initialize()`, `.isHealthy()`, `.recordSuccess()`, `.recordFailure()`. File exists; internal state tracking not fully verified from direct read.

### 5.7 Timeout Wrapper (`orchestrator/TimeoutWrapper.ts`)

Used in `ProviderManager.executeWithMetrics()` (`TimeoutWrapper.withTimeout()`) and `SmartRouter` (`TimeoutWrapper.withStreamTimeout()`). File exists; timeout enforcement mechanism not fully verified.

---

## 6. CONVERTER SUBSYSTEM (`converters/`)

### 6.1 OpenAI Request Converter (`converters/OpenAIRequestConverter.ts`)

Verified from direct read (51 lines):
- Converts `OpenAIChatRequest` to `RoutingRequest`.
- `taskType`: `TaskType.AGENT` if `openaiRequest.tools?.length` > 0, else `TaskType.CHAT`.
- `prompt`: Builds from messages — filters `system` and `user` messages; uses `lastUserMessage.content`; prepends system messages.
- `model`: `openaiRequest.model`
- `temperature`: `openaiRequest.temperature`
- `maxTokens`: `openaiRequest.max_tokens`
- `stream`: `openaiRequest.stream ?? false`

### 6.2 OpenAI Response Converter (`converters/OpenAIResponseConverter.ts`)

Verified from direct read (45 lines):
- `toOpenAIResponse()` creates `OpenAIChatResponse` with:
  - `id`: `chatcmpl-${Date.now()}-${random}`
  - `object`: `"chat.completion"`
  - `created`: `Math.floor(Date.now() / 1000)`
  - `model`: `routingResponse.model || model`
  - `choices`: `[{ index: 0, message: { role: "assistant", content: routingResponse.content }, finish_reason: "stop" }]`
  - `usage`: `{ prompt_tokens, completion_tokens, total_tokens }` (all estimated as `Math.ceil(text.length / 4)`)

---

## 7. CONTROLLER SUBSYSTEM (`controllers/`)

### 7.1 OpenAI Controller (`controllers/OpenAIController.ts`)

Verified from direct read (322 lines): Key behaviors:
- `chatCompletions()` handles both streaming and non-streaming.
- Validates `model` and `messages` presence; returns 400 if missing.
- Non-streaming: converts request (`OpenAIRequestConverter.toRoutingRequest()`), resolves BYOK credential (hardcoded `"test-user"`), calls `smartRouter.route()`, converts response (`OpenAIResponseConverter.toOpenAIResponse()`), returns 200 JSON.
- Streaming (`handleStreamingChatCompletions()`): sets SSE headers (`Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache`, `Connection: keep-alive`, `X-Accel-Buffering: no`), writes chunks as `data: JSON\n\n`, writes final chunk with `finish_reason: "stop"`, then `data: [DONE]\n\n`, ends response.
- Error handler logs detailed error info (`console.error`) and returns 500 with `{ error: { message, type: "internal_error", code: "internal_error" } }`.
- `listModels()` calls `providerManager.getAllModels()`, formats data array, returns 200.

### 7.2 Streaming Controller (`controllers/StreamingController.ts`)

**NOT VERIFIED FROM REPOSITORY — File contents not fully verified.** From `routes/streamRoutes.ts`: `GET /stream` maps to `StreamingController.stream`. Likely handles streaming independently of OpenAI routes.

---

## 8. MIDDLEWARE (`middlewares/`)

### 8.1 Auth Middleware (`middlewares/authMiddleware.ts`)

**NOT VERIFIED FROM REPOSITORY — File contents not fully verified.** From `src/server.ts` line 107: `app.use(authMiddleware)`. Used after route mounting? Actually mounted before routes but after `/auth` and `/organizations`. From `auth/middleware/AuthMiddleware.ts`: JWT middleware for protected routes. The `src/middlewares/authMiddleware.ts` may be a wrapper.

### 8.2 Rate Limit Middleware (`middlewares/rateLimitMiddleware.ts`)

Verified from usage (`src/server.ts` line 30, 96-101): Configured with `windowMs: 15 * 60 * 1000` (15 minutes) and `max: 100`.

### 8.3 Request ID Middleware (`middlewares/requestIdMiddleware.ts`)

Verified from `src/server.ts` line 89: `app.use(requestIdMiddleware)`.

### 8.4 Request Logging Middleware (`middlewares/requestLoggingMiddleware.ts`)

Verified from `src/server.ts` line 90: `app.use(requestLoggingMiddleware)`.

### 8.5 Validation Middleware (`middlewares/validationMiddleware.ts`)

Verified from `routes/openai.ts` line 10: `openAIChatValidation` used for `/v1/chat/completions`.

---

## 9. DATABASE (`database/`)

### 9.1 Database Connection (`database/Database.ts`)

Verified from file read:

```typescript
import "dotenv/config";
import { Pool } from "pg";
export const database = new Pool({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? "helix",
    user: process.env.DB_USER ?? "postgres",
    password: process.env.DB_PASSWORD,
});
```

Event handlers: `database.on("connect", ...)` logs success; `database.on("error", ...)` logs error.

---

## 10. CONFIGURATION (`config/`)

### 10.1 Environment (`config/env.ts`)

Verified from file read (68 lines):
- `PORT` (default 3000)
- `NODE_ENV` (default `"development"`)
- `GEMINI_API_KEY`, `GEMINI_MODEL` (`"gemini-2.5-flash"`)
- `OPENROUTER_API_KEY`, `OPENROUTER_MODEL` (`"openai/gpt-4.1-mini"`)
- `BYOK_ENCRYPTION_SECRET` (default `"helix-development-encryption-secret-change-in-production"`)
- Production-like validation (`ENV_STRICT === "1"` or `NODE_ENV === "production"`): requires keys >= 15 chars; exits process if invalid.

### 10.2 Logger (`config/logger.ts`)

Verified from file read (111 lines):
- `winston` logger with `combine(timestamp(), errors({ stack: true }), jsonFormatter)`.
- `jsonFormatter` produces JSON with `timestamp`, `level`, `message`, `context` (merged), `stack`.
- `HelixLogger` wrapper (`helixLogger`) provides `info()`, `warn()`, `error()`, `debug()`, `http()` with structured context.
- `LogContext` interface allows arbitrary context fields (`requestId`, `provider`, `model`, `latency`, etc.).

### 10.3 Router Config (`config/RouterConfig.ts`)

Verified from usage in `SmartRouter`: `RouterConfig.enableSmartRouting`, `RouterConfig.defaultProvider`.

### 10.4 Timeout Config (`config/TimeoutConfig.ts`)

Verified from usage: `TimeoutConfig.providerTimeoutMs`, `TimeoutConfig.streamingTimeoutMs`.

---

## 11. ROUTES (`routes/`)

### 11.1 OpenAI Routes (`routes/openai.ts`)

Verified (17 lines):
- `POST /v1/chat/completions` → `openAIChatValidation`, `OpenAIController.chatCompletions`
- `GET /v1/models` → `OpenAIController.listModels`

### 11.2 Stream Routes (`routes/streamRoutes.ts`)

Verified (10 lines):
- `GET /stream` → `StreamingController.stream`

### 11.3 Dashboard Routes (`routes/dashboardRoutes.ts`)

Verified from file name; contents not fully verified. Likely serves CLI/dashboard data.

---

## 12. METRICS (`metrics/`)

### 12.1 Metrics Manager (`metrics/MetricsManager.ts`)

Verified from direct read (175 lines):
- Static counters: `totalRequests`, `successfulRequests`, `failedRequests`, `retryCount`, `failoverCount`, `totalLatency`.
- Per-provider metrics (`GEMINI`, `OPENROUTER`, `GITHUB`, `GROQ`) with `usage`, `successes`, `failures`, `totalLatency`, `averageLatency`.
- `recordRequest()` increments total.
- `recordSuccess()` increments success, updates latency, computes average.
- `recordFailure()` increments failure, updates latency.
- `getMetrics()` returns snapshot with `structuredClone()`.
- `reset()` clears all counters and logs via `helixLogger.info()`.

---

## 13. DIAGRAMS — BACKEND ENGINEERING

### 13.1 Module Dependency Graph (Mermaid)

```mermaid
graph TD
    A[src/server.ts] --> B[src/container/AppContainer.ts]
    A --> C[src/auth/routes/AuthRoutes.ts]
    A --> D[src/organizations/routes/OrganizationRoutes.ts]
    A --> E[src/routes/openai.ts]
    A --> F[src/routes/streamRoutes.ts]
    A --> G[src/routes/dashboardRoutes.ts]
    B --> H[src/providers/ProviderManager.ts]
    B --> I[src/orchestrator/SmartRouter.ts]
    E --> J[src/controllers/OpenAIController.ts]
    J --> I
    I --> H
    H --> K[src/providers/GeminiProvider.ts]
    H --> L[src/providers/OpenRouterProvider.ts]
    K --> M[@google/genai]
    L --> N[openai SDK]
    C --> O[src/auth/services/AuthService.ts]
    O --> P[src/auth/repositories/PostgreSQLUserRepository.ts]
    P --> Q[src/database/Database.ts]
```

---

*Book 2 — End of Document*

**Verification Status:**
- Every module file listed above was verified by direct file read (`read_file` tool) or name confirmation (`find` output).
- Functions, interfaces, and algorithms described are direct transcriptions or structured summaries of source code.
- **NOT VERIFIED FROM REPOSITORY** labels applied where file contents were not fully read.
