/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Cliente API para comunicación con el servidor
 */

import type {
  StationConfig,
  WeatherObservation,
  SyncRun,
  PeriodStatsBundle,
  ManualObservation,
  DataCorrection,
  AuditLog,
} from '../types/weather.ts';

const TOKEN_KEY = 'ema5085_auth_token';
const USER_KEY = 'ema5085_user';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuthSession(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchStationStatus(): Promise<{
  station: StationConfig;
  latest_observation: WeatherObservation | null;
  last_sync: SyncRun | null;
  connection_status: 'Actualizado' | 'Actualización pendiente' | 'Datos desactualizados' | 'Fuente no disponible';
  data_age_minutes: number;
  total_records: number;
  first_record_date: string | null;
  last_record_date: string | null;
}> {
  const res = await fetch('/api/station');
  if (!res.ok) throw new Error('Error al consultar el estado de la estación');
  return res.json();
}

export async function updateStationConfig(updates: Partial<StationConfig>): Promise<StationConfig> {
  const res = await fetch('/api/station', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al actualizar configuración');
  }
  const data = await res.json();
  return data.station;
}

export async function fetchObservations(params?: {
  range?: string;
  start?: string;
  end?: string;
  limit?: number;
}): Promise<WeatherObservation[]> {
  const q = new URLSearchParams();
  if (params?.range) q.set('range', params.range);
  if (params?.start) q.set('start', params.start);
  if (params?.end) q.set('end', params.end);
  if (params?.limit) q.set('limit', String(params.limit));

  const res = await fetch(`/api/observations?${q.toString()}`);
  if (!res.ok) throw new Error('Error al obtener observaciones');
  const data = await res.json();
  return data.observations;
}

export async function fetchStats(params?: {
  range?: string;
  start?: string;
  end?: string;
}): Promise<{
  stats: PeriodStatsBundle;
  correlations: {
    temp_humidity: { r: number | null; n: number; interpretation: string };
    temp_vpd: { r: number | null; n: number; interpretation: string };
    solar_temp: { r: number | null; n: number; interpretation: string };
  };
}> {
  const q = new URLSearchParams();
  if (params?.range) q.set('range', params.range);
  if (params?.start) q.set('start', params.start);
  if (params?.end) q.set('end', params.end);

  const res = await fetch(`/api/stats?${q.toString()}`);
  if (!res.ok) throw new Error('Error al calcular estadísticas');
  return res.json();
}

export async function triggerManualSync(): Promise<{
  success: boolean;
  run: SyncRun;
  total_records: number;
}> {
  const res = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error en la sincronización manual');
  }
  return res.json();
}

export async function triggerHistoricalSync(): Promise<{
  success: boolean;
  found: number;
  inserted: number;
  skipped: number;
  total_now: number;
}> {
  const res = await fetch('/api/sync/historical', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al importar historial de commits');
  }
  return res.json();
}

export async function fetchSyncHistory(): Promise<SyncRun[]> {
  const res = await fetch('/api/sync/history');
  if (!res.ok) throw new Error('Error al obtener historial de sincronizaciones');
  const data = await res.json();
  return data.runs;
}

export async function loginUser(password: string): Promise<{
  user: { username: string; name: string; role: 'admin' | 'operator'; email: string };
  token: string;
}> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Contraseña incorrecta');
  }
  const data = await res.json();
  saveAuthSession(data.token, data.user);
  return data;
}

export async function submitManualObservation(obs: {
  observed_at: string;
  temperature_c?: number | null;
  relative_humidity_pct?: number | null;
  pressure_hpa?: number | null;
  wind_speed_kmh?: number | null;
  wind_direction_deg?: number | null;
  sky_condition?: 'Soleado' | 'Seminublado' | 'Nublado';
  notes: string;
}): Promise<ManualObservation> {
  const res = await fetch('/api/manual-observations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(obs),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al registrar observación manual');
  }
  const data = await res.json();
  return data.observation;
}

export async function submitDataCorrection(correction: {
  observation_id: string;
  field_name: string;
  corrected_value: any;
  reason: string;
}): Promise<DataCorrection> {
  const res = await fetch('/api/corrections', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(correction),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Error al registrar corrección');
  }
  const data = await res.json();
  return data.correction;
}

export async function fetchCorrections(): Promise<DataCorrection[]> {
  const res = await fetch('/api/corrections');
  if (!res.ok) throw new Error('Error al obtener correcciones');
  const data = await res.json();
  return data.corrections;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const res = await fetch('/api/audit-logs', {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error('Error al obtener auditoría');
  const data = await res.json();
  return data.logs;
}

export async function runServerTests(): Promise<any> {
  const res = await fetch('/api/tests/run');
  if (!res.ok) throw new Error('Error al ejecutar pruebas');
  return res.json();
}
