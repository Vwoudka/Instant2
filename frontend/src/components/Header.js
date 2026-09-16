import React from 'react';
import { NavLink } from 'react-router-dom';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import StatusDot from './StatusDot';
import { LogoIcon, SunIcon, MoonIcon } from './Icons';

const HeaderBar = styled.header`
  display: flex;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
  padding: 14px 20px;
  margin-bottom: 22px;
  border-radius: 16px;
  background: ${(p) => p.theme.panel};
  border: 1px solid ${(p) => p.theme.panelBorder};
  backdrop-filter: blur(14px);
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 21px;
  letter-spacing: 1px;
`;

const BrandMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
`;

const Nav = styled.nav`
  display: flex;
  gap: 6px;
  margin-left: auto;
  flex-wrap: wrap;
`;

const StyledNavLink = styled(NavLink)`
  text-decoration: none;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: ${(p) => p.theme.textDim};
  transition: all 0.2s;

  &.active {
    color: ${(p) => p.theme.green};
    background: ${(p) => p.theme.panel};
    box-shadow: inset 0 0 0 1px ${(p) => p.theme.panelBorder};
  }

  &:hover {
    color: ${(p) => p.theme.text};
  }
`;

const Right = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const Status = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.textDim};
`;

const ThemeBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.panelBorder};
  background: ${(p) => p.theme.panel};
  color: ${(p) => p.theme.text};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.theme.green};
    color: ${(p) => p.theme.green};
  }
`;

const STATUS_LABEL = {
  connecting: 'Connexion',
  connected: 'En direct',
  reconnecting: 'Reconnexion',
  offline: 'Hors ligne',
};

export default function Header() {
  const { live, mqttStatus, theme, toggleTheme } = useApp();
  const online = live;

  return (
    <HeaderBar>
      <Brand>
        <BrandMark>
          <LogoIcon size={20} />
        </BrandMark>
        <span>INSTANT&nbsp;2</span>
      </Brand>

      <Nav>
        <StyledNavLink to="/">Tableau de bord</StyledNavLink>
        <StyledNavLink to="/history">Historique</StyledNavLink>
        <StyledNavLink to="/settings">Paramètres</StyledNavLink>
      </Nav>

      <Right>
        <Status title={`Statut MQTT : ${mqttStatus}`}>
          <StatusDot on={online} />
          <span>{STATUS_LABEL[mqttStatus] || mqttStatus}</span>
        </Status>
        <ThemeBtn onClick={toggleTheme} title="Changer de thème" aria-label="Changer de thème">
          {theme === 'dark' ? <SunIcon size={18} /> : <MoonIcon size={18} />}
        </ThemeBtn>
      </Right>
    </HeaderBar>
  );
}