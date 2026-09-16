import React from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import { WarningIcon } from './Icons';

const Banner = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 14px;
  background: linear-gradient(90deg, rgba(248, 113, 113, 0.14), rgba(248, 113, 113, 0.04));
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: ${(p) => p.theme.text};
  animation: fadeIn 0.3s ease;
`;

const ResetBtn = styled.button`
  margin-left: auto;
  padding: 7px 14px;
  border-radius: 9px;
  border: 1px solid ${(p) => p.theme.red};
  background: transparent;
  color: ${(p) => p.theme.red};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  &:hover {
    background: ${(p) => p.theme.red};
    color: #ffffff;
  }
`;

// Warning banner shown whenever a safety limit is exceeded.
export default function FaultBanner({ fault }) {
  const { resetFault } = useApp();

  return (
    <Banner role="alert">
      <WarningIcon size={22} color="#F87171" />
      <div>
        <strong style={{ color: '#F87171' }}>DÉFAUT DÉTECTÉ</strong>
        <div style={{ fontSize: 13, marginTop: 2 }}>
          {fault} — un ou plusieurs seuils de sécurité ont été dépassés.
        </div>
      </div>
      <ResetBtn onClick={resetFault}>Réinitialiser</ResetBtn>
    </Banner>
  );
}