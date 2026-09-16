import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';

// Professional blue/yellow palette. Dark is the default look of INSTANT 2.
export const palettes = {
  dark: {
    name: 'dark',
    bg: '#0B1020',
    bg2: '#121B30',
    panel: 'rgba(255, 255, 255, 0.04)',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    text: '#E8EEF8',
    textDim: '#7A88A8',
    green: '#3B82F6',
    turquoise: '#60A5FA',
    yellow: '#FACC15',
    emerald: '#2563EB',
    orange: '#F59E0B',
    red: '#F87171',
    glow: 'rgba(59, 130, 246, 0.25)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
  light: {
    name: 'light',
    bg: '#EFF4FB',
    bg2: '#FFFFFF',
    panel: 'rgba(255, 255, 255, 0.85)',
    panelBorder: 'rgba(16, 30, 60, 0.10)',
    text: '#141E35',
    textDim: '#5A6A8A',
    green: '#2563EB',
    turquoise: '#3B82F6',
    yellow: '#D97706',
    emerald: '#1D4ED8',
    orange: '#D97706',
    red: '#DC2626',
    glow: 'rgba(37, 99, 235, 0.2)',
    shadow: 'rgba(16, 30, 60, 0.10)',
  },
};

export const GlobalStyle = createGlobalStyle`
  * { box-sizing: border-box; }

  html, body, #root { min-height: 100%; }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
    background: ${(p) => p.theme.bg};
    color: ${(p) => p.theme.text};
    transition: background 0.4s ease, color 0.4s ease;
    -webkit-font-smoothing: antialiased;
  }

  h1, h2, h3, h4 {
    font-family: 'Space Grotesk', 'Inter', sans-serif;
    font-weight: 700;
    margin: 0;
  }

  button, input, select { font-family: inherit; }
  a { color: inherit; }

  @keyframes slideIn {
    from { transform: translateX(120%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes pulseDot {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.3); opacity: 1; }
  }
`;

// Subtle, professional backdrop with a soft blue wash.
export const Background = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: ${(p) => p.theme.bg};
  background-image: ${(p) =>
    p.theme.name === 'dark'
      ? 'radial-gradient(1100px 560px at 85% -12%, rgba(59, 130, 246, 0.08), transparent 60%), radial-gradient(900px 640px at -8% 112%, rgba(96, 165, 250, 0.06), transparent 60%)'
      : 'radial-gradient(1100px 560px at 85% -12%, rgba(59, 130, 246, 0.06), transparent 60%), radial-gradient(900px 640px at -8% 112%, rgba(37, 99, 235, 0.05), transparent 60%)'};
`;