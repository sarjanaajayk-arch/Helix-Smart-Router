# Helix Intelligent AI Gateway - Implementation Plan

## Current Architecture Analysis

### Request Flow:
1. `OpenAIController.chatCompletions()` - Handles incoming OpenAI-compatible requests
2. `validationMiddleware` - Validates request parameters (currently model-agnostic)
3. `SmartRouter.route()` - Selects provider and model based on task type
4. `ProviderManager.executeChat()` - Executes request against selected provider
5. Individual Provider (`GeminiProvider`, `OpenRouterProvider`) - Makes actual API calls

### Key Issues Identified:
1. **Static Model Configuration**: Models hardcoded in `ModelRegistry.ts`
2. **No Dynamic Discovery**: Providers don't expose available models
3. **Limited Routing Logic**: SmartRouter uses static task-type mapping
4. **No Parameter Adaptation**: Requests rejected if parameters exceed provider limits
5. **Basic Failover**: Only provider-level failover, no intra-provider model switching
6. **Validation Bottleneck**: Validation happens before model capabilities are known

## Target Architecture

### Enhanced Request Flow:
1. `OpenAIController.chatCompletions()` - Unchanged interface
2. **Enhanced Validation Middleware** - Model-aware validation (adapts to discovered models)
3. `SmartRouter.route()` - Intelligent model selection with parameter adaptation
4. **Dynamic Model Registry** - Populated via provider discovery
5. **Enhanced ProviderManager** - Supports dynamic provider loading and intra-provider switching
6. **Provider Extensions** - Discovery capabilities for Gemini and OpenRouter

## Module-by-Module Changes Required

### 1. Provider Interfaces (`src/providers/AIProvider.ts`)
**Changes Required:**
- Add model discovery methods
- Add capability querying methods
- Add parameter validation/adaptation methods

**Why:** To enable providers to expose their available models and capabilities dynamically.

### 2. Provider Implementations (`src/providers/GeminiProvider.ts`, `OpenRouterProvider.ts`)
**Changes Required:**
- Implement model discovery using provider APIs
- Add methods to query model-specific capabilities (context window, pricing, etc.)
- Add parameter adaptation logic (clamping max_tokens, temperature, etc.)
- Support for multiple models per provider instance

**Why:** To enable dynamic model discovery and intelligent parameter adaptation.

### 3. Provider Manager (`src/providers/ProviderManager.ts`)
**Changes Required:**
- Dynamic provider loading based on available API keys
- Intra-provider failover logic (try different models within same provider)
- Enhanced metadata tracking for model health and performance
- Support for provider-specific parameter translation

**Why:** To enable automatic provider/model switching and dynamic provider initialization.

### 4. Model Registry (`src/registry/ModelRegistry.ts` & `ModelRegistryService.ts`)
**Changes Required:**
- Convert from static registry to dynamic registry
- Add methods for registering/deregistering models discovered at runtime
- Add caching layer for model metadata
- Add model health tracking
- Support for provider-specific model metadata

**Why:** To maintain a dynamic catalog of available models with real-time metadata.

### 5. Smart Router (`src/orchestrator/SmartRouter.ts`)
**Changes Required:**
- Implement intelligent model scoring based on multiple factors:
  - Context window adequacy
  - Cost efficiency
  - Latency performance
  - Health status
  - Capability matching (vision, reasoning, etc.)
- Implement parameter adaptation before validation
- Implement fallback chains (model-to-model, then provider-to-provider)
- Remove hardcoded task-type to policy mappings in favor of dynamic scoring

**Why:** To enable intelligent model selection that adapts to request parameters and model capabilities.

### 6. Validation Middleware (`src/middlewares/validationMiddleware.ts`)
**Changes Required:**
- Make validation model-aware
- Clamp parameters to model-specific limits before rejection
- Translate provider-specific parameters (if needed)
- Only reject when execution is truly impossible

**Why:** To prevent premature rejection and enable adaptive request processing.

### 7. Capability Filter (`src/orchestrator/CapabilityFilter.ts`)
**Changes Required:**
- Enhance to use dynamic model capabilities from ModelRegistry
- Add more granular capability checks (specific vision models, reasoning models, etc.)

**Why:** To enable more sophisticated capability-based filtering.

### 8. Model Selector (`src/orchestrator/ModelSelector.ts`)
**Changes Required:**
- Enhance scoring algorithm to consider multiple factors
- Implement intelligent fallback within same provider
- Consider cost, latency, and health in selection

**Why:** To enable sophisticated model selection beyond simple priority ordering.

### 9. Routes (`src/routes/openai.ts`)
**Changes Required:**
- Add GET `/v1/models` endpoint to expose discovered models
- Keep existing POST `/v1/chat/completions` unchanged

**Why:** To provide OpenAI-compatible model discovery.

## Implementation Phases

### Phase 1: Foundation (No Breaking Changes)
- Enhance Provider interfaces with discovery methods
- Implement dynamic model discovery in GeminiProvider and OpenRouterProvider
- Modify ModelRegistry to support dynamic registration
- Update ProviderManager to load providers dynamically from env
- Build tests to ensure no regression

### Phase 2: Intelligent Routing
- Enhance SmartRouter with intelligent scoring
- Implement parameter adaptation logic
- Enhance ModelSelector with multi-factor scoring
- Update ValidationMiddleware to be model-aware
- Build tests for routing logic

### Phase 3: Advanced Features
- Implement intra-provider failover
- Implement provider-level failover with intelligent selection
- Add health-based model switching
- Implement cost/latency optimization
- Build comprehensive tests

### Phase 4: API Compliance
- Implement GET `/v1/models` endpoint
- Ensure full OpenAI compatibility
- Final integration testing

## Verification Checkpoints

After each phase:
1. Run existing test suite to ensure no regressions
2. Verify build succeeds (`npx tsc --noEmit`)
3. Run targeted tests for modified components
4. Manual verification of new functionality
5. Verify OpenAI compatibility with test requests

## Risk Mitigation

1. **Backward Compatibility**: All changes preserve existing interfaces
2. **Incremental Rollout**: Features can be toggled via configuration
3. **Fallback Mechanisms**: Existing behavior preserved as fallback
4. **Configuration Driven**: New features enabled via RouterConfig
5. **Monitoring**: Enhanced logging for debugging routing decisions

## Success Criteria

1. Helix accepts requests with parameters exceeding hardcoded limits and adapts them
2. Helix automatically switches models within a provider when limits are hit
3. Helix automatically switches providers when all models in a provider fail/unhealthy
4. Helix exposes discovered models via GET `/v1/models`
5. All existing functionality continues to work (backward compatibility)
6. Build succeeds and test suite passes (with possible enhancements for new features)