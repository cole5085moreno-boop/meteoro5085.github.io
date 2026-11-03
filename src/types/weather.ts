/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Tipos oficiales para el sistema meteorológico institucional
 */

export interface WeatherObservation {
  id: string;
  station_id: string;
  source: 'automatic_ecowitt' | 'manual_operator' | 'corrected';
  source_record_id?: string;
  observed_at: string; // ISO or YYYY-MM-DD HH:mm
  imported_at: string;
  created_at: string;
  updated_at?: string;

  // Variables meteorológicas
  temperature_c: number | null;
  feels_like_c: number | null;
  dew_point_c: number | null;
  relative_humidity_pct: number | null;
  vapor_pressure_deficit_kpa: number | null;
  solar_radiation_wm2: number | null;
  uv_index: number | null;
  precipitation_rate_mmh: number | null;
  precipitation_daily_mm: number | null;
  precipitation_event_mm: number | null;
  precipitation_hourly_mm: number | null;
  precipitation_24h_mm: number | null;
  precipitation_weekly_mm: number | null;
  precipitation_monthly_mm: number | null;
  precipitation_yearly_mm: number | null;
  wind_speed_kmh: number | null;
  wind_gust_kmh: number | null;
  wind_direction_deg: number | null;
  wind_direction_10min_deg: number | null;
  pressure_relative_hpa: number | null;
  pressure_absolute_hpa: number | null;

  // Estado del cielo
  sky_condition: 'Soleado' | 'Seminublado' | 'Nublado' | 'Sin datos';
  sky_condition_source: 'estimated_solar' | 'manual_observation' | 'unavailable';

  // Metadatos y control de calidad
  validation_status: 'valido' | 'sospechoso' | 'corregido' | 'pendiente';
  validation_notes?: string;
  notes?: string;
  deleted_at?: string | null;
}

export interface StationConfig {
  id: string;
  name: string;
  institution: string;
  location: string;
  address: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  ecowitt_station_id: string;
  timezone: string;
  primary_source_url: string;
  ecowitt_share_url?: string;
  github_repo_url: string;
  sync_interval_minutes: number;
  auto_sync_enabled: boolean;
  updated_at: string;
}

export interface SyncRun {
  id: string;
  started_at: string;
  completed_at: string;
  status: 'success' | 'failed' | 'partial';
  source_url: string;
  records_found: number;
  records_inserted: number;
  records_updated: number;
  records_skipped: number;
  records_rejected: number;
  error_message?: string | null;
  content_hash?: string;
}

export interface ManualObservation {
  id: string;
  station_id: string;
  observed_at: string;
  created_at: string;
  operator_user: string;
  temperature_c?: number | null;
  relative_humidity_pct?: number | null;
  pressure_hpa?: number | null;
  wind_speed_kmh?: number | null;
  wind_direction_deg?: number | null;
  sky_condition?: 'Soleado' | 'Seminublado' | 'Nublado';
  notes: string;
  validation_status: 'valido' | 'pendiente' | 'rechazado';
}

export interface DataCorrection {
  id: string;
  observation_id: string;
  field_name: string;
  original_value: string | number | null;
  corrected_value: string | number | null;
  reason: string;
  user_email: string;
  corrected_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  ip?: string;
}

export type UserRole = 'visitor' | 'operator' | 'admin';

export interface AuthSession {
  user: {
    username: string;
    role: UserRole;
    name: string;
    email: string;
  } | null;
  token?: string;
}

export interface VariableStats {
  count: number;
  missing: number;
  mean: number | null;
  median: number | null;
  min: { value: number; observed_at: string } | null;
  max: { value: number; observed_at: string } | null;
  range: number | null;
  std_dev: number | null;
  prev_period_variation?: number | null; // % or delta
}

export interface WindCircularStats {
  count: number;
  circular_mean_deg: number | null;
  cardinal_mean: string;
  max_gust_kmh: number | null;
  max_speed_kmh: number | null;
  calm_pct: number;
  direction_distribution: Record<string, number>; // N, NE, E, SE, S, SW, W, NW percentages
}

export interface PeriodStatsBundle {
  period_label: string;
  total_observations: number;
  first_observation: string;
  last_observation: string;
  temperature: VariableStats;
  feels_like: VariableStats;
  dew_point: VariableStats;
  humidity: VariableStats;
  vpd: VariableStats;
  solar_radiation: VariableStats;
  uv_index: VariableStats;
  pressure_relative: VariableStats;
  pressure_absolute: VariableStats;
  wind_speed: VariableStats;
  wind: WindCircularStats;
  precipitation: {
    total_event_rain_mm: number;
    max_rate_mmh: number;
    daily_accumulation_mm: number;
    rain_intervals_count: number;
  };
  sky_distribution: {
    soleado: number;
    seminublado: number;
    nublado: number;
    sin_datos: number;
  };
}
