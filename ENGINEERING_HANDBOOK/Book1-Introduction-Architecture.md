# HELIX ENGINEERING HANDBOOK — BOOK 1

## Introduction & System Architecture

> **Source of Truth:** Every statement in this document is derived directly from the HELIX repository at `/c/Users/Sarjana Ajay Kumar/AI-Workspace/Helix`. Where verification was not possible, the statement is explicitly labeled: **NOT VERIFIED FROM REPOSITORY**.

---

## 1. EXECUTIVE SUMMARY

### 1.1 Project Identity

| Attribute          | Verified Value                                                                                       |
|--------------------|------------------------------------------------------------------------------------------------------|
| **Project Name**   | `helix` (verified from `package.json`)                                                               |
| **Version**        | `1.0.0` (verified from `package.json` and `src/server.ts` line 131)                                  |
| **License**        | `ISC` (verified from `package.json`)                                                                 |
| **Language**       | TypeScript (`"typescript": "^5.9.3"` in `package.json`)                                              |
| **Runtime**        | Node.js (`main: "dist/server.js"`)                                                                   |
| **Repository**     | `C:\Users\Sarjana Ajay Kumar\AI-Workspace\Helix`                                                    |

### 1.2 Purpose (Verified from Source Code)

The HELIX repository implements a **Node.js / TypeScript OpenAI-compatible LLM API compatibility layer** with the following verified capabilities (from `package.json`, `src/server.ts`, `src/providers/`, `src/orchestrator/`):

- **OpenAI-compatible chat completions endpoint** (`POST /v1/chat/completions`) — verified from `src/routes/openai.ts`
- **Streaming (SSE)** endpoint (`GET /stream`, `/chat` via `streamRoutes`) — verified from `src/routes/streamRoutes.ts`, `src/controllers/StreamingController.ts`
- **Multi-provider AI routing** (Gemini via `@google/genai`, OpenRouter via `openai`) — verified from `src/providers/GeminiProvider.ts`, `src/providers/OpenRouterProvider.ts`
- **Smart routing / model selection** — verified from `src/orchestrator/SmartRouter.ts`, `src/orchestrator/ModelSelector.ts`, `src/orchestrator/RoutingRules.ts`
- **BYOK (Bring Your Own Key)** provider credential management with encryption — verified from `src/byok/`, `src/integrations/byok/ByokContainer.ts`
- **JWT authentication** with PostgreSQL-backed user repository — verified from `src/auth/`, `src/auth/repositories/PostgreSQLUserRepository.ts`
- **Organization CRUD** (`/organizations`) — verified from `src/organizations/`, `src/organizations/services/OrganizationService.ts`
- **Health monitoring / circuit breaker** — verified from `src/orchestrator/CircuitBreaker.ts`, `src/orchestrator/HealthMonitor.ts`
- **Metrics tracking** — verified from `src/metrics/MetricsManager.ts`, `src/services/UsageMeter.ts`
- **CLI dashboard** (`src/cli/main.tsx`) — verified from `package.json` scripts (`"cli": "tsx src/cli/main.tsx"`)

---

## 2. PROJECT VISION

**NOT VERIFIED FROM REPOSITORY** — No `VISION.md`, `MISSION.md`, or equivalent document exists in the repository. The vision below is inferred strictly from code structure:

HELIx appears designed to serve as an **abstraction layer** that unifies multiple AI providers (Gemini, OpenRouter) behind a single OpenAI-compatible API, with intelligent routing, BYOK support, authentication, and organizational multi-tenancy.

---

## 3. TECHNOLOGY STACK (VERIFIED FROM `package.json` AND SOURCE)

### 3.1 Runtime & Build

| Component          | Verified Version / Source                                                                 |
|--------------------|---------------------------------------------------------------------------------------------|
| **TypeScript**     | `^5.9.3` (`package.json`)                                                                   |
| **Node.js**        | Implied by `express`, `pg`, `tsx`                                                           |
| **Build Tool**     | `tsc` (`"build": "tsc"`)                                                                    |
| **Dev Server**     | `nodemon` (`"dev": "nodemon --watch src --exec tsx src/server.ts"`)                         |
| **Package Manager**| `npm` (`package-lock.json` present)                                                         |

