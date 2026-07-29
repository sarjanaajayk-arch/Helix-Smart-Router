import React from 'react';
import { Box, Text } from 'ink';

interface SectionTitleProps {
    title: string;
    subtitle?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
    title,
    subtitle
}) => {
    return (
        <Box justifyContent="space-between" marginBottom={1}>
            <Text color="#00d4ff" bold>
                {title}
            </Text>

            {subtitle && (
                <Text color="#6b7280">
                    {subtitle}
                </Text>
            )}
        </Box>
    );
};