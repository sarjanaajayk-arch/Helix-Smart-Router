import React from 'react';
import { Box, Text } from 'ink';

import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';
import { MetricRow } from '../ui/MetricRow';

interface RoutingEngineCardProps {
    policy: string;
    provider: string;
    capabilityFiltering?: boolean;
    providerScoring?: boolean;
    retryEnabled?: boolean;
    failoverEnabled?: boolean;
}

export const RoutingEngineCard: React.FC<RoutingEngineCardProps> = ({
    policy,
    provider,
    capabilityFiltering = true,
    providerScoring = true,
    retryEnabled = true,
    failoverEnabled = true
}) => {
    return (
        <Card title="SMART ROUTING ENGINE">

            <Box marginBottom={1}>
                <StatusBadge
                    status="active"
                    label="ACTIVE"
                />
            </Box>

            <MetricRow
                label="Policy"
                value={policy}
                bold
                valueColor="#00d4ff"
            />

            <MetricRow
                label="Provider"
                value={provider}
                bold
                valueColor="#00ff88"
            />

            <Box marginTop={1}>
                <Text color="#8b9bb4" bold>
                    FEATURES
                </Text>
            </Box>

            <MetricRow
                label="Capability Filter"
                value={capabilityFiltering ? "Enabled" : "Disabled"}
                valueColor={capabilityFiltering ? "#00ff88" : "#ff5555"}
            />

            <MetricRow
                label="Provider Scoring"
                value={providerScoring ? "Enabled" : "Disabled"}
                valueColor={providerScoring ? "#00ff88" : "#ff5555"}
            />

            <MetricRow
                label="Retry Engine"
                value={retryEnabled ? "Enabled" : "Disabled"}
                valueColor={retryEnabled ? "#00ff88" : "#ff5555"}
            />

            <MetricRow
                label="Failover"
                value={failoverEnabled ? "Enabled" : "Disabled"}
                valueColor={failoverEnabled ? "#00ff88" : "#ff5555"}
            />

        </Card>
    );
};