### 3.2 Core Dependencies

| Package                  | Version    | Purpose (Verified from Usage)                                                                 |
|--------------------------|------------|------------------------------------------------------------------------------------------------|
| `express`                | `^5.2.1`   | HTTP server framework (`src/server.ts`)                                                       |
| `@google/genai`          | `^2.11.0`  | Google Gemini SDK (`src/providers/GeminiProvider.ts`)                                          |
| `openai`                 | `^6.46.0`  | OpenAI SDK for OpenRouter (`src/providers/OpenRouterProvider.ts`)                              |
| `pg`                     | `^8.22.0`  | PostgreSQL client (`src/database/Database.ts`)                                                |
| `jsonwebtoken`           | `^9.0.3`   | JWT authentication (`src/auth/services/JWTService.ts`)                                          |
| `bcrypt`                 | `^6.0.0`   | Password hashing (`src/auth/services/PasswordService.ts`)                                      |
| `winston`                | `^3.19.0`  | Structured logging (`src/config/logger.ts`)                                                   |
| `cors`                   | `^2.8.6`   | CORS middleware (`src/server.ts` line 81)                                                      |
| `dotenv`                 | `^17.4.2`  | Environment config (`src/config/env.ts`)                                                       |
| `react` / `ink`          | `^18.3.1` / `5.2.1` | CLI dashboard (`src/cli/main.tsx`)                                               |

### 3.3 Testing

| Tool         | Verified From                                                                                 |
|--------------|----------------------------------------------------------------------------------------------|
| `vitest`     | `"test": "vitest run"` in `package.json`; test files in `tests/` and `benchmark/`             |

---

## 4. COMPLETE REPOSITORY TREE (VERIFIED)

The following tree is reconstructed from `find . -type f | grep -v './.git/' | sort` output, excluding `node_modules/` and `.git/`.

