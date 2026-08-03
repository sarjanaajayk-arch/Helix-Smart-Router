import React from 'react';
import { Text } from 'ink';

export type StatusType =
    | 'healthy'
    | 'active'
    | 'enabled'
    | 'warning'
    | 'disabled'
    | 'offline'
    | 'error'
    | 'standby';

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
}

const STATUS_COLORS: Record<StatusType, string> = {
    healthy: '#00ff88',
    active: '#00ff88',
    enabled: '#00ff88',
    warning: '#ffaa00',
    standby: '#ffaa00',
    disabled: '#888888',
    offline: '#ff5555',
    error: '#ff5555'
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    status,
    label
}) => {
    const color = STATUS_COLORS[status];

    return (
        <Text color={color} bold>
            ● {label ?? status.toUpperCase()}
        </Text>
    );
};