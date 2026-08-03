import React from 'react';
import { Box, Text } from 'ink';

import { Card } from '../ui/Card';
import { StatusBadge } from '../ui/StatusBadge';

interface Model {
    id?: string;
    name?: string;
    model?: string;
    available?: boolean;
    provider?: string;
}

interface ModelsCardProps {
    models: Model[];
}

export const ModelsCard: React.FC<ModelsCardProps> = ({
    models = []
}) => {

    const visibleModels = models.slice(0, 6);

    return (
        <Card title="MODELS">

            {visibleModels.length === 0 && (
                <Text color="#888888">
                    No models loaded
                </Text>
            )}

            {visibleModels.map((model, index) => {

                const name =
                    model.name ??
                    model.model ??
                    model.id ??
                    `Model ${index + 1}`;

                return (
                    <Box
                        key={name}
                        justifyContent="space-between"
                        marginBottom={1}
                    >

                        <Box flexDirection="column">

                            <Text color="#ffffff" bold>
                                {name}
                            </Text>

                            <Text color="#888888">
                                {model.provider ?? "Unknown Provider"}
                            </Text>

                        </Box>

                        <StatusBadge
                            status={model.available ? "healthy" : "disabled"}
                            label={model.available ? "READY" : "DISABLED"}
                        />

                    </Box>
                );
            })}

            {models.length > visibleModels.length && (
                <Box marginTop={1}>
                    <Text color="#888888">
                        +{models.length - visibleModels.length} more models...
                    </Text>
                </Box>
            )}

        </Card>
    );
};