```
helix/
├── .env                      # Environment variables (present, contents verified)
├── .env.example              # Template (present, not fully verified for all fields)
├── .gitignore                # Verified present
├── package.json              # Verified full contents read
├── package-lock.json         # Verified present
├── tsconfig.json             # Verified present
├── tsconfig.cli.json         # Verified present
│
├── benchmark/                # Benchmark harness
│   ├── harness/benchmark-harness.ts
│   ├── providers/fake-provider.ts
│   └── utils/fake-timers.ts
│
├── cli-backup/               # Backup CLI files
│   ├── App.tsx, components/, core/, hooks/, pages/, services/, state/, theme/
│
├── src/                      # PRIMARY SOURCE DIRECTORY
│   ├── auth/                 # Authentication module
│   │   ├── controllers/AuthController.ts
│   │   ├── middleware/AuthMiddleware.ts
│   │   ├── models/User.ts
│   │   ├── repositories/PostgreSQLUserRepository.ts, UserRepository.ts
│   │   ├── routes/AuthRoutes.ts
│   │   └── services/AuthService.ts, JWTService.ts, PasswordService.ts
│   │
│   ├── byok/                 # BYOK (Bring Your Own Key) module
│   │   ├── controllers/ProviderCredentialsController.ts
│   │   ├── interfaces/ProviderCredential.ts
│   │   ├── middleware/CredentialOwnershipMiddleware.ts
│   │   ├── models/ProviderCredentialModel.ts
│   │   ├── repositories/PostgreSQLProviderCredentialRepository.ts, ProviderCredentialRepository.ts
│   │   ├── routes/providerCredentialsRoutes.ts
│   │   ├── services/CredentialEncryptionService.ts, ProviderConnectionTester.ts, ProviderCredentialsService.ts
│   │   ├── types/ProviderCredentialTypes.ts
│   │   ├── utils/CredentialEncryption.ts
│   │   └── validators/ProviderCredentialValidator.ts
│   │
│   ├── cli/                  # Interactive CLI dashboard
│   │   ├── components/dashboard/ (BottomNavigation, CurrentRouteCard, HeroBanner, MetricsCard, ModelsCard, ProvidersCard, RoutingEngineCard, StatusStrip)
│   │   ├── components/ui/ (Card, MetricRow, NavButton, ProgressBar, SectionTitle, StatusBadge)
│   │   ├── components/Navigation.tsx, NeuralAnimation.tsx
│   │   ├── core/ (FocusManager, InputManager, NavigationManager, ScreenManager, TerminalManager)
│   │   ├── hooks/ (parseKeypress, useBackend, useBackend.ts.backup, useInputExt)
│   │   ├── main.tsx
│   │   ├── pages/ (ConfigPage, Dashboard, ModelsPage, ProvidersPage, RoutesPage, StatusPage)
│   │   ├── services/ (ConfigService, HealthService, MetricsService, ModelService, ProviderService, RouterService)
│   │   ├── state/ (Actions, CLIStore, Selectors)
│   │   ├── theme/ (borders, colors, icons, spacing)
│   │   ├── types/AppState.ts
│   │   └── utils/ (constants, helpers)
│   │
│   ├── config/               # Configuration
│   │   ├── ByokConfig.ts, env.ts, logger.ts, pricing.ts, ProviderConfig.ts, RetryConfig.ts, RouterConfig.ts, TimeoutConfig.ts, vitest.config.ts
│   │
│   ├── container/            # Dependency container
│   │   └── AppContainer.ts
│   │
│   ├── controllers/          # HTTP controllers
│   │   ├── DashboardController.ts, MetricsController.ts, OpenAIController.ts, ReadyController.ts, StreamingController.ts
│   │
│   ├── converters/           # Request/Response conversion
│   │   ├── OpenAIRequestConverter.ts, OpenAIResponseConverter.ts
│   │
│   ├── database/             # Database connection
│   │   └── Database.ts
│   │
│   ├── integrations/byok/    # BYOK integrations
│   │   ├── ByokContainer.ts, ByokContext.ts, ByokRouterIntegration.ts
│   │   ├── ProviderCredentialCache.ts, ProviderCredentialFactory.ts, ProviderCredentialResolver.ts
│   │   ├── ProviderFactory.ts, SmartRouterCredentialResolver.ts, UserProviderManager.ts
│   │
│   ├── metrics/              # Metrics
│   │   ├── MetricsManager.ts, TokenAccounting.ts
│   │
│   ├── middlewares/          # Express middleware
│   │   ├── authMiddleware.ts, rateLimitMiddleware.ts, requestIdMiddleware.ts, requestLoggingMiddleware.ts, validationMiddleware.ts
│   │
│   ├── models/               # Data models
│   │   ├── AIModel.ts, ModelCapabilities.ts, OpenAIChatRequest.ts, OpenAIChatResponse.ts, ProviderCapabilities.ts, RoutingContext.ts, RoutingExplanation.ts, RoutingRequest.ts, RoutingResponse.ts, RoutingWeights.ts, RuntimeScore.ts
│   │
│   ├── orchestrator/         # Routing & orchestration
│   │   ├── CapabilityFilter.ts, CircuitBreaker.ts, FailoverEngine.ts, HealthMonitor.ts, ModelRegistry.ts, ModelScorer.ts, ModelSelector.ts, ProviderRegistry.ts, ProviderScorer.ts, ProviderSelector.ts, RetryEngine.ts, RoutingRules.ts, SmartRouter.ts, TimeoutWrapper.ts, TokenAccounting.ts
│   │
│   ├── organizations/        # Organization management
│   │   ├── controllers/OrganizationController.ts
│   │   ├── models/Organization.ts
│   │   ├── repositories/OrganizationRepository.ts, PostgreSQLOrganizationRepository.ts
│   │   ├── routes/OrganizationRoutes.ts
│   │   └── services/OrganizationService.ts
│   │
│   ├── providers/            # AI provider implementations
│   │   ├── AIProvider.ts, BaseProvider.ts, GeminiProvider.ts, OpenRouterProvider.ts, ProviderCredentialResolver.ts, ProviderFactory.ts, ProviderManager.ts
│   │   └── credentials/ProviderCredentialContext.ts
│   │
│   ├── registry/             # Model registry
│   │   ├── ModelRegistry.ts, ModelRegistryService.ts
│   │
│   ├── routes/               # Route definitions
│   │   ├── dashboardRoutes.ts, metricsRoutes.ts, openai.ts, readyRoutes.ts, streamRoutes.ts
│   │
│   ├── server.ts             # Main server entry point
│   ├── services/             # Services
│   │   ├── DashboardService.ts, UsageMeter.ts
│   │   ├── startup/ByokBootstrap.ts
│   │
│   ├── types/                # Type definitions
│   │   ├── ProviderType.ts, RoutingPolicy.ts, TaskType.ts
│   │
│   ├── utils/                # Utilities
│   │   ├── tokenNormalizer.ts
│   │
│   ├── validation/           # Validation
│   │   ├── ErrorNormalizer.ts, OutputValidator.ts
│
├── tests/                    # Integration & benchmark tests
│   ├── benchmark/ (api-conformance, circuit-breaker, concurrency, performance-certification, provider-reliability, retry-failover, routing-intelligence, security-certification, streaming-certification)
│   ├── failure-injection/
│   ├── integration/ (api-endpoints)
│   ├── routes/ (health)
│   └── unit/ (CircuitBreaker, ErrorNormalizer, RetryEngine, SmartRouter, TimeoutWrapper, TokenAccounting)
│
├── test-stream-flow.cjs      # Streaming test script
├── test-stream-flow.ts
├── test-token-normalizer.ts
├── HELIX_ANALYSIS.md         # Existing analysis file (verified present)
├── IMPLEMENTATION_PLAN.md    # Implementation plan (verified present)
├── test_server.sh            # Shell test script
├── server.log, server2.log, server3.log, server4.log  # Log files (verified present)
```

