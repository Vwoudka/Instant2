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
    { label: 'Puissance (W)', data: points.map((p) => p.power), color: '#3B82F6', fill: true, borderWidth: 2 },
    { label: 'Tension (V)', data: points.map((p) => p.voltage), color: '#60A5FA', fill: false, borderWidth: 1.5, yAxisID: 'y1' },
  ];

  const recent = [...points].slice(-12).reverse();
  const log = [...relayLog].slice(-10).reverse();

  return (
    <>
      <TopBar>
        <Title>Historique</Title>
      </TopBar>

      <Card>
        <CardTitle>Puissance &amp; tension &mdash; fenêtre en direct</CardTitle>
        {points.length > 1 ? (
          <AppLineChart labels={labels} series={series} height={340} />
        ) : (
          <Center>
            Aucune donnée capturée pour le moment. L'appareil diffuse sur <code>energy/#</code> et
            les relevés sont accumulés ici tant que la page est ouverte.
          </Center>
        )}
        <Note>
          MQTT publie un flux en direct sans historique intégré. Ce graphique montre la fenêtre
          glissante de 5&nbsp;minutes enregistrée depuis l'ouverture de cette page.
        </Note>
      </Card>

      <Two>
        <Card>
          <CardTitle>Derniers relevés</CardTitle>
          {recent.length === 0 ? (
            <Center>Aucun relevé enregistré pour le moment.</Center>
          ) : (
            <Table>
              <TableEl>
                <thead>
                  <tr>
                    <Th>Heure</Th>
                    <Th>Tension (V)</Th>
                    <Th>Courant (A)</Th>
                    <Th>Puissance (W)</Th>
                    <Th>FP</Th>
                    <Th>Énergie (kWh)</Th>
                    <Th>Fréq (Hz)</Th>
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
          <CardTitle>Activité du relais</CardTitle>
          {log.length === 0 ? (
            <Center>Aucun basculement de relais enregistré pour le moment.</Center>
          ) : (
            <Table>
              <TableEl>
                <thead>
                  <tr>
                    <Th>Heure</Th>
                    <Th>État</Th>
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