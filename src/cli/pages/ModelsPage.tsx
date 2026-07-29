import React from 'react';
import { Box, Text } from 'ink';

interface ModelsPageProps {
  state: any;
}

export const ModelsPage: React.FC<ModelsPageProps> = ({ state }) => {
  const { models, selectedModelIndex, terminalSize, focus } = state;
  
  if (!models || models.length === 0) {
    return (
      <Box flexDirection="column" height="100%" width="100%" padding={2} justifyContent="center" alignItems="center">
        <Text color="#888888">No models loaded</Text>
        <Text color="#666666">Models will appear when providers are connected</Text>
      </Box>
    );
  }

  // Group models by provider for better organization
    const modelsByProvider = models.reduce((acc: Record<string, any[]>, model: any) => {
      if (!acc[model.provider]) acc[model.provider] = [];
      acc[model.provider].push(model);
      return acc;
    }, {} as Record<string, any[]>);

  return (
    <Box flexDirection="column" height="100%" width="100%" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="50%">
          <Text color="#888888">◇ MODELS</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#888888">{models.length} models • {models.filter((m: any) => m.available).length} available</Text>
        </Box>
      </Box>

      {/* Table Header */}
      <Box flexDirection="row" borderStyle="single" borderColor="#333333" paddingX={1} paddingY={0}>
        <Box width={3}><Text color="#888888" bold>#</Text></Box>
        <Box width={25}><Text color="#888888" bold>MODEL</Text></Box>
        <Box width={12}><Text color="#888888" bold>PROVIDER</Text></Box>
        <Box width={8}><Text color="#888888" bold>STATUS</Text></Box>
        <Box width={10}><Text color="#888888" bold>CONTEXT</Text></Box>
        <Box width={8}><Text color="#888888" bold>MAX OUT</Text></Box>
        <Box width={10}><Text color="#888888" bold>SUCCESS%</Text></Box>
        <Box width={15}><Text color="#888888" bold>CAPABILITIES</Text></Box>
        <Box width={12}><Text color="#888888" bold>PRICING ($/M)</Text></Box>
      </Box>
      {/* Model Rows - grouped by provider */}
                                    {Object.entries(modelsByProvider).map((entry) => {
                                      const [providerName, providerModels] = entry as [string, any[]];
                                      return (
                                        <React.Fragment key={providerName}>
                                          {/* Provider group header */}
                                          <Box flexDirection="row" borderStyle="single" borderColor="#222222" paddingX={1} paddingY={0}>
                                            <Box width={3}>
                                              <Text color="#666666">──</Text>
                                            </Box>
                                            <Box width={25}>
                                              <Text color="#00d4ff" bold>
                                                ▼ {providerName.toUpperCase()}
                                              </Text>
                                            </Box>
                                            <Box width={12}>
                                              <Text color="#666666">{providerModels.length} models</Text>
                                            </Box>
                                          </Box>
                                          {/* Model Rows */}
                                          {providerModels.map((model: any, modelIdx: number) => {
                                            // Find global index of this model
                                            const globalIndex = models.indexOf(model);
                                            const isSelected = globalIndex === selectedModelIndex;
                                            const isFocused = focus === 'content';
                          
                                            return (
                                              <Box 
                                                key={model.id}
                                                flexDirection="row"
                                                borderStyle="single"
                                                borderColor={isSelected && isFocused ? '#00d4ff' : '#222222'}
                                                paddingX={1}
                                                paddingY={0}
                                              >
                                                <Box width={3}>
                                                  <Text color={isSelected ? '#00d4ff' : '#888888'} bold>
                                                    {globalIndex + 1}
                                                  </Text>
                                                </Box>
                                                <Box width={25}>
                                                  <Text color={isSelected ? '#ffffff' : model.enabled ? '#cccccc' : '#666666'} bold={isSelected}>
                                                    {model.name} {model.id !== model.name ? `(${model.id})` : ''}
                                                  </Text>
                                                </Box>
                                                <Box width={12}>
                                                  <Text color="#888888">{providerName}</Text>
                                                </Box>
                                                <Box width={8}>
                                                  <Text color={model.available ? '#00ff88' : '#ffaa00'} bold>
                                                    {model.available ? 'AVAIL' : model.enabled ? 'DISABLED' : 'OFFLINE'}
                                                  </Text>
                                                </Box>
                                                <Box width={10}>
                                                  <Text color="#ffffff">
                                                    {model.contextWindow >= 1000000 
                                                      ? (model.contextWindow / 1000000).toFixed(1) + 'M' 
                                                      : model.contextWindow >= 1000 
                                                        ? (model.contextWindow / 1000).toFixed(1) + 'K' 
                                                        : model.contextWindow.toString()}
                                                  </Text>
                                                </Box>
                                                <Box width={8}>
                                                  <Text color="#ffffff">{model.maxOutputTokens.toLocaleString()}</Text>
                                                </Box>
                                                <Box width={10}>
                                                  <Text color={model.successRate >= 95 ? '#00ff88' : model.successRate >= 80 ? '#ffaa00' : '#ff4444'}>
                                                    {model.successRate.toFixed(1)}%
                                                  </Text>
                                                </Box>
                                                <Box width={15}>
                                                  <Text color="#888888">
                                                    {model.capabilities.supportsChat && 'CHAT '}
                                                    {model.capabilities.supportsVision && 'VIS '}
                                                    {model.capabilities.supportsStreaming && 'STRM '}
                                                    {model.capabilities.supportsFunctionCalling && 'FCALL '}
                                                    {model.capabilities.supportsReasoning && 'REAS '}
                                                    {model.capabilities.supportsCoding && 'CODE '}
                                                  </Text>
                                                </Box>
                                                <Box width={12}>
                                                  <Text color="#888888">
                                                    In:{model.inputPricePerMillionTokens || 0} Out:{model.outputPricePerMillionTokens || 0}
                                                  </Text>
                                                </Box>
                                              </Box>
                                            );
                                          })}
                                        </React.Fragment>
                                      );
                                    })}

      {/* Footer info */}
      <Box marginTop={1} flexDirection="row">
        <Box width="50%">
          <Text color="#666666">↑↓ Navigate • PageUp/PageDown Fast Scroll • Home/End Jump • Esc Back</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#666666">Press TAB to focus navigation</Text>
        </Box>
      </Box>
    </Box>
  );
};