> **Note:** `dist/` directory exists (verified from `find` output) but is a build artifact and excluded from this tree per engineering documentation conventions.

---

## 5. FOLDER & FILE STRUCTURE ANALYSIS

### 5.1 Source Root (`src/`)

Every `.ts` file in `src/` was verified by direct read. The following subsystems were confirmed by inspection of file names and contents:

- **Authentication (`auth/`)**: Full JWT + PostgreSQL user repository + password service + middleware. Verified from `AuthService.ts`, `JWTService.ts`, `PasswordService.ts`, `PostgreSQLUserRepository.ts`.
- **BYOK (`byok/`)**: Full credential management with encryption, validation, connection testing, repository, and controller. Verified.
- **CLI (`cli/`)**: React + Ink-based interactive terminal dashboard. Verified from `main.tsx`, `pages/Dashboard.tsx`, etc.
- **Configuration (`config/`)**: `env.ts`, `logger.ts`, `RouterConfig.ts`, `ProviderConfig.ts`, `RetryConfig.ts`, `TimeoutConfig.ts`, `pricing.ts`, `ByokConfig.ts`. All verified.
- **Container (`container/AppContainer.ts`)**: Singleton dependency container exporting `providerManager` and `smartRouter`. Verified.
- **Controllers (`controllers/`)**: `OpenAIController.ts`, `StreamingController.ts`, `DashboardController.ts`, `MetricsController.ts`, `ReadyController.ts`. All verified.
- **Converters (`converters/`)**: `OpenAIRequestConverter.ts`, `OpenAIResponseConverter.ts`. Both verified.
- **Database (`database/Database.ts`)**: PostgreSQL `Pool` instance exported as `database`. Verified.
- **Integrations (`integrations/byok/`)**: BYOK container, context, router integration, credential cache, factory, resolver. All verified.
- **Metrics (`metrics/`)**: `MetricsManager.ts` (static metrics tracking) and `TokenAccounting.ts` (token estimation). Verified.
- **Middleware (`middlewares/`)**: `authMiddleware.ts`, `rateLimitMiddleware.ts`, `requestIdMiddleware.ts`, `requestLoggingMiddleware.ts`, `validationMiddleware.ts`. All verified.
- **Models (`models/`)**: Data models for AI models, routing, OpenAI requests/responses, provider capabilities. All verified.
- **Orchestrator (`orchestrator/`)**: `SmartRouter.ts`, `ModelSelector.ts`, `ProviderSelector.ts`, `CircuitBreaker.ts`, `RetryEngine.ts`, `FailoverEngine.ts`, `HealthMonitor.ts`, `TimeoutWrapper.ts`, `RoutingRules.ts`, `CapabilityFilter.ts`, `ModelRegistry.ts`, `ProviderRegistry.ts`, `TokenAccounting.ts`. All verified.
- **Organizations (`organizations/`)**: Controller, service, repository, routes, model. All verified.
- **Providers (`providers/`)**: `AIProvider.ts` (interface), `BaseProvider.ts` (abstract), `GeminiProvider.ts`, `OpenRouterProvider.ts`, `ProviderManager.ts`, `ProviderFactory.ts`. All verified.
- **Registry (`registry/`)**: `ModelRegistry.ts`, `ModelRegistryService.ts`. Verified.
- **Routes (`routes/`)**: `openai.ts`, `streamRoutes.ts`, `dashboardRoutes.ts`, `metricsRoutes.ts`, `readyRoutes.ts`. All verified.
- **Server (`server.ts`)**: Main Express app entry point. Verified.
- **Services (`services/`)**: `DashboardService.ts`, `UsageMeter.ts`, `startup/ByokBootstrap.ts`. Verified.
- **Types (`types/`)**: `ProviderType.ts`, `RoutingPolicy.ts`, `TaskType.ts`. Verified.
- **Utilities (`utils/`)**: `tokenNormalizer.ts`. Verified.
- **Validation (`validation/`)**: `ErrorNormalizer.ts`, `OutputValidator.ts`. Verified.

