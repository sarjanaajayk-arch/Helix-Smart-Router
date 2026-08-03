import React from 'react';
import { Box } from 'ink';

import { Card } from '../ui/Card';
import { MetricRow } from '../ui/MetricRow';
import { StatusBadge } from '../ui/StatusBadge';

interface CurrentRouteCardProps {
    provider: string;
    model: string;
    latency: number;
    successRate: string | number;
}

export const CurrentRouteCard: React.FC<CurrentRouteCardProps> = ({
    provider,
    model,
    latency,
    successRate
}) => {
    return (
        <Card title="CURRENT ROUTE">

            <Box marginBottom={1}>
                <StatusBadge
                    status="healthy"
                    label="LIVE"
                />
            </Box>

            <MetricRow
                label="Provider"
                value={provider}
                bold
                valueColor="#00ff88"
            />

            <MetricRow
                label="Model"
                value={model}
                bold
                valueColor="#00d4ff"
            />

            <MetricRow
                label="Latency"
                value={`${latency} ms`}
                valueColor="#ffffff"
            />

            <MetricRow
                label="Success Rate"
                value={`${successRate}%`}
                valueColor="#00ff88"
            />

        </Card>
    );
};