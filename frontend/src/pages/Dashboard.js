import React from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import MetricCard from '../components/MetricCard';
import AppLineChart from '../components/AppLineChart';
import RelaySwitch from '../components/RelaySwitch';
import FaultBanner from '../components/FaultBanner';
import { BoltIcon, WaveIcon, ZapIcon, PulseIcon, EnergyIcon, FrequencyIcon } from '../components/Icons';

const ACCENTS = {
  voltage: '#2DD4BF',
  current: '#FACC15',
  power: '#34D399',
  pf: '#0EA5A0',
  energy: '#FDE047',
  frequency: '#F59E0B',
};

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 22px;
  letter-spacing: 0.5px;
`;

const LastUpdated = styled.span`
  font-size: 12px;
  color: ${(p) => p.theme.textDim};
  background: ${(p) => p.theme.panel};
  border: 1px solid ${(p) => p.theme.panelBorder};
  padding: 6px 12px;
  border-radius: 10px;
`;

const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(215px, 1fr));
  gap: 16px;
`;

const Lower = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  align-items: stretch;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.section`
  background: ${(p) => p.theme.panel};
  border: 1px solid ${(p) => p.theme.panelBorder};
  border-radius: 16px;
  padding: 18px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px ${(p) => p.theme.shadow};
`;

const CardTitle = styled.h3`
  font-size: 14px;
  letter-spacing: 1px;
  color: ${(p) => p.theme.textDim};
  text-transform: uppercase;
  margin-bottom: 12px;
`;

const Empty = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${(p) => p.theme.textDim};
  font-size: 14px;
  text-align: center;
  line-height: 1.7;
`;

export default function Dashboard() {
  const { state, live } = useApp();
  const { voltage, current, power, pf, energy, frequency, fault, lastUpdated, history, thresholds } = state;

  const labels = history.map((h) => new Date(h.t).toLocaleTimeString([], { hour12: false }));
  const series = [
    { label: 'Power (W)', data: history.map((h) => h.power), color: ACCENTS.power, fill: true, borderWidth: 2 },
    { label: 'Voltage (V)', data: history.map((h) => h.voltage), color: ACCENTS.voltage, fill: false, borderWidth: 1.5, yAxisID: 'y1' },
  ];

  return (
    <>
      <TopBar>
        <Title>Dashboard</Title>
        <LastUpdated>
          {live
            ? `Live · ${lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour12: false }) : 'streaming from MQTT'}`
            : lastUpdated
            ? `Last message ${new Date(lastUpdated).toLocaleTimeString([], { hour12: false })}`
            : 'Waiting for MQTT data\u2026'}
        </LastUpdated>
      </TopBar>

      {fault && <FaultBanner fault={fault} />}

      <Cards>
        <MetricCard
          label="Voltage"
          value={voltage}
          unit="V"
          color={ACCENTS.voltage}
          icon={<BoltIcon size={18} />}
          max={Math.max(260, thresholds.vmax * 1.1)}
          decimals={1}
        />
        <MetricCard
          label="Current"
          value={current}
          unit="A"
          color={ACCENTS.current}
          icon={<WaveIcon size={18} />}
          max={Math.max(15, thresholds.imax * 1.5)}
          decimals={2}
        />
        <MetricCard
          label="Power"
          value={power}
          unit="W"
          color={ACCENTS.power}
          icon={<ZapIcon size={18} />}
          max={Math.max(2500, thresholds.pmax)}
          decimals={0}
        />
        <MetricCard
          label="Power Factor"
          value={pf}
          unit=""
          color={ACCENTS.pf}
          icon={<PulseIcon size={18} />}
          max={1}
          decimals={2}
        />
        <MetricCard
          label="Energy"
          value={energy}
          unit="kWh"
          color={ACCENTS.energy}
          icon={<EnergyIcon size={18} />}
          max={Math.max(10, energy * 1.2 || 10)}
          decimals={4}
        />
        <MetricCard
          label="Frequency"
          value={frequency}
          unit="Hz"
          color={ACCENTS.frequency}
          icon={<FrequencyIcon size={18} />}
          max={70}
          decimals={1}
        />
      </Cards>

      <Lower>
        <ChartCard>
          <CardTitle>Power consumption &mdash; live stream</CardTitle>
          {history.length > 1 ? (
            <AppLineChart labels={labels} series={series} height={320} />
          ) : (
            <Empty>
              Waiting for readings on <code>energy/#</code>&hellip;
              <br />
              The device publishes every ~2 s; the chart fills in as data arrives.
            </Empty>
          )}
        </ChartCard>
        <RelaySwitch />
      </Lower>
    </>
  );
}