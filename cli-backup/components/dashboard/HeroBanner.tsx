import React from 'react';
import { Box, Text } from 'ink';

interface HeroBannerProps {
    version: string;
    uptime: string;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
    version,
    uptime
}) => {
    return (
        <Box
            borderStyle="round"
            borderColor="#00d4ff"
            paddingX={2}
            paddingY={1}
            flexDirection="column"
            marginBottom={1}
        >
            <Text color="#00d4ff" bold>
                HELIX
            </Text>

            <Text color="#8b9bb4">
                Intelligent AI Routing Platform
            </Text>

            <Box marginTop={1} justifyContent="space-between">
                <Text color="#ffffff">
                    Version {version}
                </Text>

                <Text color="#00ff88">
                    Uptime {uptime}
                </Text>
            </Box>
        </Box>
    );
};