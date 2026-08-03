import React from 'react';
import { Box, Text } from 'ink';

import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';

interface Provider {
    provider: string;
    healthy: boolean;
    enabled: boolean;
    averageLatency?: number;
    successRate?: number;
}

interface ProvidersCardProps {
    providers: Provider[];
}

export const ProvidersCard: React.FC<ProvidersCardProps> = ({
    providers = []
}) => {
    return (
        <Card title="PROVIDERS">

            {providers.length === 0 && (
                <Text color="#888888">
                    No providers available
                </Text>
            )}

            {providers.slice(0, 6).map((provider) => (
                <Box
                    key={provider.provider}
                    justifyContent="space-between"
                    marginBottom={1}
                >
                    <Box flexDirection="column">

                        <Text color="#ffffff" bold>
                            {provider.provider}
                        </Text>

                        <Text color="#888888">
                            {provider.averageLatency ?? 0} ms • {(provider.successRate ?? 0).toFixed(1)}%
                        </Text>

                    </Box>

                    <StatusBadge
                        status={provider.healthy ? "healthy" : "offline"}
                        label={provider.healthy ? "ONLINE" : "OFFLINE"}
                    />

                </Box>
            ))}

            {providers.length > 6 && (
                <Box marginTop={1}>
                    <Text color="#888888">
                        +{providers.length - 6} more providers...
                    </Text>
                </Box>
            )}

        </Card>
    );
};