# HELIX ENGINEERING HANDBOOK — MASTER INDEX

> **Publication Date:** Derived from session timestamp (conversation started: Tuesday, August 04, 2026)
> **Repository Source:** `C:\Users\Sarjana Ajay Kumar\AI-Workspace\Helix`
> **Branch:** `feature/byok-api`
> **Commit:** `a7846d9 feat(organizations): implement organization CRUD with validation and shared app container`

---

## BOOK OVERVIEW

| Book | Title | Pages | File | Focus Area |
|------|-------|-------|------|-----------|
| **Book 1** | Introduction & System Architecture | ~33 KB | `Book1-Introduction-Architecture.md` | Executive summary, technology stack, repository tree, high-level architecture, startup/shutdown flow, design philosophy, engineering decisions |
| **Book 2** | Backend Engineering | ~25 KB | `Book2-Backend-Engineering.md` | Every verified module: auth, BYOK, providers (Gemini/OpenRouter), orchestrator, converters, controllers, middleware, database, config, routes, metrics |
| **Book 3** | Database & APIs | ~20 KB | `Book3-Database-APIs.md` | Schema (reconstructed from repositories), API endpoints, request/response formats, authentication flow, streaming flow, status codes |
| **Book 4** | System Design & Future | ~19 KB | `Book4-System-Design-Future.md` | 18 verified features, 10 verified limitations, multi-tenancy (partial), RBAC (not verified), deployment (no Docker/K8s), monitoring (basic), testing strategy, maintenance guide, future roadmap |

---

## DIAGRAM FILES (MERMAID + ASCII + STRUCTURAL)

| Diagram Type | File Reference | Description |
|-------------|-----------------|-------------|
| Repository Tree | `Book1` Section 4 | Complete `find`-verified file tree (excluding `.git/`, `node_modules/`) |
| Architecture Layer | `Book1` Section 6.1 | 5-layer architecture: Client → API → Orchestration → Provider → External |
| Module Dependency Graph | `Book2` Section 13.1 | Mermaid graph: server → container → providers → SDKs |
| Request Lifecycle | `Book1` Section 8.1 / `Book4` Section 11.2 | Non-streaming and streaming request flow |
| State Diagram | `Book4` Section 3 | Smart routing enabled/disabled state |
| Component Diagram | `Book4` Section 11.1 | Client → API → Orchestration → Provider → Persistence → External |
| Activity Diagram | `Book4` Section 11.2 | Request lifecycle flowchart |
| Mind Map | `Book4` Section 11.3 | Key engineering areas |
| Sequence Diagram (Streaming) | `Book3` Section 10 | Client → Controller → SmartRouter → Provider → SSE |

---

## VERIFICATION MANIFEST

Every file and module referenced in this handbook was verified using the following methods:

1. **Direct file read (`read_file`)** — Used for all `.ts` source files listed in Books 1-4.
2. **Directory listing (`find`)** — Used to confirm complete repository structure.
3. **Search (`search_files`)** — Used to locate import relationships and file relationships.
4. **Package manifest (`cat package.json`)** — Verified all dependencies, scripts, and versions.
5. **File inspection (`ls -la`)** — Confirmed presence of `.env`, `.env.example`, `dist/`, test directories.

---

## KEY VERIFIED FILES (SAMPLE LIST)

These files were read in full or substantial part during the reverse engineering process:

- `package.json`
- `tsconfig.json`
- `src/server.ts`
- `src/config/env.ts`
- `src/config/logger.ts`
- `src/container/AppContainer.ts`
- `src/providers/ProviderManager.ts` (478 lines)
- `src/providers/GeminiProvider.ts` (194 lines)
- `src/providers/OpenRouterProvider.ts` (285 lines)
- `src/providers/AIProvider.ts` (70 lines)
- `src/providers/BaseProvider.ts` (37 lines)
- `src/orchestrator/SmartRouter.ts` (340 lines)
- `src/auth/services/AuthService.ts` (140 lines)
- `src/auth/routes/AuthRoutes.ts` (33 lines)
- `src/auth/repositories/PostgreSQLUserRepository.ts` (125 lines)
- `src/auth/middleware/AuthMiddleware.ts` (51 lines)
- `src/auth/services/JWTService.ts` (not fully verified)
- `src/auth/services/PasswordService.ts` (not fully verified)
- `src/organizations/services/OrganizationService.ts` (177 lines)
- `src/organizations/repositories/PostgreSQLOrganizationRepository.ts` (152 lines)
- `src/byok/services/ProviderCredentialsService.ts` (186 lines)
- `src/integrations/byok/ByokContainer.ts` (41 lines)
- `src/converters/OpenAIRequestConverter.ts` (51 lines)
- `src/converters/OpenAIResponseConverter.ts` (45 lines)
- `src/controllers/OpenAIController.ts` (322 lines)
- `src/routes/openai.ts` (17 lines)
- `src/routes/streamRoutes.ts` (10 lines)
- `src/database/Database.ts` (17 lines)
- `src/metrics/MetricsManager.ts` (175 lines)
- `.env` and `.env.example`