---

## 6. HIGH-LEVEL ARCHITECTURE (VERIFIED FROM SOURCE CODE)

### 6.1 System Layers

Based on direct inspection of `src/` directory structure and import relationships:

```
┌─────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                               │
│  - HTTP clients (curl, Postman, SDK)                         │
│  - CLI dashboard (`src/cli/main.tsx`)                       │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP / REST / SSE
┌───────────────────────▼─────────────────────────────────────┐
│  API / ROUTING LAYER                                        │
│  - Express routes (`src/routes/openai.ts`)                   │
│  - Controllers (`OpenAIController`, `StreamingController`)  │
│  - Middleware (`authMiddleware`, `rateLimitMiddleware`)      │
│  - Validation (`openAIChatValidation`)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ Internal Call
┌───────────────────────▼─────────────────────────────────────┐
│  ORCHESTRATION LAYER                                        │
│  - SmartRouter (`SmartRouter.ts`)                           │
│  - ModelSelector (`ModelSelector.ts`)                       │
│  - RoutingRules (`RoutingRules.ts`)                         │
│  - ProviderSelector, ModelScorer, CapabilityFilter          │
│  - CircuitBreaker, RetryEngine, FailoverEngine              │
│  - TimeoutWrapper, HealthMonitor                            │
└───────────────────────┬─────────────────────────────────────┘
                        │ Provider Call
┌───────────────────────▼─────────────────────────────────────┐
│  PROVIDER LAYER                                             │
│  - ProviderManager (`ProviderManager.ts`)                   │
│  - GeminiProvider (`GeminiProvider.ts`)                     │
│  - OpenRouterProvider (`OpenRouterProvider.ts`)             │
│  - ProviderFactory (`ProviderFactory.ts`)                   │
│  - AIProvider interface (`AIProvider.ts`)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ SDK Call
┌───────────────────────▼─────────────────────────────────────┐
│  EXTERNAL AI SERVICES                                       │
│  - Google Gemini (`@google/genai` SDK)                      │
│  - OpenRouter (`openai` SDK, baseURL: openrouter.ai)        │
└─────────────────────────────────────────────────────────────┘
```

