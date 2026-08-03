import type { Dispatch, SetStateAction } from 'react';

import { ProviderManager } from '../../providers/ProviderManager.js';
import { SmartRouter } from '../../orchestrator/SmartRouter.js';
import { HealthMonitor } from '../../orchestrator/HealthMonitor.js';
import { MetricsManager } from '../../metrics/MetricsManager.js';
import { DashboardService } from '../../services/DashboardService.js';
import { ModelRegistryService } from '../../registry/ModelRegistryService.js';
import { ProviderConfig } from '../../config/ProviderConfig.js';
import { env } from '../../config/env.js';
import { ProviderType } from '../../types/ProviderType.js';

export interface BackendData {
  providers: any[];
  models: any[];
  metrics: any;
  health: any;
  config: any;
  routes: any[];
}

export const useBackend = (setState: Dispatch<SetStateAction<any>>) => {
  const providerManager = new ProviderManager();
  const smartRouter = new SmartRouter(providerManager);

  // Initialize health monitor
  const configuredProviders = providerManager.getProviders().map(p =>
    p === 'gemini' ? ProviderType.GEMINI : ProviderType.OPENROUTER
  );
  HealthMonitor.initialize(configuredProviders);

  const loadInitialData = async () => {
    try {
      // Fetch all data in parallel
      const [
        dashboard,
        providers,
        models,
        routes,
        status,
        config,
      ] = await Promise.all([
        fetchDashboard(),
        fetchProviders(),
        fetchModels(),
        fetchRoutes(),
        fetchStatus(),
        fetchConfig(),
      ]);

      setState((prev: any) => ({
        ...prev,
        providers,
        models,
        metrics: dashboard?.metrics,
        health: status,
        config,
        routes,
        currentPage: 'dashboard',
        loadingComplete: true,
      }));
    } catch (error) {
      console.error('Failed to load initial data:', error);
      setState((prev: any) => ({
        ...prev,
        loadingComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
    }
  };

  const fetchDashboard = async () => {
    try {
      return DashboardService.getDashboard();
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      return null;
    }
  };

  const fetchProviders = async () => {
    try {
      const providers = providerManager.getProviders();

      return providers.map(name => {
        const metrics = MetricsManager.getProviderMetrics(
          name === 'gemini' ? ProviderType.GEMINI : ProviderType.OPENROUTER
        );
        const healthy = HealthMonitor.isHealthy(
          name === 'gemini' ? ProviderType.GEMINI : ProviderType.OPENROUTER
        );

        // Get provider config
        const providerType = name === 'gemini' ? ProviderType.GEMINI : ProviderType.OPENROUTER;
        const config = ProviderConfig[providerType];

        return {
          provider: name,
          healthy,
          enabled: config?.enabled ?? true,
          priority: config?.priority ?? 1,
          estimatedLatency: name === 'gemini' ? 350 : 500,
          maxContextWindow: name === 'gemini' ? 1_000_000 : 128_000,
          usage: metrics.usage,
          successes: metrics.successes,
          failures: metrics.failures,
          averageLatency: metrics.averageLatency,
          successRate: metrics.usage > 0 ? (metrics.successes / metrics.usage) * 100 : 100,
          features: {
            chat: true,
            vision: true,
            coding: true,
            reasoning: true,
            streaming: true,
            longContext: true,
          },
        };
      });
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      return [];
    }
  };

  const fetchModels = async () => {
    try {
      const allModels = await providerManager.getAllModels();
      const metrics = MetricsManager.getMetrics();

      const models: any[] = [];

      for (const [providerName, providerModels] of Object.entries(allModels)) {
        for (const model of providerModels) {
          const providerType = providerName === 'gemini' ? ProviderType.GEMINI : ProviderType.OPENROUTER;
          const providerMetrics = metrics.providerMetrics[providerType];
          const providerHealthy = HealthMonitor.isHealthy(providerType);

          models.push({
            id: model.id,
            name: model.name,
            provider: providerName,
            contextWindow: model.contextWindow,
            maxOutputTokens: model.maxOutputTokens,
            priority: 1,
            available: providerHealthy,
            providerHealthy,
            providerEstimatedLatency: providerName === 'gemini' ? 350 : 500,
            usage: providerMetrics?.usage ?? 0,
            successes: providerMetrics?.successes ?? 0,
            failures: providerMetrics?.failures ?? 0,
            successRate: providerMetrics?.usage > 0
              ? (providerMetrics.successes / providerMetrics.usage) * 100
              : 100,
            averageLatency: providerMetrics?.averageLatency ?? 0,
            retryCount: metrics.retryCount,
            failoverCount: metrics.failoverCount,
            inputPricePerMillionTokens: model.inputPricePerMillionTokens,
            outputPricePerMillionTokens: model.outputPricePerMillionTokens,
            capabilities: {
              supportsChat: model.supportsChat,
              supportsVision: model.supportsVision,
              supportsStreaming: model.supportsStreaming,
              supportsFunctionCalling: model.supportsFunctionCalling,
              supportsReasoning: model.supportsReasoning,
              supportsCoding: model.supportsCoding,
            },
          });
        }
      }

      return models;
    } catch (error) {
      console.error('Failed to fetch models:', error);
      return [];
    }
  };

  const fetchRoutes = async () => {
    // Routes are static configuration in Helix
    return [
      { id: 'chat', name: 'General Chat', taskType: 'CHAT', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'BALANCED', priority: 1, enabled: true, usage: 0, avgLatency: 0, successRate: 100 },
      { id: 'code', name: 'Code Generation', taskType: 'CODE', provider: 'gemini', model: 'gemini-2.5-pro', policy: 'HIGHEST_QUALITY', priority: 1, enabled: true, usage: 0, avgLatency: 0, successRate: 100 },
      { id: 'reasoning', name: 'Complex Reasoning', taskType: 'REASONING', provider: 'gemini', model: 'gemini-2.5-pro', policy: 'HIGHEST_QUALITY', priority: 2, enabled: true, usage: 0, avgLatency: 0, successRate: 100 },
      { id: 'vision', name: 'Image Analysis', taskType: 'VISION', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'BALANCED', priority: 1, enabled: true, usage: 0, avgLatency: 0, successRate: 100 },
      { id: 'summarization', name: 'Text Summarization', taskType: 'SUMMARIZATION', provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', policy: 'CHEAPEST', priority: 1, enabled: true, usage: 0, avgLatency: 0, successRate: 100 },
      { id: 'general', name: 'General Purpose', taskType: 'GENERAL', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'BALANCED', priority: 3, enabled: true, usage: 0, avgLatency: 0, successRate: 100 },
    ];
  };

  const fetchStatus = async () => {
    try {
      return DashboardService.getHealth();
    } catch (error) {
      console.error('Failed to fetch status:', error);
      return null;
    }
  };

  const fetchConfig = async () => {
    try {
      return {
        router: {
          enableSmartRouting: true,
          defaultProvider: env.GEMINI_MODEL || 'gemini',
          defaultPolicy: 'BALANCED',
          defaultTaskType: 'CHAT',
        },
        providers: {
          gemini: {
            enabled: !!env.GEMINI_API_KEY,
            priority: ProviderConfig.gemini?.priority ?? 1,
            timeout: 60000,
            maxRetries: 3,
          },
          openrouter: {
            enabled: !!env.OPENROUTER_API_KEY,
            priority: ProviderConfig.openrouter?.priority ?? 2,
            timeout: 60000,
            maxRetries: 3,
          },
        },
        timeouts: {
          providerTimeoutMs: 60000,
          requestTimeoutMs: 30000,
          streamTimeoutMs: 120000,
        },
        retries: {
          maxRetries: 3,
          baseDelayMs: 1000,
          maxDelayMs: 30000,
          backoffMultiplier: 2,
        },
      };
    } catch (error) {
      console.error('Failed to fetch config:', error);
      return null;
    }
  };

  const refreshData = async () => {
    const [dashboard, providers, models, status] = await Promise.all([
      fetchDashboard(),
      fetchProviders(),
      fetchModels(),
      fetchStatus(),
    ]);

    setState((prev: any) => ({
      ...prev,
      providers,
      models,
      metrics: dashboard?.metrics,
      health: status,
    }));
  };

  return {
    loadInitialData,
    refreshData,
    providerManager,
    smartRouter,
  };
};