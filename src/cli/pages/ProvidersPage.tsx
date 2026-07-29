import React from 'react';
import { Box, Text } from 'ink';

interface ProvidersPageProps {
  state: any;
}

export const ProvidersPage: React.FC<ProvidersPageProps> = ({ state }) => {
  const { providers, selectedProviderIndex, terminalSize, focus } = state;
  const visibleHeight = terminalSize.height - 10;
  
  if (!providers || providers.length === 0) {
      return (
        <Box flexDirection="column" height="100%" width="100%" padding={2} justifyContent="center" alignItems="center">
          <Text color="#888888">No providers connected</Text>
          <Box marginTop={1}>
            <Text color="#666666">Check your API keys in .env</Text>
          </Box>
        </Box>
      );
    }

  const startIndex = Math.max(0, selectedProviderIndex - Math.floor(visibleHeight / 2));
  const endIndex = Math.min(providers.length, startIndex + visibleHeight);
  const visibleProviders = providers.slice(startIndex, endIndex);

  return (
    <Box flexDirection="column" height="100%" width="100%" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="50%">
          <Text color="#00d4ff" bold>◆ PROVIDERS</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#888888">{providers.length} provider{providers.length !== 1 ? 's' : ''} • {providers.filter((p: any) => p.healthy).length} healthy</Text>
        </Box>
      </Box>

      {/* Table Header */}
            <Box flexDirection="row" borderStyle="single" borderColor="#333333" paddingX={1} paddingY={0} marginBottom={1}>
        <Box width={4}><Text color="#888888" bold>#</Text></Box>
        <Box width={16}><Text color="#888888" bold>PROVIDER</Text></Box>
        <Box width={12}><Text color="#888888" bold>STATUS</Text></Box>
        <Box width={8}><Text color="#888888" bold>ENABLED</Text></Box>
        <Box width={10}><Text color="#888888" bold>AVG LAT</Text></Box>
        <Box width={10}><Text color="#888888" bold>EST LAT</Text></Box>
        <Box width={10}><Text color="#888888" bold>SUCCESS%</Text></Box>
        <Box width={10}><Text color="#888888" bold>USAGE</Text></Box>
        <Box width={20}><Text color="#888888" bold>FEATURES</Text></Box>
        <Box width={12}><Text color="#888888" bold>CONTEXT</Text></Box>
        <Box width={8}><Text color="#888888" bold>PRIORITY</Text></Box>
      </Box>

      {/* Provider Rows */}
      {visibleProviders.map((provider: any, i: number) => {
        const index = startIndex + i;
        const isSelected = index === selectedProviderIndex;
        const isFocused = focus === 'content';
        const selected = isSelected && isFocused;
        
        return (
                  <Box 
                    key={provider.provider} 
                    flexDirection="row" 
                    paddingX={1} 
                    paddingY={0}
                  >
            <Box width={4}>
              <Text color={selected ? '#00d4ff' : '#888888'} bold>{index + 1}</Text>
            </Box>
            <Box width={16}>
              <Text color={selected ? '#ffffff' : provider.healthy ? '#00ff88' : '#ff4444'} bold={selected}>
                {provider.provider.toUpperCase()}
              </Text>
            </Box>
            <Box width={12}>
              <Text color={provider.healthy ? '#00ff88' : '#ff4444'} bold={selected}>
                {provider.healthy ? '● HEALTHY' : '● UNHEALTHY'}
              </Text>
            </Box>
            <Box width={8}>
              <Text color={provider.enabled ? '#00ff88' : '#ffaa00'} bold={selected}>
                {provider.enabled ? 'YES' : 'NO'}
              </Text>
            </Box>
            <Box width={10}>
              <Text color="#ffffff" bold={selected}>{provider.averageLatency}ms</Text>
            </Box>
            <Box width={10}>
              <Text color="#ffd700" bold={selected}>{provider.estimatedLatency}ms</Text>
            </Box>
            <Box width={10}>
              <Text color={provider.successRate >= 95 ? '#00ff88' : provider.successRate >= 80 ? '#ffaa00' : '#ff4444'} bold={selected}>
                {provider.successRate.toFixed(1)}%
              </Text>
            </Box>
            <Box width={10}>
              <Text color="#ffffff" bold={selected}>{provider.usage.toLocaleString()}</Text>
            </Box>
            <Box width={20}>
                <Text color="#888888">
                {provider.features.chat && 'CHAT '}
                {provider.features.vision && 'VIS '}
                {provider.features.coding && 'CODE '}
                {provider.features.reasoning && 'REAS '}
                {provider.features.streaming && 'STRM '}
                {provider.features.longContext && 'LCTX '}
              </Text>
            </Box>
            <Box width={12}>
              <Text color="#ffffff" bold={selected}>{formatNumber(provider.maxContextWindow)}</Text>
            </Box>
            <Box width={8}>
              <Text color="#ffd700" bold={selected}>P{provider.priority}</Text>
            </Box>
          </Box>
        );
      })}

      {/* Scroll indicator */}
            {providers.length > visibleHeight && (
              <Box marginTop={1} flexDirection="row">
                <Box flexGrow={1} />
                <Text color="#666666">↑↓ Navigate • Enter Details • Esc Back • Tab Nav</Text>
              </Box>
            )}
    </Box>
  );
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};