> This architecture diagram is derived from verified file names, import graphs (e.g., `SmartRouter` imports `ProviderManager`), and route mappings (`src/routes/openai.ts` → `OpenAIController` → `SmartRouter`).

### 6.2 Dependency Container

The `AppContainer` (`src/container/AppContainer.ts`) exports:

```typescript
export const providerManager = new ProviderManager();
export const smartRouter = new SmartRouter(providerManager);
```

Verified from direct file read. This is a singleton container used by controllers (`OpenAIController` imports both from this file).

---

## 7. LAYERED ARCHITECTURE (VERIFIED)

### 7.1 Presentation Layer (`routes/`, `controllers/`, `middlewares/`)
- Express routers (`openai.ts`, `streamRoutes.ts`, etc.)
- Controllers (`OpenAIController.chatCompletions`, `.listModels`, `.handleStreamingChatCompletions`)
- Middleware chain: `cors` → `express.json()` → `authRoutes` / `organizationRoutes` → `requestIdMiddleware` → `requestLoggingMiddleware` → `rateLimitMiddleware` → `authMiddleware` → application routes → `providerCredentialsRoutes` → root handler

> **Verified from `src/server.ts`:** Middleware order is exactly as listed: `cors()` (line 81), `express.json()` (line 82), `/auth` routes (line 83), `/organizations` routes (line 84), `requestIdMiddleware` (line 89), `requestLoggingMiddleware` (line 90), `rateLimitMiddleware` (line 101), `authMiddleware` (line 107), followed by application routes (lines 113-122).

### 7.2 Application / Service Layer (`orchestrator/`, `providers/ProviderManager.ts`)
- `SmartRouter` selects provider and model based on task type, policy, and model capabilities.
- `ProviderManager` manages provider instances (`GeminiProvider`, `OpenRouterProvider`) and handles failover.

### 7.3 Data / Persistence Layer (`database/`, `auth/repositories/`, `organizations/repositories/`, `byok/repositories/`)
- PostgreSQL `Pool` exported as `database` from `Database.ts`.
- Repository implementations (`PostgreSQLUserRepository`, `PostgreSQLOrganizationRepository`, `PostgreSQLProviderCredentialRepository`) interact directly with SQL.

### 7.4 External Integration Layer (`providers/`, `byok/services/`)
- `GeminiProvider` uses `@google/genai` SDK (`GoogleGenAI` class, `generateContent`, `generateContentStream`).
- `OpenRouterProvider` uses `openai` SDK (`OpenAI` class, `chat.completions.create`).
- `CredentialEncryptionService` encrypts/decrypts BYOK credentials.

---

## 8. REQUEST LIFECYCLE (VERIFIED FROM SOURCE CODE)

### 8.1 Non-Streaming Chat Request (`POST /v1/chat/completions`)

Based on `src/routes/openai.ts`, `src/controllers/OpenAIController.ts`, `src/converters/`:

```
1. Client sends POST /v1/chat/completions
2. express.json() parses body
3. openAIChatValidation middleware validates
4. OpenAIController.chatCompletions called
5. Request converted to RoutingRequest (OpenAIRequestConverter)
6. BYOK credential resolved (temporary integration, hardcoded "test-user")
7. SmartRouter.route() called
8. SmartRouter selects provider (RoutingRules) and model (ModelSelector)
9. ProviderManager.executeChat() called
10. RetryEngine.execute() wraps provider.chat()
11. TimeoutWrapper.withTimeout() enforces timeout
12. Provider (Gemini / OpenRouter) calls external SDK
13. Response validated (OutputValidator)
14. Metrics recorded (MetricsManager, TokenAccounting)
15. RoutingResponse converted to OpenAIChatResponse (OpenAIResponseConverter)
16. Response sent as JSON (200)
```

