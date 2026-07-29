export enum Page {
  Loading = 'loading',
  Dashboard = 'dashboard',
  Providers = 'providers',
  Models = 'models',
  Routes = 'routes',
  Status = 'status',
  Config = 'config',
}

export interface TerminalSize {
  width: number;
  height: number;
}

export interface ProviderInfo {
  provider: string;
  healthy: boolean;
  enabled: boolean;
  priority: number;
  estimatedLatency: number;
  maxContextWindow: number;
  usage: number;
  successes: number;
  failures: number;
  successRate: number;
  averageLatency: number;
  features: {
    chat: boolean;
    vision: boolean;
    coding: boolean;
    reasoning: boolean;
    streaming: boolean;
    longContext: boolean;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutputTokens: number;
  priority: number;
  enabled: boolean;
  available: boolean;
  providerHealthy: boolean;
  providerEstimatedLatency: number;
  usage: number;
  successes: number;
  failures: number;
  successRate: number;
  averageLatency: number;
  retryCount: number;
  failoverCount: number;
  inputPricePerMillionTokens: number | undefined;
  outputPricePerMillionTokens: number | undefined;
  capabilities: {
    supportsChat: boolean;
    supportsVision: boolean;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsReasoning: boolean;
    supportsCoding: boolean;
  };
}

export interface RouteInfo {
  id: string;
  name: string;
  taskType: string;
  provider: string;
  model: string;
  policy: string;
  priority: number;
  enabled: boolean;
  usage: number;
  averageLatency: number;
  successRate: number;
}

export interface HealthInfo {
  timestamp: string;
  summary: {
    totalProviders: number;
    healthyProviders: number;
    unhealthyProviders: number;
    totalModels: number;
    enabledModels: number;
    availableModels: number;
  };
  metrics: any;
  providers: ProviderInfo[];
  models: ModelInfo[];
}

export interface MetricsSnapshot {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  retryCount: number;
  failoverCount: number;
  averageLatency: number;
  totalLatency: number;
  providerMetrics: Record<string, ProviderMetrics>;
}

export interface ProviderMetrics {
  usage: number;
  successes: number;
  failures: number;
  totalLatency: number;
  averageLatency: number;
}

export interface ConfigInfo {
  router: {
    enableSmartRouting: boolean;
    defaultProvider: string;
    defaultPolicy: string;
    defaultTaskType: string;
  };
  providers: Record<string, {
    enabled: boolean;
    priority: number;
    timeout: number;
    maxRetries: number;
  }>;
  timeouts: {
    providerTimeoutMs: number;
    requestTimeoutMs: number;
    streamTimeoutMs: number;
  };
  retries: {
    maxRetries: number;
    baseDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
  };
}

export interface AppState {
  currentPage: Page;
  previousPage: Page;
  loadingProgress: number;
  loadingComplete: boolean;
  focus: 'navigation' | 'content';
  terminalSize: TerminalSize;
  providers: ProviderInfo[];
  models: ModelInfo[];
  routes: RouteInfo[];
  metrics: MetricsSnapshot | null;
  health: HealthInfo | null;
  config: ConfigInfo | null;
  selectedProviderIndex: number;
  selectedModelIndex: number;
  selectedRouteIndex: number;
  scrollOffset: number;
}