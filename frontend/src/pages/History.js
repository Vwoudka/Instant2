import React from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import AppLineChart from '../components/AppLineChart';

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

const Card = styled.section`
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

const Center = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: ${(p) => p.theme.textDim};
  font-size: 14px;
  text-align: center;
  line-height: 1.7;
`;

const Two = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Table = styled.div`
  overflow-x: auto;
`;

const TableEl = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 10px;
  color: ${(p) => p.theme.textDim};
  font-weight: 600;
  border-bottom: 1px solid ${(p) => p.theme.panelBorder};
  text-transform: uppercase;
  font-size: 10.5px;
  letter-spacing: 0.6px;
  white-space: nowrap;
`;

const Td = styled.td`
  padding: 8px 10px;
  border-bottom: 1px solid ${(p) => p.theme.panelBorder};
  white-space: nowrap;
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 11px;
  color: ${(p) => (p.$on ? p.theme.green : p.theme.textDim)};
  background: ${(p) => (p.$on ? `${p.theme.green}22` : p.theme.panelBorder)};
`;

const Note = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.textDim};
  code {
    background: ${(p) => p.theme.panelBorder};
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 11px;
  }
`;

// MQTT is a live stream — the broker doesn't retain history. This page reports
// the rolling window captured since the page opened.
export default function History() {
  const { state } = useApp();
  const { history, relayLog } = state;

  const points = history;
  const labels = points.map((p) => new Date(p.t).toLocaleString([], { hour12: false }));
  const series = [
    { label: 'Power (W)', data: points.map((p) => p.power), color: '#34D399', fill: true, borderWidth: 2 },
    { label: 'Voltage (V)', data: points.map((p) => p.voltage), color: '#2DD4BF', fill: false, borderWidth: 1.5, yAxisID: 'y1' },
  ];

  const recent = [...points].slice(-12).reverse();
  const log = [...relayLog].slice(-10).reverse();

  return (
    <>
      <TopBar>
        <Title>History</Title>
      </TopBar>

      <Card>
        <CardTitle>Power &amp; voltage &mdash; live window</CardTitle>
        {points.length > 1 ? (
          <AppLineChart labels={labels} series={series} height={340} />
        ) : (
          <Center>
            No data captured yet. The device streams on <code>energy/#</code> and
            readings are accumulated here while the page is open.
          </Center>
        )}
        <Note>
          MQTT publishes a live stream without built-in history. This chart shows the rolling
          5-minute window recorded from the moment this page opened.
        </Note>
      </Card>

      <Two>
        <Card>
          <CardTitle>Recent readings</CardTitle>
          {recent.length === 0 ? (
            <Center>No readings recorded yet.</Center>
          ) : (
            <Table>
              <TableEl>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>Voltage (V)</Th>
                    <Th>Current (A)</Th>
                    <Th>Power (W)</Th>
                    <Th>PF</Th>
                    <Th>Energy (kWh)</Th>
                    <Th>Freq (Hz)</Th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p, i) => (
                    <tr key={`${p.t}-${i}`}>
                      <Td>{new Date(p.t).toLocaleTimeString([], { hour12: false })}</Td>
                      <Td>{p.voltage.toFixed(1)}</Td>
                      <Td>{p.current.toFixed(2)}</Td>
                      <Td>{p.power.toFixed(0)}</Td>
                      <Td>{p.pf.toFixed(2)}</Td>
                      <Td>{p.energy.toFixed(4)}</Td>
                      <Td>{p.frequency.toFixed(1)}</Td>
                    </tr>
                  ))}
                </tbody>
              </TableEl>
            </Table>
          )}
        </Card>

        <Card>
          <CardTitle>Relay activity</CardTitle>
          {log.length === 0 ? (
            <Center>No relay toggles logged yet.</Center>
          ) : (
            <Table>
              <TableEl>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>State</Th>
                  </tr>
                </thead>
                <tbody>
                  {log.map((r, i) => (
                    <tr key={`${r.t}-${i}`}>
                      <Td>{new Date(r.t).toLocaleString([], { hour12: false })}</Td>
                      <Td>
                        <Badge $on={r.state === 'ON'}>{r.state}</Badge>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableEl>
            </Table>
          )}
        </Card>
      </Two>
    </>
  );
}