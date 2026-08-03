import React from 'react';
import { Box, Text } from 'ink';

interface ConfigPageProps {
  state: any;
}

export const ConfigPage: React.FC<ConfigPageProps> = ({ state }) => {
  const { config, terminalSize } = state;
  
  if (!config) {
    return (
      <Box flexDirection="column" height="100%" width="100%" padding={2} justifyContent="center" alignItems="center">
        <Text color="#888888">Loading configuration...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" height="100%" width="100%" paddingX={2} paddingY={1}>
      {/* Header */}
      <Box flexDirection="row" marginBottom={1}>
        <Box width="50%">
          <Text color="#00d4ff" bold>⚙ CONFIGURATION</Text>
        </Box>
        <Box width="50%" alignItems="flex-end">
          <Text color="#888888">Runtime settings</Text>
        </Box>
      </Box>

      {/* Router Configuration */}
      <Box borderStyle="single" borderColor="#00d4ff" padding={1} marginBottom={1}>
        <Text color="#00d4ff" bold>ROUTER CONFIGURATION</Text>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="50%">
            <Text color="#888888">Smart Routing:</Text>
            <Box marginX={1}>
              <Text color={config.router?.enableSmartRouting ? '#00ff88' : '#ffaa00'} bold>
                {config.router?.enableSmartRouting ? 'ENABLED' : 'DISABLED'}
              </Text>
            </Box>
          </Box>
          <Box width="50%">
            <Text color="#888888">Default Provider:</Text>
            <Box marginX={1}>
              <Text color="#00d4ff" bold>{config.router?.defaultProvider || 'N/A'}</Text>
            </Box>
          </Box>
        </Box>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="50%">
            <Text color="#888888">Default Policy:</Text>
            <Box marginX={1}>
              <Text color="#ffd700" bold>{config.router?.defaultPolicy || 'BALANCED'}</Text>
            </Box>
          </Box>
          <Box width="50%">
            <Text color="#888888">Default Task Type:</Text>
            <Box marginX={1}>
              <Text color="#ffd700" bold>{config.router?.defaultTaskType || 'CHAT'}</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Provider Configuration */}
      <Box borderStyle="single" borderColor="#00d4ff" padding={1} marginBottom={1}>
        <Text color="#00d4ff" bold>PROVIDER CONFIGURATION</Text>
        
        {config.providers && Object.entries(config.providers).map(([name, settings]: [string, any]) => (
          <Box key={name} marginTop={1} paddingX={1} borderStyle="single" borderColor="#222222" padding={1}>
            <Text color="#00d4ff" bold>{name.toUpperCase()}</Text>
            <Box flexDirection="row" marginTop={1}>
              <Box width="25%">
                <Text color="#888888">Enabled:</Text>
                <Box marginX={1}>
                  <Text color={settings.enabled ? '#00ff88' : '#ffaa00'} bold>
                    {settings.enabled ? 'YES' : 'NO'}
                  </Text>
                </Box>
              </Box>
              <Box width="25%">
                <Text color="#888888">Priority:</Text>
                <Box marginX={1}>
                  <Text color="#ffd700" bold>P{settings.priority}</Text>
                </Box>
              </Box>
              <Box width="25%">
                <Text color="#888888">Timeout:</Text>
                <Box marginX={1}>
                  <Text color="#ffffff" bold>{settings.timeout}ms</Text>
                </Box>
              </Box>
              <Box width="25%">
                <Text color="#888888">Max Retries:</Text>
                <Box marginX={1}>
                  <Text color="#ffd700" bold>{settings.maxRetries}</Text>
                </Box>
              </Box>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Timeout Configuration */}
      <Box borderStyle="single" borderColor="#00d4ff" padding={1} marginBottom={1}>
        <Text color="#00d4ff" bold>TIMEOUT CONFIGURATION</Text>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="33%">
            <Text color="#888888">Provider Timeout:</Text>
            <Box marginX={1}>
              <Text color="#ffffff" bold>{config.timeouts?.providerTimeoutMs || 0}ms</Text>
            </Box>
          </Box>
          <Box width="33%">
            <Text color="#888888">Request Timeout:</Text>
            <Box marginX={1}>
              <Text color="#ffffff" bold>{config.timeouts?.requestTimeoutMs || 0}ms</Text>
            </Box>
          </Box>
          <Box width="33%">
            <Text color="#888888">Stream Timeout:</Text>
            <Box marginX={1}>
              <Text color="#ffffff" bold>{config.timeouts?.streamTimeoutMs || 0}ms</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Retry Configuration */}
      <Box borderStyle="single" borderColor="#00d4ff" padding={1} marginBottom={1}>
        <Text color="#00d4ff" bold>RETRY CONFIGURATION</Text>
        
        <Box flexDirection="row" marginTop={1}>
          <Box width="25%">
            <Text color="#888888">Max Retries:</Text>
            <Box marginX={1}>
              <Text color="#ffd700" bold>{config.retries?.maxRetries || 0}</Text>
            </Box>
          </Box>
          <Box width="25%">
            <Text color="#888888">Base Delay:</Text>
            <Box marginX={1}>
              <Text color="#ffffff" bold>{config.retries?.baseDelayMs || 0}ms</Text>
            </Box>
          </Box>
          <Box width="25%">
            <Text color="#888888">Max Delay:</Text>
            <Box marginX={1}>
              <Text color="#ffffff" bold>{config.retries?.maxDelayMs || 0}ms</Text>
            </Box>
          </Box>
          <Box width="25%">
            <Text color="#888888">Backoff Multiplier:</Text>
            <Box marginX={1}>
              <Text color="#ffffff" bold>{config.retries?.backoffMultiplier || 0}x</Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Environment Variables */}
      <Box borderStyle="single" borderColor="#00d4ff" padding={1}>
        <Text color="#00d4ff" bold>ENVIRONMENT</Text>
        
        <Box marginTop={1} flexDirection="row">
          <Box width="30%">
            <Text color="#888888">NODE_ENV:</Text>
          </Box>
          <Box width="70%">
            <Text color="#ffffff">{process.env.NODE_ENV || 'development'}</Text>
          </Box>
        </Box>
        <Box flexDirection="row">
          <Box width="30%">
            <Text color="#888888">PORT:</Text>
          </Box>
          <Box width="70%">
            <Text color="#ffffff">{process.env.PORT || '8080'}</Text>
          </Box>
        </Box>
        <Box flexDirection="row">
          <Box width="30%">
            <Text color="#888888">GEMINI_API_KEY:</Text>
          </Box>
          <Box width="70%">
            <Text color={process.env.GEMINI_API_KEY ? '#00ff88' : '#ff4444'}>
              {process.env.GEMINI_API_KEY ? '●●●●●●●●●●●●●●●●' : 'NOT SET'}
            </Text>
          </Box>
        </Box>
        <Box flexDirection="row">
          <Box width="30%">
            <Text color="#888888">OPENROUTER_API_KEY:</Text>
          </Box>
          <Box width="70%">
            <Text color={process.env.OPENROUTER_API_KEY ? '#00ff88' : '#ff4444'}>
              {process.env.OPENROUTER_API_KEY ? '●●●●●●●●●●●●●●●●' : 'NOT SET'}
            </Text>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};