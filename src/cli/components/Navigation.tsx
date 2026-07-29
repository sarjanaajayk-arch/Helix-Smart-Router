import React from 'react';
import { Box, Text } from 'ink';

interface NavigationProps {
  currentPage: string;
  focus: boolean;
  terminalWidth: number;
}

export const Navigation: React.FC<NavigationProps> = ({ currentPage, focus, terminalWidth }) => {
  const pages = [
    { id: 'Dashboard', label: 'DASHBOARD', icon: '▣' },
    { id: 'Providers', label: 'PROVIDERS', icon: '◆' },
    { id: 'Models', label: 'MODELS', icon: '◇' },
    { id: 'Routes', label: 'ROUTES', icon: '▦' },
    { id: 'Status', label: 'STATUS', icon: '▥' },
    { id: 'Config', label: 'CONFIG', icon: '▧' },
  ];

  const itemWidth = Math.floor((terminalWidth - 8) / pages.length);

  return (
    <Box 
      flexDirection="row" 
      height={3} 
      width="100%" 
      paddingX={2}
      borderStyle={focus ? 'double' : 'single'}
      borderColor={focus ? '#00d4ff' : '#333333'}
    >
      {pages.map((page, index) => (
        <Box 
          key={page.id}
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          width={itemWidth}
          borderStyle={currentPage === page.id ? 'single' : undefined}
          borderColor="#00d4ff"
          marginRight={index < pages.length - 1 ? 1 : 0}
        >
          <Box flexDirection="row" alignItems="center">
            <Text color={currentPage === page.id ? '#00d4ff' : '#888888'}>
              {page.icon} 
            </Text>
            <Box marginLeft={1}>
              <Text 
                color={currentPage === page.id ? '#ffffff' : '#888888'}
                bold={currentPage === page.id}
              >
                {page.label}
              </Text>
            </Box>
          </Box>
          {currentPage === page.id && (
            <Box marginTop={1}>
              <Text color="#00d4ff" bold>{'▀'.repeat(page.label.length + 2)}</Text>
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};