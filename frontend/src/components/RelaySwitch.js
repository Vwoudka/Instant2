import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import { PlugIcon } from './Icons';

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: ${(p) => p.theme.panel};
  border: 1px solid ${(p) => p.theme.panelBorder};
  border-radius: 16px;
  padding: 22px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px ${(p) => p.theme.shadow};
`;

const PanelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Space Grotesk', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: ${(p) => p.theme.textDim};
`;

const Track = styled.button`
  width: 104px;
  height: 52px;
  border-radius: 28px;
  border: none;
  position: relative;
  cursor: pointer;
  background: ${(p) =>
    p.$on
      ? 'linear-gradient(135deg, #34D399, #0EA5A0)'
      : p.theme.name === 'dark'
      ? '#1C2A24'
      : '#E3EEE9'};
  box-shadow: ${(p) =>
    p.$on
      ? '0 0 18px rgba(52,211,153,.4), inset 0 0 14px rgba(255,255,255,.2)'
      : `inset 0 3px 8px ${p.theme.shadow}`};
  transition: background 0.3s ease;
  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const Knob = styled.span`
  position: absolute;
  top: 6px;
  left: ${(p) => (p.$on ? '58px' : '6px')};
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${(p) => (p.theme.name === 'dark' ? '#0f1613' : '#ffffff')};
  color: ${(p) => (p.$on ? '#34D399' : p.theme.textDim)};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.35);
`;

const StateLine = styled.div`
  font-family: 'Space Grotesk', sans-serif;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 2px;
  color: ${(p) => (p.$on ? p.theme.green : p.theme.textDim)};
  text-shadow: ${(p) => (p.$on ? `0 0 16px ${p.theme.green}88` : 'none')};
`;

const Hint = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: ${(p) => p.theme.textDim};
  text-align: center;
`;

// Relay control panel. Publishing `relay/command` is only the request — the
// device applies the command and echoes the resulting state on `relay/state`,
// so the UI switch reflects the actual device state, not just the request.
export default function RelaySwitch() {
  const { state, toggleRelay } = useApp();
  const [busy, setBusy] = useState(false);
  const on = state.relay === 'ON';

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    await toggleRelay();
    setBusy(false);
  };

  return (
    <Panel>
      <PanelTitle>
        <PlugIcon size={16} /> Relay Control
      </PanelTitle>
      <Track
        $on={on}
        onClick={handle}
        disabled={busy}
        role="switch"
        aria-checked={on}
        aria-label="Relay switch"
      >
        <Knob $on={on}>
          <PlugIcon size={18} />
        </Knob>
      </Track>
      <StateLine $on={on}>{on ? 'RELAY ON' : 'RELAY OFF'}</StateLine>
      <Hint>
        Click to send &quot;{on ? 'OFF' : 'ON'}&quot; on <code>relay/command</code>.
        The device applies it and reports back on <code>relay/state</code>.
      </Hint>
    </Panel>
  );
}