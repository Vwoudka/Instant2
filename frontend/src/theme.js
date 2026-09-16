import { createGlobalStyle } from 'styled-components';
import styled from 'styled-components';

// Professional green/turquoise/yellow palette. Dark is the default look of INSTANT 2.
export const palettes = {
  dark: {
    name: 'dark',
    bg: '#0E1512',
    bg2: '#16211C',
    panel: 'rgba(255, 255, 255, 0.035)',
    panelBorder: 'rgba(255, 255, 255, 0.08)',
    text: '#EAF5EE',
    textDim: '#8FA69B',
    green: '#34D399',
    turquoise: '#2DD4BF',
    yellow: '#FACC15',
    emerald: '#00E676',
    orange: '#F59E0B',
    red: '#F87171',
    glow: 'rgba(52, 211, 153, 0.25)',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
  light: {
    name: 'light',
    bg: '#F4F9F6',
    bg2: '#FFFFFF',
    panel: 'rgba(255, 255, 255, 0.85)',
    panelBorder: 'rgba(16, 40, 30, 0.12)',
    text: '#14231C',
    textDim: '#5C7468',
    green: '#059669',
    turquoise: '#0D9488',
    yellow: '#D97706',
    emerald: '#00A862',
    orange: '#D97706',
    red: '#DC2626',
    glow: 'rgba(5, 150, 105, 0.2)',
    shadow: 'rgba(16, 40, 30, 0.12)',
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

// Subtle, professional backdrop with a soft green-turquoise wash.
export const Background = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
  overflow: hidden;
  background: ${(p) => p.theme.bg};
  background-image: ${(p) =>
    p.theme.name === 'dark'
      ? 'radial-gradient(1100px 560px at 85% -12%, rgba(45, 212, 191, 0.07), transparent 60%), radial-gradient(900px 640px at -8% 112%, rgba(52, 211, 153, 0.07), transparent 60%)'
      : 'radial-gradient(1100px 560px at 85% -12%, rgba(13, 148, 136, 0.06), transparent 60%), radial-gradient(900px 640px at -8% 112%, rgba(5, 150, 105, 0.06), transparent 60%)'};
`;