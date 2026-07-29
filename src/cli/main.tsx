#!/usr/bin/env node
/**
 * Helix CLI - Interactive Terminal UI
 * Main Entry Point
 */

import React from 'react';
import { render, Box, Text, useInput, useStdout } from 'ink';
import { App } from './App.js';

// CLI banner
console.log('\x1b[2J\x1b[H'); // Clear screen

const { unmount } = render(<App />);

// Handle graceful shutdown
process.on('SIGINT', () => {
  unmount();
  process.exit(0);
});

process.on('SIGTERM', () => {
  unmount();
  process.exit(0);
});

export { App };