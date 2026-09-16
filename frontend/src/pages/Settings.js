import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useApp } from '../context/AppContext';
import { TOPICS } from '../api/mqtt';

const Title = styled.h1`
  font-size: 22px;
  letter-spacing: 0.5px;
  margin-bottom: 18px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.section`
  background: ${(p) => p.theme.panel};
  border: 1px solid ${(p) => p.theme.panelBorder};
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 24px ${(p) => p.theme.shadow};
`;

const CardTitle = styled.h3`
  font-size: 14px;
  letter-spacing: 1px;
  color: ${(p) => p.theme.textDim};
  text-transform: uppercase;
  margin-bottom: 16px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-bottom: 16px;
`;

const FieldLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.8px;
  text-transform: uppercase;
  color: ${(p) => p.theme.textDim};
`;

const Input = styled.input`
  padding: 11px 13px;
  border-radius: 11px;
  border: 1px solid ${(p) => p.theme.panelBorder};
  background: ${(p) => p.theme.bg2};
  color: ${(p) => p.theme.text};
  font-size: 15px;
  font-weight: 600;
  outline: none;
  transition: border-color 0.2s;

  &:focus {
    border-color: ${(p) => p.theme.green};
  }
`;

const SaveBtn = styled.button`
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #0E1512;
  background: linear-gradient(135deg, #34D399, #0EA5A0);
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 8px 22px rgba(52, 211, 153, 0.25);

  &:hover {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: wait;
  }
`;

const Note = styled.p`
  margin: 14px 0 0;
  font-size: 12px;
  color: ${(p) => p.theme.textDim};
  line-height: 1.6;

  code {
    background: ${(p) => p.theme.panelBorder};
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 11px;
  }
`;

const Chip = styled.span`
  display: inline-block;
  padding: 4px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  margin-left: 8px;
  color: ${(p) => (p.$ok ? p.theme.green : p.theme.orange)};
  background: ${(p) => (p.$ok ? `${p.theme.green}1f` : `${p.theme.orange}1f`)};
`;

const ConnectBox = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid ${(p) => p.theme.panelBorder};
  background: ${(p) => p.theme.bg2};
  font-size: 12.5px;
  color: ${(p) => p.theme.textDim};
  margin-bottom: 16px;
`;

const Dot = styled.span`
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: ${(p) =>
    p.$status === 'connected'
      ? p.theme.green
      : p.$status === 'connecting'
      ? p.theme.orange
      : p.theme.red};
  box-shadow: ${(p) => (p.$status === 'connected' ? `0 0 8px ${p.theme.green}` : 'none')};
`;

const Th = styled.th`
  text-align: left;
  padding: 8px 6px;
  color: ${(p) => p.theme.textDim};
  font-weight: 600;
  border-bottom: 1px solid ${(p) => p.theme.panelBorder};
  text-transform: uppercase;
  font-size: 10.5px;
  letter-spacing: 0.6px;
`;

const Td = styled.td`
  padding: 8px 6px;
  border-bottom: 1px solid ${(p) => p.theme.panelBorder};
  color: ${(p) => p.theme.textDim};
  font-size: 12px;

  code {
    background: ${(p) => p.theme.panelBorder};
    padding: 1px 6px;
    border-radius: 5px;
    font-size: 11px;
    color: ${(p) => p.theme.text};
  }
`;

const Badge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 7px;
  font-weight: 700;
  font-size: 10px;
  letter-spacing: 0.5px;
  color: ${(p) => (p.$pub ? p.theme.yellow : p.theme.turquoise)};
  background: ${(p) => (p.$pub ? `${p.theme.yellow}1f` : `${p.theme.turquoise}1f`)};
`;

const TopicsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 8px;
`;

export default function Settings() {
  const { state, saveThresholds, notify, mqttStatus, connected } = useApp();
  const [vmax, setVmax] = useState('');
  const [imax, setImax] = useState('');
  const [pmax, setPmax] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const th = state.thresholds;
    setVmax(String(th.vmax));
    setImax(String(th.imax));
    setPmax(String(th.pmax));
  }, [state.thresholds]);

  const validate = () => {
    const n = (x) => Number(x);
    if (!Number.isFinite(n(vmax)) || n(vmax) <= 0 || n(vmax) > 400)
      return 'Voltage max must be between 1 and 400 V';
    if (!Number.isFinite(n(imax)) || n(imax) <= 0 || n(imax) > 100)
      return 'Current max must be between 0.1 and 100 A';
    if (!Number.isFinite(n(pmax)) || n(pmax) <= 0 || n(pmax) > 100000)
      return 'Power max must be between 1 and 100000 W';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      notify('error', err);
      return;
    }
    setSaving(true);
    await saveThresholds({
      vmax: Number(vmax),
      imax: Number(imax),
      pmax: Number(pmax),
    });
    setSaving(false);
  };

  return (
    <>
      <Title>Settings</Title>

      <Grid>
        <Card>
          <CardTitle>
            Safety thresholds
            <Chip $ok>From MQTT</Chip>
          </CardTitle>

          <ConnectBox>
            <Dot $status={mqttStatus} />
            <span>
              MQTT:{' '}
              {mqttStatus === 'connected'
                ? 'connected to broker'
                : mqttStatus === 'connecting'
                ? 'connecting to broker\u2026'
                : mqttStatus}
            </span>
          </ConnectBox>

          <Field>
            <FieldLabel>Voltage max (V)</FieldLabel>
            <Input
              type="number"
              min="1"
              max="400"
              step="0.1"
              value={vmax}
              onChange={(e) => setVmax(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Current max (A)</FieldLabel>
            <Input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={imax}
              onChange={(e) => setImax(e.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Power max (W)</FieldLabel>
            <Input
              type="number"
              min="1"
              max="100000"
              step="10"
              value={pmax}
              onChange={(e) => setPmax(e.target.value)}
            />
          </Field>

          <div>
            <SaveBtn onClick={handleSave} disabled={saving || !connected}>
              {saving ? 'Publishing\u2026' : 'Publish thresholds over MQTT'}
            </SaveBtn>
          </div>

          <Note>
            Values are published as retained messages so the ESP32 receives them even if it
            reconnects to the broker later. The device applies the limits on its next config
            sync and flags a fault when a live reading exceeds them.
          </Note>
        </Card>

        <Card>
          <CardTitle>MQTT configuration</CardTitle>

          <Note>
            <strong>Broker:</strong> HiveMQ public broker (WebSocket). The ESP32 firmware uses
            the same broker over TCP&nbsp;1883, so the app and device share a connection.
          </Note>

          <TopicsTable>
            <thead>
              <tr>
                <Th>Uses</Th>
                <Th>Topic</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Reads', topic: 'energy/voltage' },
                { label: 'Reads', topic: 'energy/current' },
                { label: 'Reads', topic: 'energy/power' },
                { label: 'Reads', topic: 'energy/pf' },
                { label: 'Reads', topic: 'energy/energy' },
                { label: 'Reads', topic: 'energy/frequency' },
                { label: 'Reads', topic: 'relay/state' },
                { label: 'Reads', topic: 'fault/status' },
                { label: 'Reads', topic: 'settings/vmax · settings/imax · settings/pmax' },
                { label: 'Sends', topic: TOPICS.relayCmd },
              ].map((r) => (
                <tr key={r.topic}>
                  <Td>
                    <Badge $pub={r.label === 'Sends'}>{r.label.toUpperCase()}</Badge>
                  </Td>
                  <Td>
                    <code>{r.topic}</code>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TopicsTable>

          <Note>
            Live relay state: <strong>{state.relay}</strong>. The dashboard switch publishes{' '}
            <code>ON</code>/<code>OFF</code> on <code>{TOPICS.relayCmd}</code>; the device echoes
            the applied state back on <code>{'relay/state'}</code>.
          </Note>
        </Card>
      </Grid>
    </>
  );
}