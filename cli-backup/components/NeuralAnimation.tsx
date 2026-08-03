import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Box, Text } from 'ink';

interface TerminalSize {
  width: number;
  height: number;
}

interface NeuralAnimationProps {
  progress: number;
  terminalSize: TerminalSize;
  onComplete?: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  color: string;
  size: number;
  pulsePhase: number;
}

interface Connection {
  from: number;
  to: number;
  opacity: number;
  pulsePhase: number;
}

const NEURAL_CHARS = ['⠁', '⠂', '⠄', '⡀', '⢀', '⠈', '⠐', '⠠'];
const NEURAL_COLORS = ['#00d4ff', '#00ff88', '#ff6b35', '#ffd700', '#ff006e', '#8338ec', '#3a86ff', '#fb5607'];

export const NeuralAnimation: React.FC<NeuralAnimationProps> = ({
  progress,
  terminalSize,
  onComplete
}) => {
  const [frame, setFrame] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);

  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const frameRef = useRef(0);
  const completionTriggeredRef = useRef(false);

  const generateConnections = useCallback((parts: Particle[]) => {
    const newConnections: Connection[] = [];

    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const dx = parts[i].x - parts[j].x;
        const dy = parts[i].y - parts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 18 && Math.random() < 0.25) {
          newConnections.push({
            from: i,
            to: j,
            opacity: Math.random() * 0.4 + 0.15,
            pulsePhase: Math.random() * Math.PI * 2,
          });
        }
      }
    }

    setConnections(newConnections);
  }, []);

  useEffect(() => {
    const safeWidth = Math.max(20, terminalSize.width);
    const safeHeight = Math.max(12, terminalSize.height);

    const newParticles: Particle[] = [];
    const particleCount = Math.min(40, Math.floor((safeWidth * safeHeight) / 300));

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * Math.max(1, safeWidth - 4) + 2,
        y: Math.random() * Math.max(1, safeHeight - 8) + 2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        char: NEURAL_CHARS[Math.floor(Math.random() * NEURAL_CHARS.length)],
        color: NEURAL_COLORS[Math.floor(Math.random() * NEURAL_COLORS.length)],
        size: Math.random() * 0.5 + 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    frameRef.current = 0;
    setFrame(0);
    setParticles(newParticles);
    generateConnections(newParticles);
  }, [terminalSize.width, terminalSize.height, generateConnections]);

  useEffect(() => {
    animationRef.current = setInterval(() => {
      const nextFrame = (frameRef.current + 1) % 120;
      frameRef.current = nextFrame;
      setFrame(nextFrame);

      setParticles(prev => {
        const safeWidth = Math.max(20, terminalSize.width);
        const safeHeight = Math.max(12, terminalSize.height);

        const nextParticles = prev.map(p => {
          let nextX = p.x + p.vx;
          let nextY = p.y + p.vy;
          let nextVx = p.vx;
          let nextVy = p.vy;

          if (nextX < 2) {
            nextX = 2;
            nextVx = Math.abs(nextVx);
          }
          if (nextX > safeWidth - 4) {
            nextX = safeWidth - 4;
            nextVx = -Math.abs(nextVx);
          }
          if (nextY < 2) {
            nextY = 2;
            nextVy = Math.abs(nextVy);
          }
          if (nextY > safeHeight - 8) {
            nextY = safeHeight - 8;
            nextVy = -Math.abs(nextVy);
          }

          return {
            ...p,
            x: nextX,
            y: nextY,
            vx: nextVx,
            vy: nextVy,
            pulsePhase: p.pulsePhase + 0.08,
            char: NEURAL_CHARS[Math.floor((nextFrame / 6 + p.pulsePhase) % NEURAL_CHARS.length)],
          };
        });

        if (nextFrame % 45 === 0) {
          generateConnections(nextParticles);
        }

        return nextParticles;
      });
    }, 33);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [terminalSize.width, terminalSize.height, generateConnections]);

  useEffect(() => {
    if (progress < 100 || !onComplete || completionTriggeredRef.current) {
      return;
    }

    completionTriggeredRef.current = true;
    const timeout = setTimeout(() => {
      onComplete();
    }, 800);

    return () => {
      clearTimeout(timeout);
    };
  }, [progress, onComplete]);

  const renderBackground = () => {
    const width = Math.max(1, terminalSize.width);
    const height = Math.max(1, terminalSize.height);

    const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

    connections.forEach(conn => {
      const from = particles[conn.from];
      const to = particles[conn.to];
      if (!from || !to) return;

      const x1 = Math.round(from.x);
      const y1 = Math.round(from.y);
      const x2 = Math.round(to.x);
      const y2 = Math.round(to.y);

      const steps = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
      if (steps === 0) return;

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = Math.round(x1 + (x2 - x1) * t);
        const y = Math.round(y1 + (y2 - y1) * t);

        if (x >= 0 && x < width && y >= 0 && y < height) {
          const intensity = conn.opacity * (0.4 + 0.6 * Math.sin(frame * 0.08 + conn.pulsePhase));
          if (intensity > 0.25) {
            grid[y][x] = intensity > 0.5 ? '·' : '˙';
          }
        }
      }
    });

    particles.forEach(p => {
      const x = Math.round(p.x);
      const y = Math.round(p.y);

      if (x >= 0 && x < width && y >= 0 && y < height) {
        const pulse = 0.4 + 0.6 * Math.sin(frame * 0.12 + p.pulsePhase);
        if (pulse > 0.3) {
          grid[y][x] = p.char;
        }
      }
    });

    return grid.map(row => row.join('')).join('\n');
  };

  const barWidth = Math.max(10, Math.min(60, terminalSize.width - 10));
  const filledWidth = Math.floor((progress / 100) * barWidth);
  const emptyWidth = Math.max(0, barWidth - filledWidth);
  const loadingBar = '▓'.repeat(filledWidth) + '░'.repeat(emptyWidth);

  const getLoadingMessage = (p: number) => {
    if (p < 15) return 'Initializing neural pathways...';
    if (p < 30) return 'Connecting to provider mesh...';
    if (p < 50) return 'Calibrating routing engine...';
    if (p < 70) return 'Loading model registry...';
    if (p < 90) return 'Synchronizing health metrics...';
    return 'Neural network synchronized';
  };

  return (
    <Box flexDirection="column" height="100%" width="100%">
      <Box height="100%" width="100%">
        <Text color="#003344">{renderBackground()}</Text>
      </Box>

      <Box flexDirection="column" height="100%" width="100%" justifyContent="center" alignItems="center">
        <Box marginBottom={2}>
          <Text color="#00d4ff" bold>
            ╔═══════════════════════════════════════╗
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="#00d4ff" bold>
            ║                                        ║
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="#ffffff" bold>
            H E L I X
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="#888888" bold>
            N E U R A L  R O U T E R
          </Text>
        </Box>
        <Box marginBottom={1}>
          <Text color="#00d4ff" bold>
            ║                                        ║
          </Text>
        </Box>
        <Box marginBottom={3}>
          <Text color="#00d4ff" bold>
            ╚═══════════════════════════════════════╝
          </Text>
        </Box>

        <Box flexDirection="row" alignItems="center" marginBottom={1} width={barWidth + 4}>
          <Text color="#00d4ff">▐</Text>
          <Text color="#00ff88">{loadingBar}</Text>
          <Text color="#00d4ff">▌</Text>
        </Box>

        <Box marginBottom={1}>
          <Text color="#ffffff">{progress}%</Text>
        </Box>

        <Box marginTop={2} width={Math.max(20, terminalSize.width - 4)}>
          <Text color="#888888">
            {getLoadingMessage(progress)}
          </Text>
        </Box>

        <Box flexDirection="row" marginTop={2}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box key={i} marginX={1}>
              <Text
                color={progress >= i * 20 ? '#00ff88' : '#333333'}
                bold={progress >= i * 20}
              >
                ●
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
};