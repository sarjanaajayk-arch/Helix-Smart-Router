import React from 'react';
import { Box } from 'ink';

import { Card } from '../ui/Card';
import { MetricRow } from '../ui/MetricRow';

interface MetricsCardProps {
    totalRequests: number;
    retries: number;
    failovers: number;
    throughput?: number;
    errorRate?: number;
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
    totalRequests,
    retries,
    failovers,
    throughput = 0,
    errorRate = 0
}) => {
    return (
        <Card title="SYSTEM METRICS">

            <MetricRow
                label="Requests"
                value={totalRequests.toLocaleString()}
                bold
                valueColor="#ffffff"
            />

            <MetricRow
                label="Retries"
                value={retries}
                valueColor="#ffaa00"
            />

            <MetricRow
                label="Failovers"
                value={failovers}
                valueColor={failovers > 0 ? "#ffaa00" : "#00ff88"}
            />

            <MetricRow
                label="Throughput"
                value={`${throughput} req/s`}
                valueColor="#00d4ff"
            />

            <MetricRow
                label="Error Rate"
                value={`${errorRate}%`}
                valueColor={errorRate > 1 ? "#ff4444" : "#00ff88"}
            />

        </Card>
    );
};