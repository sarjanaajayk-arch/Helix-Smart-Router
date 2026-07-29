import React from 'react';
import { Box, Text } from 'ink';

interface BottomNavigationProps {
    currentPage?: string;
}

const pages = [
    "Dashboard",
    "Providers",
    "Models",
    "Routes",
    "Status",
    "Config"
];

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
    currentPage = "Dashboard"
}) => {
    return (
        <Box
            marginTop={1}
            borderStyle="round"
            borderColor="#00d4ff"
            paddingX={1}
            paddingY={0}
            justifyContent="space-between"
        >
            {pages.map((page) => {

                const active = page === currentPage;

                return (
                    <Text
                        key={page}
                        color={active ? "#00d4ff" : "#888888"}
                        bold={active}
                    >
                        {active ? `● ${page}` : page}
                    </Text>
                );
            })}
        </Box>
    );
};