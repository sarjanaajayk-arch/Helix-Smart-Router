import React from 'react';
import { Box } from 'ink';

import { Card } from '../ui/Card';
import { MetricRow } from '../ui/MetricRow';

interface StatusStripProps {
    providers: any[];
    models: any[];
    metrics: any;
}

export const StatusStrip: React.FC<StatusStripProps> = ({
    providers = [],
    models = [],
    metrics = {}
}) => {
    const healthyProviders = providers.filter(p => p.healthy).length;
    const totalProviders = providers.length;

    const totalModels = models.length;

    const totalRequests = metrics.totalRequests ?? 0;
    const averageLatency = metrics.averageLatency ?? 0;

    return (
        <Card title="SYSTEM STATUS">

            <Box justifyContent="space-between">

                <MetricRow
                    label="Providers"
                    value={`${healthyProviders}/${totalProviders}`}
                    bold
                    valueColor="#00ff88"
                />

                <MetricRow
                    label="Models"
                    value={totalModels}
                    bold
                    valueColor="#ffffff"
                />

                <MetricRow
                    label="Requests"
                    value={totalRequests.toLocaleString()}
                    bold
                    valueColor="#ffffff"
                />

                <MetricRow
                    label="Latency"
                    value={`${averageLatency} ms`}
                    bold
                    valueColor="#00d4ff"
                />

            </Box>

        </Card>
    );
};