import React from 'react';
import { Box, Text } from 'ink';

interface RoutesPageProps {
  state: any;
}

export const RoutesPage: React.FC<RoutesPageProps> = ({ state }) => {
  const { terminalSize, focus } = state;
  
  // Sample routes data - in real implementation this would come from config
  const routes = [
    { id: 'chat', name: 'General Chat', taskType: 'CHAT', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'BALANCED', priority: 1, enabled: true, usage: 1247, avgLatency: 342, successRate: 98.2 },
    { id: 'code', name: 'Code Generation', taskType: 'CODE', provider: 'gemini', model: 'gemini-2.5-pro', policy: 'HIGHEST_QUALITY', priority: 1, enabled: true, usage: 523, avgLatency: 1205, successRate: 96.8 },
    { id: 'reasoning', name: 'Complex Reasoning', taskType: 'REASONING', provider: 'gemini', model: 'gemini-2.5-pro', policy: 'HIGHEST_QUALITY', priority: 2, enabled: true, usage: 189, avgLatency: 2100, successRate: 95.1 },
    { id: 'vision', name: 'Image Analysis', taskType: 'VISION', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'BALANCED', priority: 1, enabled: true, usage: 67, avgLatency: 890, successRate: 97.5 },
    { id: 'summarization', name: 'Text Summarization', taskType: 'SUMMARIZATION', provider: 'openrouter', model: 'anthropic/claude-3.5-sonnet', policy: 'CHEAPEST', priority: 1, enabled: true, usage: 312, avgLatency: 567, successRate: 99.1 },
    { id: 'translation', name: 'Translation', taskType: 'TRANSLATION', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'CHEAPEST', priority: 2, enabled: false, usage: 45, avgLatency: 412, successRate: 98.9 },
    { id: 'classification', name: 'Classification', taskType: 'CLASSIFICATION', provider: 'openrouter', model: 'google/gemini-flash-1.5', policy: 'CHEAPEST', priority: 2, enabled: true, usage: 234, avgLatency: 298, successRate: 99.3 },
    { id: 'search', name: 'Search & Research', taskType: 'SEARCH', provider: 'openrouter', model: 'perplexity/sonar', policy: 'FASTEST', priority: 1, enabled: true, usage: 89, avgLatency: 1850, successRate: 94.2 },
    { id: 'agent', name: 'Agent Tasks', taskType: 'AGENT', provider: 'gemini', model: 'gemini-2.5-pro', policy: 'BALANCED', priority: 1, enabled: true, usage: 156, avgLatency: 3200, successRate: 93.7 },
    { id: 'general', name: 'General Purpose', taskType: 'GENERAL', provider: 'gemini', model: 'gemini-2.5-flash', policy: 'BALANCED', priority: 3, enabled: true, usage: 2103, avgLatency: 287, successRate: 98.5 },
  ];

  return (
    <Box flexDirection="column" height="100%" width="100%" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="50%">
          <Text color="#00d4ff" bold>◇ ROUTES</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#888888">{routes.filter((r: any) => r.enabled).length}/{routes.length} active</Text>
        </Box>
      </Box>

      {/* Table Header */}
      <Box flexDirection="row" borderStyle="single" borderColor="#333333" paddingX={1} paddingY={0}>
        <Box width={3}><Text color="#888888" bold>#</Text></Box>
        <Box width={20}><Text color="#888888" bold>ROUTE</Text></Box>
        <Box width={14}><Text color="#888888" bold>TASK TYPE</Text></Box>
        <Box width={10}><Text color="#888888" bold>PROVIDER</Text></Box>
        <Box width={18}><Text color="#888888" bold>MODEL</Text></Box>
        <Box width={14}><Text color="#888888" bold>POLICY</Text></Box>
        <Box width={8}><Text color="#888888" bold>STATUS</Text></Box>
        <Box width={8}><Text color="#888888" bold>USAGE</Text></Box>
        <Box width={8}><Text color="#888888" bold>LATENCY</Text></Box>
        <Box width={8}><Text color="#888888" bold>SUCCESS%</Text></Box>
      </Box>

      {/* Route Rows */}
      {routes.map((route: any, index: number) => {
        const isSelected = index === state.selectedRouteIndex;
        const isFocused = focus === 'content';
        
        return (
          <Box 
            key={route.id}
            flexDirection="row"
            borderStyle="single"
            borderColor={isSelected && isFocused ? '#00d4ff' : '#222222'}
            paddingX={1}
            paddingY={0}
          >
            <Box width={3}>
              <Text color={isSelected ? '#00d4ff' : '#888888'} bold>{index + 1}</Text>
            </Box>
            <Box width={20}>
              <Text color={isSelected ? '#ffffff' : route.enabled ? '#cccccc' : '#666666'} bold={isSelected}>
                {route.name}
              </Text>
            </Box>
            <Box width={14}>
              <Text color="#ffd700" bold={isSelected}>{route.taskType}</Text>
            </Box>
            <Box width={10}>
              <Text color="#00d4ff">{route.provider}</Text>
            </Box>
            <Box width={18}>
              <Text color="#cccccc">{route.model}</Text>
            </Box>
            <Box width={14}>
              <Text color="#ffd700">{route.policy}</Text>
            </Box>
            <Box width={8}>
              <Text color={route.enabled ? '#00ff88' : '#ffaa00'} bold>
                {route.enabled ? 'ON' : 'OFF'}
              </Text>
            </Box>
            <Box width={8}>
              <Text color="#ffffff">{route.usage.toLocaleString()}</Text>
            </Box>
            <Box width={8}>
              <Text color="#ffffff">{route.avgLatency}ms</Text>
            </Box>
            <Box width={8}>
              <Text color={route.successRate >= 95 ? '#00ff88' : route.successRate >= 80 ? '#ffaa00' : '#ff4444'}>
                {route.successRate.toFixed(1)}%
              </Text>
            </Box>
          </Box>
        );
      })}

      {/* Footer */}
      <Box marginTop={1} flexDirection="row">
        <Box width="50%">
          <Text color="#666666">↑↓ Navigate • Enter Toggle • Esc Back</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#666666">Press TAB to focus navigation</Text>
        </Box>
      </Box>
    </Box>
  );
};