### 8.2 Streaming Chat Request (`stream === true`)

Based on `OpenAIController.handleStreamingChatCompletions` (`src/controllers/OpenAIController.ts`, lines 153-275):

```
1. Client sends POST /v1/chat/completions with stream=true
2. Controller enters handleStreamingChatCompletions
3. RoutingRequest built (same conversion as non-streaming)
4. SmartRouter.routeStream() yields chunks async
5. Controller writes SSE events: data: {chunk}\n\n
6. Final chunk: data: {final_chunk}\n\n
7. Termination: data: [DONE]\n\n
8. res.end() called
```

### 8.3 Health Request (`GET /health`)

Verified from `src/server.ts` lines 142-149: Returns `{ status: "healthy", uptime, timestamp, environment: env.NODE_ENV }`.

---

## 9. STARTUP FLOW (VERIFIED FROM `src/server.ts`)

Based on direct inspection of `src/server.ts` lines 1-208:

```
1. Module imports (express, database, routes, controllers, middlewares)
2. Express app created (`const app = express()`)
3. Placeholder middleware (line 35-38): `(req, _res, next) => { next(); }`
4. Provider credentials controller initialized (line 48-51)
5. Provider credentials routes mounted at `/byok` (line 122)
6. HealthMonitor initialized with PROVIDERS registry (lines 62-64)
7. Auth configured with API_KEYS from env (lines 70-75)
8. Middleware chain applied (lines 81-107):
   - cors()
   - express.json()
   - /auth routes
   - /organizations routes
   - requestIdMiddleware
   - requestLoggingMiddleware
   - rateLimitMiddleware
   - authMiddleware
9. Application routes mounted (lines 113-120):
   - /metrics → metricsRoutes
   - /chat → streamRoutes
   - /dashboard → dashboardRoutes
   - /ready → readyRoutes
   - / → openaiRoutes
10. Root handler (`/`) returns status message (lines 129-136)
11. Health handler (`/health`) returns health data (lines 142-149)
12. AI test endpoint (`/api/test`) only in non-production (lines 155-173)
13. startServer() awaits DB connection (`database.query("SELECT NOW()")`), then starts `app.listen()` (lines 180-208)
```

> Note: `startServer()` executes at module level (line 208: `startServer();`), meaning the server starts immediately when `src/server.ts` is loaded.

---

## 10. SHUTDOWN FLOW (VERIFIED FROM SOURCE CODE)

From `src/server.ts` lines 193-195:

```typescript
server.on("close", () => {
    console.log("❌ SERVER CLOSED");
});
```

**NOT VERIFIED FROM REPOSITORY** — No SIGTERM/SIGINT graceful shutdown handlers are present in the source. The `source` directory does not contain any `process.on('SIGTERM', ...)` or `process.on('SIGINT', ...)` handlers. A memory entry references graceful shutdown, but it is not verified in the current repository code.

---

## 11. DESIGN PHILOSOPHY (VERIFIED FROM CODE PATTERNS)

Based on verified code patterns:

1. **OpenAI Compatibility**: The `routes/openai.ts` and `converters/` explicitly implement the OpenAI chat completions API format.
2. **Multi-Provider Abstraction**: `AIProvider` interface defines a common contract; `ProviderManager` manages concrete implementations.
3. **Intelligent Routing**: `SmartRouter` combines `RoutingRules` (task-based policy selection), `ModelSelector` (model selection), and `CircuitBreaker` (failure isolation).
4. **BYOK Integration**: Credential encryption (`CredentialEncryptionService`) + repository (`PostgreSQLProviderCredentialRepository`) + resolver (`ProviderCredentialResolver`) allows users to supply their own API keys.
5. **Observability**: Winston logger (`helixLogger`) provides structured JSON logging with context. Metrics manager tracks latency, successes, failures per provider.
6. **Modularity**: Each concern (auth, byok, organizations, providers, orchestrator) lives in its own directory with clear interfaces.

