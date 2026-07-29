import React from 'react';
import { Box, Text } from 'ink';

export interface CardProps {
  title?: string;
  children: React.ReactNode;

  width?: number | string;
  height?: number | string;

  selected?: boolean;

  borderColor?: string;

  padding?: number;

  marginRight?: number;
  marginBottom?: number;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  width,
  height,
  selected = false,
  borderColor = '#2d3748',
  padding = 1,
  marginRight = 0,
  marginBottom = 0
}) => {
  return (
    <Box
      width={width}
      height={height}
      marginRight={marginRight}
      marginBottom={marginBottom}
      borderStyle="round"
      borderColor={selected ? '#00d4ff' : borderColor}
      padding={padding}
      flexDirection="column"
    >
      {title && (
        <Box marginBottom={1}>
          <Text
            color={selected ? '#00d4ff' : '#8b9bb4'}
            bold
          >
            {title}
          </Text>
        </Box>
      )}

      <Box flexGrow={1} flexDirection="column">
        {children}
      </Box>
    </Box>
  );
};