---

## NOT VERIFIED ITEMS SUMMARY

Items explicitly labeled **NOT VERIFIED FROM REPOSITORY** in this handbook include (but are not limited to):

- Graceful shutdown (SIGTERM/SIGINT) handlers (`src/server.ts` only has `close` event handler).
- Full contents of `src/auth/services/JWTService.ts`, `PasswordService.ts`.
- Full contents of `byok/repositories/PostgreSQLProviderCredentialRepository.ts`.
- Full contents of `orchestrator/CircuitBreaker.ts`, `RetryEngine.ts`, `FailoverEngine.ts`, `TimeoutWrapper.ts`, `RoutingRules.ts`, `HealthMonitor.ts`.
- Full contents of `middlewares/authMiddleware.ts` (wrapper), `rateLimitMiddleware.ts`, `requestIdMiddleware.ts`, `requestLoggingMiddleware.ts`, `validationMiddleware.ts`.
- Full contents of `controllers/StreamingController.ts`, `DashboardController.ts`, `MetricsController.ts`, `ReadyController.ts`.
- Full contents of `routes/dashboardRoutes.ts`, `routes/metricsRoutes.ts`, `routes/readyRoutes.ts`.
- `.sql` schema definition files (none exist).
- `Dockerfile`, `docker-compose.yml`, Kubernetes manifests.
- `src/cli/` interactive dashboard behavior (files present, runtime not verified).
- Migration framework or schema version management.
- Log rotation configuration (Winston file transport exists, rotation rules not verified).
- External monitoring integrations (Prometheus, Grafana, etc.).

---

## CROSS-REFERENCE INDEX

| Topic                  | Book  | Section            | Related Sections            |
|------------------------|-------|-------------------|----------------------------|
| Server startup         | 1     | 9 (Startup Flow)  | 2.11 (Server file)          |
| Middleware order       | 1     | 7.1 (Presentation Layer) | 1.6 (Architecture)     |
| Provider interface     | 2     | 4.1 (AIProvider)  | 4.3 (GeminiProvider), 4.4 (OpenRouterProvider) |
| Smart routing          | 2     | 5.1 (SmartRouter) | 4.5 (ProviderManager)       |
| Authentication         | 2     | 2 (Auth Subsystem) | 3.1.3 (Auth Endpoints), 6.1 (JWT Flow) |
| BYOK encryption        | 2     | 3.4 (Encryption)  | 3.7 (Integration Container) |
| OpenAI compatibility   | 1     | 7 (Request Lifecycle) | 3.2 (Endpoint Catalog)  |
| Streaming flow         | 3     | 10 (Streaming Diagram) | 1 (Books cross-reference) |
| Metrics               | 2     | 12 (Metrics Manager) | 4.5 (ProviderManager metrics) |
| Multi-tenancy         | 4     | 4 (Multi-Tenancy) | 3.4 (BYOK), 2.3 (Organization Service) |
| RBAC                  | 4     | 5 (RBAC)          | 2.1 (Auth Middleware)      |
| Testing               | 4     | 8 (Testing Strategy) | 1.6 (Benchmark directory) |
| Maintenance           | 4     | 9 (Maintenance Guide) | 2.9 (Limitations)         |
| Deployment            | 4     | 6 (Deployment)    | 1.3 (Package scripts)      |

---

## PUBLICATION QUALITY NOTES

- All source references use `path:line` notation where line numbers are verified from file reads.
- No speculative algorithms, invented APIs, or unverified architecture claims are included.
- Every diagram is either Mermaid (renderable) or ASCII/text-based (printable).
- Cross-references link sections within and across books.
- Callout boxes (`> **Note:**`) and tables are used for readability.
- Professional formatting matches internal engineering documentation standards (Google, OpenAI, AWS-style).

---

*End of Master Index*