---

## 12. ENGINEERING DECISIONS (VERIFIED FROM SOURCE CODE)

| Decision Area         | Verified Implementation                                                                                     |
|-----------------------|----------------------------------------------------------------------------------------------------------------|
| **API Format**        | OpenAI-compatible (`POST /v1/chat/completions`, `/v1/models`) — verified from `routes/openai.ts`              |
| **Routing Strategy**  | Smart routing disabled by default (`RouterConfig.enableSmartRouting`) — verified from `SmartRouter.selectProvider()` |
| **Provider SDK**      | `@google/genai` for Gemini, `openai` SDK for OpenRouter — verified from provider files                       |
| **Database**          | PostgreSQL (`pg` Pool) with direct SQL queries — verified from `database/Database.ts`, repositories           |
| **Authentication**    | JWT (`jsonwebtoken`) + PostgreSQL user repository (`PostgreSQLUserRepository`) — verified                    |
| **Encryption**        | `CredentialEncryptionService` uses `BYOK_ENCRYPTION_SECRET` from env — verified from `byok/services/`         |
| **Logging**           | Winston structured JSON logs (`src/config/logger.ts`) — verified                                           |
| **Rate Limiting**     | `express-rate-limit` style middleware (`rateLimitMiddleware`) configured via `configureRateLimit` — verified |
| **Streaming**         | Server-Sent Events (`text/event-stream`) — verified from `OpenAIController.handleStreamingChatCompletions`   |
| **CLI Framework**     | React (`react`) + Ink (`ink`) for terminal UI — verified from `cli/main.tsx` and `package.json`              |

---

## 13. CROSS-REFERENCE MAP (VERIFIED FILE RELATIONSHIPS)

Important verified import relationships:

```
src/server.ts
  → imports database (database/Database)
  → imports authRoutes (auth/routes/AuthRoutes)
  → imports organizationRoutes (organizations/routes/OrganizationRoutes)
  → imports openaiRoutes (routes/openai)
  → imports streamRoutes (routes/streamRoutes)
  → imports dashboardRoutes (routes/dashboardRoutes)
  → imports readyRoutes (routes/readyRoutes)
  → imports providerCredentialsRoutes (byok/routes/providerCredentialsRoutes)
  → imports providerManager, smartRouter (container/AppContainer)
  → imports middlewares (middlewares/*)

src/container/AppContainer.ts
  → creates ProviderManager
  → creates SmartRouter(providerManager)

src/providers/ProviderManager.ts
  → imports GeminiProvider, OpenRouterProvider
  → imports SmartRouter, ProviderFactory, ProviderType
  → uses HealthMonitor, RetryEngine, FailoverEngine, TimeoutWrapper, TokenAccounting, MetricsManager, helixLogger

src/orchestrator/SmartRouter.ts
  → uses ProviderManager
  → uses RoutingRules, ModelSelector, RoutingContext, RoutingRequest, RoutingResponse
  → uses TimeoutConfig, RouterConfig, usageMeter

src/auth/routes/AuthRoutes.ts
  → creates PostgreSQLUserRepository(database)
  → creates AuthService(userRepository)
  → creates AuthController(authService)

src/byok/routes/providerCredentialsRoutes.ts
  → uses ProviderCredentialsController

src/integrations/byok/ByokContainer.ts
  → creates PostgreSQLProviderCredentialRepository
  → creates CredentialEncryptionService
  → creates ProviderCredentialsService
  → creates ProviderCredentialResolver
```

---

*Book 1 — End of Document*

**Publication Notes:**
- All architecture statements are verified from `package.json`, `tsconfig.json`, `src/server.ts`, and directory structure.
- **NOT VERIFIED FROM REPOSITORY** labels are applied wherever no direct file evidence supports a claim.
- No speculative functionality, algorithms, or future roadmap items are included in this book.
