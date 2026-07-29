import React from 'react';
import { Box, Text } from 'ink';

interface StatusPageProps {
  state: any;
}

export const StatusPage: React.FC<StatusPageProps> = ({ state }) => {
  const { health, metrics, providers, terminalSize, focus } = state;
  
  if (!health) {
    return (
      <Box flexDirection="column" height="100%" width="100%" padding={2} justifyContent="center" alignItems="center">
        <Text color="#888888">Loading health status...</Text>
      </Box>
    );
  }

  const summary = health.summary || {};
  const totalProviders = summary.totalProviders || providers?.length || 0;
  const healthyProviders = summary.healthyProviders || providers?.filter((p: any) => p.healthy).length || 0;
  const unhealthyProviders = summary.unhealthyProviders || providers?.filter((p: any) => !p.healthy).length || 0;

  return (
    <Box flexDirection="column" height="100%" width="100%" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="50%">
          <Text color="#00d4ff" bold>◆ SYSTEM STATUS</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#888888">Last updated: {health.timestamp ? new Date(health.timestamp).toLocaleTimeString() : 'N/A'}</Text>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="25%" borderStyle="single" borderColor="#00d4ff" padding={1} marginRight={1}>
          <Text color="#00d4ff" bold>TOTAL PROVIDERS</Text>
          <Box marginTop={1}>
            <Text color="#ffffff" bold>{totalProviders}</Text>
          </Box>
        </Box>
        <Box width="25%" borderStyle="single" borderColor="#00ff88" padding={1} marginRight={1}>
          <Text color="#00ff88" bold>HEALTHY</Text>
          <Box marginTop={1}>
            <Text color="#00ff88" bold>{healthyProviders}</Text>
          </Box>
        </Box>
        <Box width="25%" borderStyle="single" borderColor="#ff4444" padding={1} marginRight={1}>
          <Text color="#ff4444" bold>UNHEALTHY</Text>
          <Box marginTop={1}>
            <Text color="#ff4444" bold>{unhealthyProviders}</Text>
          </Box>
        </Box>
        <Box width="25%" borderStyle="single" borderColor="#ffd700" padding={1}>
          <Text color="#ffd700" bold>TOTAL MODELS</Text>
          <Box marginTop={1}>
            <Text color="#ffd700" bold>{summary.totalModels || 0}</Text>
          </Box>
        </Box>
      </Box>

      {/* Provider Health Details */}
      <Box borderStyle="single" borderColor="#333333" padding={1} marginBottom={1} flexGrow={1}>
        <Text color="#00d4ff" bold>PROVIDER HEALTH DETAILS</Text>
        
        {providers?.map((provider: any, index: number) => {
          const isSelected = index === state.selectedProviderIndex;
          const isFocused = focus === 'content';
          const selected = isSelected && isFocused;
          
          const providerMetrics = metrics?.providerMetrics?.[provider.provider];
          const usage = providerMetrics?.usage || 0;
          const successes = providerMetrics?.successes || 0;
          const failures = providerMetrics?.failures || 0;
          const avgLatency = providerMetrics?.averageLatency || 0;
          
          return (
            <Box key={provider.provider} marginTop={1} flexDirection="column" borderStyle="single" borderColor={selected ? '#00d4ff' : '#222222'} padding={1}>
              <Box flexDirection="row">
                <Box width={20}>
                  <Text color={selected ? '#ffffff' : provider.healthy ? '#00ff88' : '#ff4444'} bold={selected}>
                    {provider.provider.toUpperCase()}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color={provider.healthy ? '#00ff88' : '#ff4444'} bold={selected}>
                    {provider.healthy ? '● HEALTHY' : '● UNHEALTHY'}
                  </Text>
                </Box>
                <Box width={10}>
                  <Text color={provider.enabled ? '#00ff88' : '#ffaa00'} bold={selected}>
                    {provider.enabled ? 'ENABLED' : 'DISABLED'}
                  </Text>
                </Box>
                <Box width={15}>
                  <Text color="#888888">Priority: </Text>
                  <Text color="#ffd700" bold>P{provider.priority}</Text>
                </Box>
                <Box width={15}>
                  <Text color="#888888">Est. Latency: </Text>
                  <Text color="#ffffff" bold>{provider.estimatedLatency}ms</Text>
                </Box>
              </Box>
              
              <Box flexDirection="row" marginTop={1}>
                <Box width={15}>
                  <Text color="#888888">Usage: </Text>
                  <Text color="#ffffff" bold>{usage.toLocaleString()}</Text>
                </Box>
                <Box width={15}>
                  <Text color="#888888">Success: </Text>
                  <Text color="#00ff88" bold>{successes}</Text>
                </Box>
                <Box width={15}>
                  <Text color="#888888">Failures: </Text>
                  <Text color="#ff4444" bold>{failures}</Text>
                </Box>
                <Box width={15}>
                  <Text color="#888888">Avg Latency: </Text>
                  <Text color="#ffffff" bold>{avgLatency.toFixed(0)}ms</Text>
                </Box>
                <Box width={15}>
                  <Text color="#888888">Success Rate: </Text>
                  <Text color={usage > 0 && (successes / usage * 100) >= 95 ? '#00ff88' : usage > 0 && (successes / usage * 100) >= 80 ? '#ffaa00' : '#ff4444'} bold>
                    {usage > 0 ? (successes / usage * 100).toFixed(1) : 'N/A'}%
                  </Text>
                </Box>
              </Box>
              
              <Box flexDirection="row" marginTop={1}>
                <Box width={20}>
                  <Text color="#888888">Context Window: </Text>
                  <Text color="#ffffff" bold>{formatNumber(provider.maxContextWindow)}</Text>
                </Box>
                <Box width={20}>
                  <Text color="#888888">Features: </Text>
                  <Text color="#888888">
                    {provider.features.chat && 'CHAT '}
                    {provider.features.vision && 'VIS '}
                    {provider.features.coding && 'CODE '}
                    {provider.features.reasoning && 'REAS '}
                    {provider.features.streaming && 'STRM '}
                    {provider.features.longContext && 'LCTX '}
                  </Text>
                </Box>
              </Box>
            </Box>
          );
        })}

        {(!providers || providers.length === 0) && (
          <Box marginTop={2} alignItems="center">
            <Text color="#888888">No providers configured</Text>
            <Box marginTop={1}>
              <Text color="#666666">Check your API keys in .env file</Text>
            </Box>
          </Box>
        )}
      </Box>

      {/* System Metrics */}
      <Box borderStyle="single" borderColor="#333333" padding={1}>
        <Text color="#00d4ff" bold>SYSTEM METRICS</Text>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="33%">
            <Text color="#888888">Total Requests: </Text>
            <Text color="#00d4ff" bold>{metrics?.totalRequests || 0}</Text>
          </Box>
          <Box width="33%">
            <Text color="#888888">Successful: </Text>
            <Text color="#00ff88" bold>{metrics?.successfulRequests || 0}</Text>
          </Box>
          <Box width="33%">
            <Text color="#888888">Failed: </Text>
            <Text color="#ff4444" bold>{metrics?.failedRequests || 0}</Text>
          </Box>
        </Box>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="33%">
            <Text color="#888888">Avg Latency: </Text>
            <Text color="#ffffff" bold>{metrics?.averageLatency?.toFixed(0) || 0}ms</Text>
          </Box>
          <Box width="33%">
            <Text color="#888888">Retries: </Text>
            <Text color="#ffd700" bold>{metrics?.retryCount || 0}</Text>
          </Box>
          <Box width="33%">
            <Text color="#888888">Failovers: </Text>
            <Text color="#ffd700" bold>{metrics?.failoverCount || 0}</Text>
          </Box>
        </Box>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="33%">
            <Text color="#888888">Success Rate: </Text>
            <Text color={metrics?.totalRequests > 0 && ((metrics?.successfulRequests || 0) / metrics.totalRequests * 100) >= 95 ? '#00ff88' : '#ffaa00'} bold>
              {metrics?.totalRequests > 0 ? ((metrics?.successfulRequests || 0) / metrics.totalRequests * 100).toFixed(1) : 0}%
            </Text>
          </Box>
          <Box width="33%">
            <Text color="#888888">Total Latency: </Text>
            <Text color="#ffffff" bold>{metrics?.totalLatency || 0}ms</Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};