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
  color: #ffffff;
  background: linear-gradient(135deg, #3B82F6, #2563EB);
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
  box-shadow: 0 8px 22px rgba(59, 130, 246, 0.25);

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
      return 'La tension max doit être comprise entre 1 et 400 V';
    if (!Number.isFinite(n(imax)) || n(imax) <= 0 || n(imax) > 100)
      return 'Le courant max doit être compris entre 0,1 et 100 A';
    if (!Number.isFinite(n(pmax)) || n(pmax) <= 0 || n(pmax) > 100000)
      return 'La puissance max doit être comprise entre 1 et 100000 W';
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
      <Title>Paramètres</Title>

      <Grid>
        <Card>
          <CardTitle>
            Seuils de sécurité
            <Chip $ok>Depuis MQTT</Chip>
          </CardTitle>

          <ConnectBox>
            <Dot $status={mqttStatus} />
            <span>
              MQTT :{' '}
              {mqttStatus === 'connected'
                ? 'connecté au broker'
                : mqttStatus === 'connecting'
                ? 'connexion au broker\u2026'
                : mqttStatus}
            </span>
          </ConnectBox>

          <Field>
            <FieldLabel>Tension max (V)</FieldLabel>
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
            <FieldLabel>Courant max (A)</FieldLabel>
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
            <FieldLabel>Puissance max (W)</FieldLabel>
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
              {saving ? 'Publication\u2026' : 'Publier les seuils via MQTT'}
            </SaveBtn>
          </div>

          <Note>
            Les valeurs sont publiées en messages conservés (retained) pour que l'ESP32 les reçoive
            même s'il se reconnecte au broker plus tard. L'appareil applique les limites à sa
            prochaine synchronisation et signale un défaut si un relevé en direct les dépasse.
          </Note>
        </Card>

        <Card>
          <CardTitle>Configuration MQTT</CardTitle>

          <Note>
            <strong>Broker :</strong> broker public HiveMQ (WebSocket). Le firmware ESP32 utilise
            le même broker en TCP&nbsp;1883, de sorte que l'application et l'appareil partagent
            une même connexion.
          </Note>

          <TopicsTable>
            <thead>
              <tr>
                <Th>Usage</Th>
                <Th>Sujet (Topic)</Th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Lecture', topic: 'energy/voltage' },
                { label: 'Lecture', topic: 'energy/current' },
                { label: 'Lecture', topic: 'energy/power' },
                { label: 'Lecture', topic: 'energy/pf' },
                { label: 'Lecture', topic: 'energy/energy' },
                { label: 'Lecture', topic: 'energy/frequency' },
                { label: 'Lecture', topic: 'relay/state' },
                { label: 'Lecture', topic: 'fault/status' },
                { label: 'Lecture', topic: 'settings/vmax · settings/imax · settings/pmax' },
                { label: 'Envoi', topic: TOPICS.relayCmd },
              ].map((r) => (
                <tr key={r.topic}>
                  <Td>
                    <Badge $pub={r.label === 'Envoi'}>{r.label === 'Envoi' ? 'ENVOI' : 'LECTURE'}</Badge>
                  </Td>
                  <Td>
                    <code>{r.topic}</code>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TopicsTable>

          <Note>
            État relais en direct : <strong>{state.relay}</strong>. L'interrupteur du tableau de
            bord publie <code>ON</code>/<code>OFF</code> sur <code>{TOPICS.relayCmd}</code> ;
            l'appareil renvoie l'état appliqué sur <code>{'relay/state'}</code>.
          </Note>
        </Card>
      </Grid>
    </>
  );
}