import React from 'react';
import { Box, Text } from 'ink';

interface NavButtonProps {
    label: string;
    shortcut?: string;
    active?: boolean;
}

export const NavButton: React.FC<NavButtonProps> = ({
    label,
    shortcut,
    active = false
}) => {
    return (
        <Box marginRight={2}>
            {shortcut && (
                <Text color="#00d4ff" bold>
                    [{shortcut}]
                </Text>
            )}

            <Text color={active ? "#ffffff" : "#8b9bb4"} bold={active}>
                {" "}{label}
            </Text>
        </Box>
    );
};