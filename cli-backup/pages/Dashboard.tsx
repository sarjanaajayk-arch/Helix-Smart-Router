import React from 'react';
import { Box, Text } from 'ink';

interface DashboardProps {
  state: any;
}

export const Dashboard: React.FC<DashboardProps> = ({ state }) => {
  const {
    terminalSize = { width: 100 },
    metrics = {},
    health = {},
    providers = [],
    models = [],
    config = {}
  } = state ?? {};

  const contentWidth = Math.max(60, (terminalSize.width || 100) - 4);
  const halfWidth = Math.floor(contentWidth / 2);
  const quarterWidth = Math.floor(contentWidth / 4);

  const totalProviders = providers.length || 0;
  const healthyProviders = providers.filter((p: any) => p.healthy).length || 0;

  const totalModels = models.length || 0;
  const availableModels = models.filter((m: any) => m.available).length || 0;

  const avgLatency = metrics.averageLatency || 0;
  const totalRequests = metrics.totalRequests || 0;
  const successRate =
    totalRequests > 0
      ? (((metrics.successfulRequests || 0) / totalRequests) * 100).toFixed(1)
      : '0.0';

  const retryCount = metrics.retryCount || 0;
  const failoverCount = metrics.failoverCount || 0;

  const currentProvider =
    health?.summary?.currentProvider || providers?.[0]?.provider || 'None';
  const currentModel = health?.summary?.currentModel || 'auto';
  const currentPolicy = config?.defaultPolicy || 'BALANCED';

  return (
    <Box flexDirection="column" height="100%" width="100%" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width={halfWidth}>
          <Text color="#00d4ff" bold>
            ◆ SYSTEM OVERVIEW
          </Text>
        </Box>
        <Box width={halfWidth} alignItems="flex-end">
          <Text color="#888888">
            HELIX v1.0.0 • {new Date().toLocaleTimeString()}
          </Text>
        </Box>
      </Box>

      {/* Top Row - Key Metrics */}
      <Box flexDirection="row" marginBottom={1}>
        <Box
          width={quarterWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            OVERALL STATUS
          </Text>
          <Box marginTop={1}>
            <Text
              color={
                healthyProviders === totalProviders && totalProviders > 0
                  ? '#00ff88'
                  : '#ffaa00'
              }
              bold
            >
              {healthyProviders === totalProviders && totalProviders > 0
                ? '● HEALTHY'
                : healthyProviders > 0
                  ? '◐ DEGRADED'
                  : '● OFFLINE'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">
              {healthyProviders}/{totalProviders} providers operational
            </Text>
          </Box>
        </Box>

        <Box
          width={quarterWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            HEALTH SCORE
          </Text>
          <Box marginTop={1}>
            <Text color="#00ff88" bold>
              {Math.round((healthyProviders / Math.max(1, totalProviders)) * 100)}%
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Provider health aggregate</Text>
          </Box>
        </Box>

        <Box
          width={quarterWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            CONNECTED PROVIDERS
          </Text>
          <Box marginTop={1}>
            <Text color="#ffffff" bold>
              {totalProviders}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">
              {healthyProviders} healthy • {totalProviders - healthyProviders} offline
            </Text>
          </Box>
        </Box>

        <Box width={quarterWidth} borderStyle="single" borderColor="#00d4ff" padding={1}>
          <Text color="#00d4ff" bold>
            LOADED MODELS
          </Text>
          <Box marginTop={1}>
            <Text color="#ffffff" bold>
              {totalModels}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">
              {availableModels} available • {totalModels - availableModels} disabled
            </Text>
          </Box>
        </Box>
      </Box>

      {/* Middle Row - Current Configuration */}
      <Box flexDirection="row" marginBottom={1}>
        <Box
          width={halfWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            CURRENT CONFIGURATION
          </Text>

          <Box flexDirection="row" marginTop={1}>
            <Box width={Math.floor(halfWidth * 0.4)}>
              <Text color="#888888">Provider</Text>
              <Box marginTop={1}>
                <Text color="#00ff88" bold>
                  {currentProvider}
                </Text>
              </Box>
            </Box>
            <Box width={Math.floor(halfWidth * 0.3)}>
              <Text color="#888888">Model</Text>
              <Box marginTop={1}>
                <Text color="#00ff88" bold>
                  {currentModel}
                </Text>
              </Box>
            </Box>
            <Box width={Math.floor(halfWidth * 0.3)}>
              <Text color="#888888">Policy</Text>
              <Box marginTop={1}>
                <Text color="#00ff88" bold>
                  {currentPolicy}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box width={halfWidth} borderStyle="single" borderColor="#00d4ff" padding={1}>
          <Text color="#00d4ff" bold>
            PERFORMANCE METRICS
          </Text>

          <Box flexDirection="row" marginTop={1}>
            <Box width={Math.floor(halfWidth * 0.25)}>
              <Text color="#888888">Avg Latency</Text>
              <Box marginTop={1}>
                <Text color="#ffffff" bold>
                  {avgLatency}ms
                </Text>
              </Box>
            </Box>
            <Box width={Math.floor(halfWidth * 0.25)}>
              <Text color="#888888">Success Rate</Text>
              <Box marginTop={1}>
                <Text color="#00ff88" bold>
                  {successRate}%
                </Text>
              </Box>
            </Box>
            <Box width={Math.floor(halfWidth * 0.25)}>
              <Text color="#888888">Total Requests</Text>
              <Box marginTop={1}>
                <Text color="#ffffff" bold>
                  {totalRequests.toLocaleString()}
                </Text>
              </Box>
            </Box>
            <Box width={Math.floor(halfWidth * 0.25)}>
              <Text color="#888888">Retries</Text>
              <Box marginTop={1}>
                <Text color="#ffaa00" bold>
                  {retryCount}
                </Text>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Row - Engine Status */}
      <Box flexDirection="row" marginBottom={1}>
        <Box
          width={quarterWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            RETRY ENGINE
          </Text>
          <Box marginTop={1}>
            <Text color="#00ff88" bold>
              ACTIVE
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Retries: {retryCount} • Max: 3</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Exponential backoff enabled</Text>
          </Box>
        </Box>

        <Box
          width={quarterWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            STREAMING
          </Text>
          <Box marginTop={1}>
            <Text color="#00ff88" bold>
              ENABLED
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">SSE / Token streaming</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Chunked responses active</Text>
          </Box>
        </Box>

        <Box
          width={quarterWidth}
          borderStyle="single"
          borderColor="#00d4ff"
          padding={1}
          marginRight={1}
        >
          <Text color="#00d4ff" bold>
            FAILOVER
          </Text>
          <Box marginTop={1}>
            <Text color={failoverCount > 0 ? '#ffaa00' : '#00ff88'} bold>
              {failoverCount > 0 ? 'TRIGGERED' : 'STANDBY'}
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Failovers: {failoverCount}</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Cross-provider fallback ready</Text>
          </Box>
        </Box>

        <Box width={quarterWidth} borderStyle="single" borderColor="#00d4ff" padding={1}>
          <Text color="#00d4ff" bold>
            ROUTING ENGINE
          </Text>
          <Box marginTop={1}>
            <Text color="#00ff88" bold>
              SMART
            </Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Task-aware selection</Text>
          </Box>
          <Box marginTop={1}>
            <Text color="#888888">Cost/latency/quality balanced</Text>
          </Box>
        </Box>
      </Box>

      {/* Provider Health Grid */}
      <Box borderStyle="single" borderColor="#00d4ff" padding={1} marginTop={1}>
        <Text color="#00d4ff" bold>
          PROVIDER HEALTH MATRIX
        </Text>

        {providers?.map((provider: any) => (
          <Box key={provider.provider} flexDirection="row" marginTop={1} paddingX={1}>
            <Box width={20}>
              <Box marginTop={1}>
                <Text color={provider.healthy ? '#00ff88' : '#ff4444'} bold>
                  {provider.healthy ? '●' : '○'} {String(provider.provider || '').toUpperCase()}
                </Text>
              </Box>
            </Box>
            <Box width={15}>
              <Box marginTop={1}>
                <Text color={provider.enabled ? '#00ff88' : '#ffaa00'}>
                  {provider.enabled ? 'ENABLED' : 'DISABLED'}
                </Text>
              </Box>
            </Box>
            <Box width={15}>
              <Box marginTop={1}>
                <Text color="#ffffff">{provider.averageLatency}ms avg</Text>
              </Box>
            </Box>
            <Box width={15}>
              <Box marginTop={1}>
                <Text
                  color={
                    provider.successRate >= 95
                      ? '#00ff88'
                      : provider.successRate >= 80
                        ? '#ffaa00'
                        : '#ff4444'
                  }
                >
                  {typeof provider.successRate === 'number'
                    ? provider.successRate.toFixed(1)
                    : provider.successRate}%
                </Text>
              </Box>
            </Box>
            <Box width={20}>
              <Box marginTop={1}>
                <Text color="#888888">
                  {provider.features?.chat && 'CHAT '}
                  {provider.features?.vision && 'VISION '}
                  {provider.features?.streaming && 'STREAM '}
                  {provider.features?.reasoning && 'REASON '}
                  {provider.features?.coding && 'CODE '}
                </Text>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};