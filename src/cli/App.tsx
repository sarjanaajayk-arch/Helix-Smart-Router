import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Box, Text } from 'ink';

import { NavigationManager } from './core/NavigationManager';
import { InputManager } from './core/InputManager';

import { NeuralAnimation } from './components/NeuralAnimation';
import { Navigation } from './components/Navigation';

import { Dashboard } from './pages/Dashboard';
import { ProvidersPage } from './pages/ProvidersPage';
import { ModelsPage } from './pages/ModelsPage';
import { RoutesPage } from './pages/RoutesPage';
import { StatusPage } from './pages/StatusPage';
import { ConfigPage } from './pages/ConfigPage';

import { useInputExt, ExtendedKey } from './hooks/useInputExt';
import { useBackend } from './hooks/useBackend';
import {
  Page,
  ProviderInfo,
  ModelInfo,
  RouteInfo,
  HealthInfo,
  MetricsSnapshot,
  ConfigInfo,
} from './types/AppState';

interface AppState {
  currentPage: Page;
  previousPage: Page;
  loadingProgress: number;
  loadingComplete: boolean;
  focus: 'navigation' | 'content';
  terminalSize: { width: number; height: number };
  providers: ProviderInfo[];
  models: ModelInfo[];
  metrics: MetricsSnapshot | null;
  health: HealthInfo | null;
  config: ConfigInfo | null;
  routes: RouteInfo[];
  selectedProviderIndex: number;
  selectedModelIndex: number;
  selectedRouteIndex: number;
  error: string | null;
}

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    currentPage: Page.Loading,
    previousPage: Page.Loading,
    loadingProgress: 0,
    loadingComplete: false,
    focus: 'navigation',
    terminalSize: { width: 80, height: 24 },
    providers: [],
    models: [],
    metrics: null,
    health: null,
    config: null,
    routes: [],
    selectedProviderIndex: 0,
    selectedModelIndex: 0,
    selectedRouteIndex: 0,
    error: null,
  });

  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const backend = useMemo(() => useBackend(setState), [setState]);

  const navigationManager = useRef(new NavigationManager()).current;
  const inputManager = useRef(new InputManager(navigationManager)).current;

  const handleInput = useCallback((input: string, key: ExtendedKey) => {
    if (!stateRef.current.loadingComplete) return;

    const {
      currentPage,
      focus,
      terminalSize,
      providers,
      models,
      routes,
    } = stateRef.current;

    if (key.escape) {
      if (focus === 'content') {
        setState(prev => ({ ...prev, focus: 'navigation' }));
      } else {
        setState(prev => ({
          ...prev,
          currentPage: Page.Dashboard,
          previousPage: Page.Dashboard,
          focus: 'navigation',
        }));
      }
      return;
    }

    if (key.tab) {
      setState(prev => ({
        ...prev,
        focus: prev.focus === 'navigation' ? 'content' : 'navigation',
      }));
      return;
    }

    if (focus === 'navigation') {
      if (key.leftArrow) {
        const previousPage = inputManager.handleNavigation(currentPage, 'previous');

        setState(prev => ({
          ...prev,
          currentPage: previousPage,
          previousPage,
        }));
        return;
      }

      if (key.rightArrow) {
        const nextPage = inputManager.handleNavigation(currentPage, 'next');

        setState(prev => ({
          ...prev,
          currentPage: nextPage,
          previousPage: nextPage,
        }));
        return;
      }

      if (key.return) {
        setState(prev => ({ ...prev, focus: 'content' }));
        return;
      }
    } else if (focus === 'content') {
      switch (currentPage) {
        case Page.Providers: {
          if (providers.length === 0) return;

          if (key.upArrow) {
            setState(prev => ({
              ...prev,
              selectedProviderIndex:
                (prev.selectedProviderIndex - 1 + providers.length) % providers.length,
            }));
          } else if (key.downArrow) {
            setState(prev => ({
              ...prev,
              selectedProviderIndex:
                (prev.selectedProviderIndex + 1) % providers.length,
            }));
          } else if (key.pageUp) {
            setState(prev => ({
              ...prev,
              selectedProviderIndex: Math.max(
                0,
                prev.selectedProviderIndex - Math.floor(terminalSize.height / 2)
              ),
            }));
          } else if (key.pageDown) {
            setState(prev => ({
              ...prev,
              selectedProviderIndex: Math.min(
                providers.length - 1,
                prev.selectedProviderIndex + Math.floor(terminalSize.height / 2)
              ),
            }));
          } else if (key.home) {
            setState(prev => ({ ...prev, selectedProviderIndex: 0 }));
          } else if (key.end) {
            setState(prev => ({
              ...prev,
              selectedProviderIndex: providers.length - 1,
            }));
          } else if (key.return) {
            // Provider details can be added later
          }
          break;
        }

        case Page.Models: {
          if (models.length === 0) return;

          if (key.upArrow) {
            setState(prev => ({
              ...prev,
              selectedModelIndex:
                (prev.selectedModelIndex - 1 + models.length) % models.length,
            }));
          } else if (key.downArrow) {
            setState(prev => ({
              ...prev,
              selectedModelIndex:
                (prev.selectedModelIndex + 1) % models.length,
            }));
          } else if (key.pageUp) {
            setState(prev => ({
              ...prev,
              selectedModelIndex: Math.max(
                0,
                prev.selectedModelIndex - Math.floor(terminalSize.height / 2)
              ),
            }));
          } else if (key.pageDown) {
            setState(prev => ({
              ...prev,
              selectedModelIndex: Math.min(
                models.length - 1,
                prev.selectedModelIndex + Math.floor(terminalSize.height / 2)
              ),
            }));
          } else if (key.home) {
            setState(prev => ({ ...prev, selectedModelIndex: 0 }));
          } else if (key.end) {
            setState(prev => ({
              ...prev,
              selectedModelIndex: models.length - 1,
            }));
          }
          break;
        }

        case Page.Routes: {
          if (routes.length === 0) return;

          if (key.upArrow) {
            setState(prev => ({
              ...prev,
              selectedRouteIndex:
                (prev.selectedRouteIndex - 1 + routes.length) % routes.length,
            }));
          } else if (key.downArrow) {
            setState(prev => ({
              ...prev,
              selectedRouteIndex:
                (prev.selectedRouteIndex + 1) % routes.length,
            }));
          } else if (key.pageUp) {
            setState(prev => ({
              ...prev,
              selectedRouteIndex: Math.max(
                0,
                prev.selectedRouteIndex - Math.floor(terminalSize.height / 2)
              ),
            }));
          } else if (key.pageDown) {
            setState(prev => ({
              ...prev,
              selectedRouteIndex: Math.min(
                routes.length - 1,
                prev.selectedRouteIndex + Math.floor(terminalSize.height / 2)
              ),
            }));
          } else if (key.home) {
            setState(prev => ({ ...prev, selectedRouteIndex: 0 }));
          } else if (key.end) {
            setState(prev => ({
              ...prev,
              selectedRouteIndex: routes.length - 1,
            }));
          } else if (key.return) {
            // Route action can be added later
          }
          break;
        }

        case Page.Status:
        case Page.Config:
        case Page.Dashboard:
          break;

        default:
          break;
      }
    }
  }, [inputManager]);

  useInputExt(handleInput);

  useEffect(() => {
    const handleResize = () => {
      let columns = 80;
      let rows = 24;

      if (process.stdout.getWindowSize) {
        [columns, rows] = process.stdout.getWindowSize();
      }

      setState(prev => ({
        ...prev,
        terminalSize: { width: columns, height: rows },
      }));
    };

    handleResize();
    process.on('SIGWINCH', handleResize);

    return () => {
      process.off('SIGWINCH', handleResize);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let progress = 0;

    const interval = setInterval(() => {
      if (!mounted) return;

      if (progress < 100) {
        progress += Math.random() * 10;
        if (progress > 100) progress = 100;

        setState(prev => ({
          ...prev,
          loadingProgress: Math.min(progress, 100),
        }));
      }
    }, 100);

    loadInitialData()
      .then(() => {
        if (!mounted) return;

        setState(prev => ({
          ...prev,
          loadingComplete: true,
          currentPage: Page.Dashboard,
          previousPage: Page.Dashboard,
        }));
      })
      .catch(err => {
        if (!mounted) return;

        setState(prev => ({
          ...prev,
          loadingComplete: true,
          error: err instanceof Error ? err.message : String(err),
          currentPage: Page.Dashboard,
          previousPage: Page.Dashboard,
        }));
      });

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadInitialData]);

  const renderPage = () => {
    switch (state.currentPage) {
      case Page.Dashboard:
        return <Dashboard state={state} />;
      case Page.Providers:
        return <ProvidersPage state={state} />;
      case Page.Models:
        return <ModelsPage state={state} />;
      case Page.Routes:
        return <RoutesPage state={state} />;
      case Page.Status:
        return <StatusPage state={state} />;
      case Page.Config:
        return <ConfigPage state={state} />;
      case Page.Loading:
      default:
        return (
          <NeuralAnimation
            progress={state.loadingProgress}
            terminalSize={state.terminalSize}
          />
        );
    }
  };

  return (
    <Box flexDirection="column" height="100%" width="100%">
      <Box
        flexDirection="row"
        height={3}
        width="100%"
        borderStyle="single"
        borderColor="#333333"
      >
        <Box width="50%">
          <Text color="#00d4ff" bold>
            ◆ HELIX CLI
          </Text>
        </Box>

        <Box width="50%" alignItems="flex-end">
          {state.error ? (
            <Text color="#ff4444">Error: {state.error}</Text>
          ) : state.loadingComplete ? (
            <Text color="#888888">
              {state.currentPage.toUpperCase()} • {new Date().toLocaleTimeString()}
            </Text>
          ) : (
            <Text color="#888888">Loading...</Text>
          )}
        </Box>
      </Box>

      <Box flexDirection="row" height={1} flexGrow={1} width="100%">
        <Box
          width={20}
          borderStyle={state.focus === 'navigation' ? 'double' : 'single'}
          borderColor={state.focus === 'navigation' ? '#00d4ff' : '#333333'}
        >
          <Navigation
            currentPage={state.currentPage}
            focus={state.focus === 'navigation'}
            terminalWidth={state.terminalSize.width}
          />
        </Box>

        <Box
          flexGrow={1}
          width={1}
          borderStyle={state.focus === 'content' ? 'double' : 'single'}
          borderColor={state.focus === 'content' ? '#00d4ff' : '#333333'}
          marginLeft={1}
        >
          {renderPage()}
        </Box>
      </Box>

      <Box
        flexDirection="row"
        height={3}
        width="100%"
        borderStyle="single"
        borderColor="#333333"
      >
        <Box width="50%" paddingX={1}>
          <Text color="#888888">
            {state.focus === 'navigation'
              ? '←→ Navigate • Enter Focus Content • Tab Toggle Focus'
              : state.currentPage === Page.Providers
                ? '↑↓ Select Provider • PgUp/PgDn Page • Home/End Jump • Enter Details • Esc Back'
                : state.currentPage === Page.Models
                  ? '↑↓ Select Model • PgUp/PgDn Page • Home/End Jump • Esc Back'
                  : state.currentPage === Page.Routes
                    ? '↑↓ Select Route • PgUp/PgDn Page • Home/End Jump • Enter Toggle • Esc Back'
                    : '↑↓ Scroll • PgUp/PgDn Page • Home/End Jump • Esc Back'}
          </Text>
        </Box>

        <Box width="50%" alignItems="flex-end" paddingX={1}>
          <Text color="#888888">Press Ctrl+C to Exit</Text>
        </Box>
      </Box>
    </Box>
  );
};