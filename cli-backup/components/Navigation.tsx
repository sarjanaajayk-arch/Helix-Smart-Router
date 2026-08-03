import React from 'react';
import { Box, Text } from 'ink';

interface NavigationProps {
  currentPage: string;
  focus: boolean;
  terminalWidth: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentPage,
  focus,
  terminalWidth,
}) => {
  const pages = [
    { id: 'Dashboard', label: 'DASHBOARD', icon: '▣' },
    { id: 'Providers', label: 'PROVIDERS', icon: '◆' },
    { id: 'Models', label: 'MODELS', icon: '◇' },
    { id: 'Routes', label: 'ROUTES', icon: '▦' },
    { id: 'Status', label: 'STATUS', icon: '▥' },
    { id: 'Config', label: 'CONFIG', icon: '▧' },
  ];

  const itemWidth = Math.max(10, Math.floor((terminalWidth - 8) / pages.length));

  return (
    <Box
      flexDirection="row"
      height={3}
      width="100%"
      paddingX={2}
      borderStyle={focus ? 'double' : 'single'}
      borderColor={focus ? '#00d4ff' : '#333333'}
    >
      {pages.map((page, index) => {
        const isActive = currentPage === page.id;

        return (
          <Box
            key={page.id}
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            width={itemWidth}
            borderStyle={isActive ? 'single' : undefined}
            borderColor="#00d4ff"
            marginRight={index < pages.length - 1 ? 1 : 0}
          >
            <Box flexDirection="row" alignItems="center">
              <Text color={isActive ? '#00d4ff' : '#888888'}>
                {page.icon}
              </Text>

              <Box marginLeft={1}>
                <Text
                  color={isActive ? '#ffffff' : '#888888'}
                  bold={isActive}
                >
                  {page.label}
                </Text>
              </Box>
            </Box>

            {isActive && (
              <Box marginTop={1}>
                <Text color="#00d4ff" bold>
                  {'▀'.repeat(page.label.length + 2)}
                </Text>
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
};