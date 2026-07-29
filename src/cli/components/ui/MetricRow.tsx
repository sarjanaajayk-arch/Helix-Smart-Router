import React from 'react';
import { Box, Text } from 'ink';

interface MetricRowProps {
    label: string;
    value: React.ReactNode;
    labelColor?: string;
    valueColor?: string;
    bold?: boolean;
}

export const MetricRow: React.FC<MetricRowProps> = ({
    label,
    value,
    labelColor = '#8b9bb4',
    valueColor = '#ffffff',
    bold = false
}) => {
    return (
        <Box justifyContent="space-between">
            <Text color={labelColor}>
                {label}
            </Text>

            <Text color={valueColor} bold={bold}>
                {value}
            </Text>
        </Box>
    );
};