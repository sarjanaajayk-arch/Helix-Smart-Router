import React from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
    value: number;
    max?: number;
    width?: number;
    color?: string;
    showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    width = 24,
    color = '#00d4ff',
    showPercentage = true
}) => {
    const percentage = Math.max(
        0,
        Math.min(100, (value / max) * 100)
    );

    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    return (
        <Box>
            <Text color={color}>
                {'█'.repeat(filled)}
            </Text>

            <Text color="#333333">
                {'░'.repeat(empty)}
            </Text>

            {showPercentage && (
                <Text color="#888888">
                    {' '}
                    {percentage.toFixed(0)}%
                </Text>
            )}
        </Box>
    );
};