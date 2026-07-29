import React, { useState, useEffect, useCallback, useRef } from 'react';
import { render, Box, Text, useInput, useStdout } from 'ink';

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
  const animationRef = useRef<NodeJS.Timeout>();
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Initialize particles on mount
  useEffect(() => {
    const newParticles: Particle[] = [];
    const particleCount = Math.min(40, Math.floor((terminalSize.width * terminalSize.height) / 300));
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        x: Math.random() * (terminalSize.width - 4) + 2,
        y: Math.random() * (terminalSize.height - 8) + 2,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.3,
        char: NEURAL_CHARS[Math.floor(Math.random() * NEURAL_CHARS.length)],
        color: NEURAL_COLORS[Math.floor(Math.random() * NEURAL_COLORS.length)],
        size: Math.random() * 0.5 + 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }
    setParticles(newParticles);
    generateConnections(newParticles);
  }, [terminalSize.width, terminalSize.height]);

  const generateConnections = (parts: Particle[]) => {
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
  };

  // Animation loop
  useEffect(() => {
    animationRef.current = setInterval(() => {
      setFrame(prev => (prev + 1) % 120);
      
      setParticles(prev => prev.map(p => {
        let newX = p.x + p.vx;
        let newY = p.y + p.vy;
        
        if (newX < 2) { newX = 2; p.vx = Math.abs(p.vx); }
        if (newX > terminalSize.width - 4) { newX = terminalSize.width - 4; p.vx = -Math.abs(p.vx); }
        if (newY < 2) { newY = 2; p.vy = Math.abs(p.vy); }
        if (newY > terminalSize.height - 8) { newY = terminalSize.height - 8; p.vy = -Math.abs(p.vy); }
        
        return {
          ...p,
          x: newX,
          y: newY,
          pulsePhase: p.pulsePhase + 0.08,
          char: NEURAL_CHARS[Math.floor((frame / 6 + p.pulsePhase) % NEURAL_CHARS.length)],
        };
      }));
      
      if (frame % 45 === 0) {
        setParticles(current => {
          generateConnections(current);
          return current;
        });
      }
    }, 33);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [frame, terminalSize.width, terminalSize.height]);

  // Check for completion
  useEffect(() => {
    if (progressRef.current >= 100 && onComplete) {
      setTimeout(() => {
        onComplete();
      }, 800);
    }
  }, [progress, onComplete]);

  // Render neural network background
  const renderBackground = () => {
    const grid: string[][] = Array(terminalSize.height)
      .fill(null)
      .map(() => Array(terminalSize.width).fill(' '));

    // Draw connections
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
        if (x >= 0 && x < terminalSize.width && y >= 0 && y < terminalSize.height) {
          const intensity = conn.opacity * (0.4 + 0.6 * Math.sin(frame * 0.08 + conn.pulsePhase));
          if (intensity > 0.25) {
            grid[y][x] = intensity > 0.5 ? '·' : '˙';
          }
        }
      }
    });

    // Draw particles
    particles.forEach(p => {
      const x = Math.round(p.x);
      const y = Math.round(p.y);
      if (x >= 0 && x < terminalSize.width && y >= 0 && y < terminalSize.height) {
        const pulse = 0.4 + 0.6 * Math.sin(frame * 0.12 + p.pulsePhase);
        if (pulse > 0.3) {
          grid[y][x] = p.char;
        }
      }
    });

    return grid.map(row => row.join('')).join('\n');
  };

  // Loading bar
  const barWidth = Math.min(60, terminalSize.width - 10);
  const filledWidth = Math.floor((progress / 100) * barWidth);
  const emptyWidth = barWidth - filledWidth;
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
      {/* Neural network background */}
      <Box height="100%" width="100%">
        <Text color="#003344">{renderBackground()}</Text>
      </Box>
      
      {/* Foreground content */}
      <Box flexDirection="column" height="100%" width="100%" justifyContent="center" alignItems="center">
        {/* Helix Logo */}
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

        {/* Loading bar */}
        <Box flexDirection="row" alignItems="center" marginBottom={1} width={barWidth + 4}>
          <Text color="#00d4ff">▐</Text>
          <Text color="#00ff88">{loadingBar}</Text>
          <Text color="#00d4ff">▌</Text>
        </Box>
        
        <Box marginBottom={1}>
          <Text color="#ffffff">{progress}%</Text>
        </Box>

        <Box marginTop={2} width={terminalSize.width - 4}>
          <Text color="#888888">
            {getLoadingMessage(progress)}
          </Text>
        </Box>

        {/* Progress dots */}
        <Box flexDirection="row" marginTop={2}>
          {[1, 2, 3, 4, 5].map((i, idx) => (
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