/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Capa de persistencia local y soporte Supabase
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  StationConfig,
  WeatherObservation,
  SyncRun,
  ManualObservation,
  DataCorrection,
  AuditLog,
  UserRole,
} from '../src/types/weather.ts';

const DB_PATH = path.resolve(process.cwd(), 'data', 'station_db.json');

export interface UserAccount {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password_hash: string;
  salt: string;
  created_at: string;
}

export interface AppDatabase {
  station: StationConfig;
  observations: WeatherObservation[];
  sync_runs: SyncRun[];
  manual_observations: ManualObservation[];
  data_corrections: DataCorrection[];
  audit_logs: AuditLog[];
  users: UserAccount[];
  version: number;
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

function createDefaultUsers(): UserAccount[] {
  const adminSalt = crypto.randomBytes(16).toString('hex');
  const operatorSalt = crypto.randomBytes(16).toString('hex');

  return [
    {
      id: 'usr_admin',
      username: 'admin',
      name: 'Administrador Estación 5085',
      email: 'admin@colegio5085.edu.ar',
      role: 'admin',
      salt: adminSalt,
      password_hash: hashPassword('administrador5085', adminSalt),
      created_at: new Date().toISOString(),
    },
    {
      id: 'usr_operator',
      username: 'alumno',
      name: 'Operador Estudiantil / Docente',
      email: 'alumno@colegio5085.edu.ar',
      role: 'operator',
      salt: operatorSalt,
      password_hash: hashPassword('alumno5085', operatorSalt),
      created_at: new Date().toISOString(),
    },
  ];
}

const DEFAULT_STATION_CONFIG: StationConfig = {
  id: 'ema_5085',
  name: 'Proyecto Estación Meteorológica Colegio 5085',
  institution: 'Colegio Secundario N.º 5085 «Dr. Mariano Moreno»',
  location: 'General Güemes, provincia de Salta, Argentina',
  address: 'Sarmiento 351, General Güemes, Salta',
  latitude: -24.670773,
  longitude: -65.04979,
  altitude_m: 695,
  ecowitt_station_id: '364053',
  timezone: 'America/Argentina/Salta',
  primary_source_url:
    'https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv',
  github_repo_url: 'https://github.com/intasalta/daza',
  sync_interval_minutes: 15,
  auto_sync_enabled: true,
  updated_at: new Date().toISOString(),
};

class DatabaseManager {
  private data: AppDatabase;

  constructor() {
    this.data = this.loadDatabase();
  }

  private loadDatabase(): AppDatabase {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.station && parsed.observations) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Advertencia al leer base de datos, creando inicial:', e);
    }

    const initialDb: AppDatabase = {
      station: DEFAULT_STATION_CONFIG,
      observations: [],
      sync_runs: [],
      manual_observations: [],
      data_corrections: [],
      audit_logs: [
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'INITIALIZE_SYSTEM',
          user: 'system',
          details: 'Inicialización de la base de datos de la estación Colegio 5085',
        },
      ],
      users: createDefaultUsers(),
      version: 1,
    };
    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(db: AppDatabase = this.data) {
    try {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const tmpPath = `${DB_PATH}.tmp`;
      fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
      fs.renameSync(tmpPath, DB_PATH);
    } catch (err) {
      console.error('Error al guardar base de datos:', err);
    }
  }

  public getStation(): StationConfig {
    return this.data.station;
  }

  public updateStation(updates: Partial<StationConfig>, user: string): StationConfig {
    this.data.station = {
      ...this.data.station,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.addAuditLog('UPDATE_STATION_CONFIG', user, `Actualización de parámetros de estación`);
    this.saveDatabase();
    return this.data.station;
  }

  public getObservations(options?: {
    limit?: number;
    startDate?: string;
    endDate?: string;
    range?: string;
  }): WeatherObservation[] {
    let obs = [...this.data.observations];

    // Ordenar de más antiguo a más reciente para gráficos, o de más reciente a más antiguo si se prefiere
    obs.sort(
      (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
    );

    if (options?.startDate) {
      const startTime = new Date(options.startDate).getTime();
      obs = obs.filter((o) => new Date(o.observed_at).getTime() >= startTime);
    }

    if (options?.endDate) {
      const endTime = new Date(options.endDate).getTime();
      obs = obs.filter((o) => new Date(o.observed_at).getTime() <= endTime);
    }

    if (options?.limit && options.limit > 0 && obs.length > options.limit) {
      obs = obs.slice(-options.limit);
    }

    return obs;
  }

  public getObservationById(id: string): WeatherObservation | undefined {
    return this.data.observations.find((o) => o.id === id);
  }

  public getLatestObservation(): WeatherObservation | null {
    if (this.data.observations.length === 0) return null;
    const sorted = [...this.data.observations].sort(
      (a, b) => new Date(b.observed_at).getTime() - new Date(a.observed_at).getTime()
    );
    return sorted[0];
  }

  /**
   * Inserta o actualiza observaciones de manera idempotente.
   * La clave primaria es `observed_at`.
   */
  public upsertObservations(newObs: WeatherObservation[]): {
    inserted: number;
    updated: number;
    skipped: number;
  } {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    const obsMap = new Map<string, WeatherObservation>();
    for (const o of this.data.observations) {
      obsMap.set(o.observed_at, o);
    }

    for (const incoming of newObs) {
      const existing = obsMap.get(incoming.observed_at);
      if (!existing) {
        obsMap.set(incoming.observed_at, incoming);
        inserted++;
      } else {
        // Si no ha cambiado, skip
        if (
          existing.temperature_c === incoming.temperature_c &&
          existing.relative_humidity_pct === incoming.relative_humidity_pct &&
          existing.pressure_relative_hpa === incoming.pressure_relative_hpa
        ) {
          skipped++;
        } else {
          // Si el registro existente fue corregido manualmente, no lo sobreescribimos
          if (existing.validation_status === 'corregido') {
            skipped++;
          } else {
            obsMap.set(incoming.observed_at, {
              ...incoming,
              id: existing.id,
              created_at: existing.created_at,
              updated_at: new Date().toISOString(),
            });
            updated++;
          }
        }
      }
    }

    this.data.observations = Array.from(obsMap.values());
    this.saveDatabase();

    return { inserted, updated, skipped };
  }

  public addSyncRun(run: SyncRun) {
    this.data.sync_runs.unshift(run);
    if (this.data.sync_runs.length > 50) {
      this.data.sync_runs = this.data.sync_runs.slice(0, 50);
    }
    this.saveDatabase();
  }

  public getSyncRuns(limit: number = 20): SyncRun[] {
    return this.data.sync_runs.slice(0, limit);
  }

  public getLastSuccessfulSync(): SyncRun | null {
    return this.data.sync_runs.find((r) => r.status === 'success') || null;
  }

  public addManualObservation(
    obs: Omit<ManualObservation, 'id' | 'created_at' | 'validation_status'>,
    user: string
  ): ManualObservation {
    const newManual: ManualObservation = {
      ...obs,
      id: `manual_${Date.now()}`,
      created_at: new Date().toISOString(),
      validation_status: 'valido',
    };
    this.data.manual_observations.unshift(newManual);

    // También agregar como observación al registro principal identificada como manual
    const stationObs: WeatherObservation = {
      id: newManual.id,
      station_id: this.data.station.ecowitt_station_id,
      source: 'manual_operator',
      source_record_id: newManual.id,
      observed_at: newManual.observed_at,
      imported_at: newManual.created_at,
      created_at: newManual.created_at,
      temperature_c: newManual.temperature_c ?? null,
      feels_like_c: newManual.temperature_c ?? null,
      dew_point_c: null,
      relative_humidity_pct: newManual.relative_humidity_pct ?? null,
      vapor_pressure_deficit_kpa: null,
      solar_radiation_wm2: null,
      uv_index: null,
      precipitation_rate_mmh: null,
      precipitation_daily_mm: null,
      precipitation_event_mm: null,
      precipitation_hourly_mm: null,
      precipitation_24h_mm: null,
      precipitation_weekly_mm: null,
      precipitation_monthly_mm: null,
      precipitation_yearly_mm: null,
      wind_speed_kmh: newManual.wind_speed_kmh ?? null,
      wind_gust_kmh: newManual.wind_speed_kmh ?? null,
      wind_direction_deg: newManual.wind_direction_deg ?? null,
      wind_direction_10min_deg: null,
      pressure_relative_hpa: newManual.pressure_hpa ?? null,
      pressure_absolute_hpa: null,
      sky_condition: newManual.sky_condition || 'Sin datos',
      sky_condition_source: 'manual_observation',
      validation_status: 'valido',
      notes: newManual.notes,
    };

    this.upsertObservations([stationObs]);
    this.addAuditLog('ADD_MANUAL_OBSERVATION', user, `Observación manual registrada para ${newManual.observed_at}`);
    this.saveDatabase();
    return newManual;
  }

  public getManualObservations(): ManualObservation[] {
    return this.data.manual_observations;
  }

  /**
   * Corrección de datos con auditoría estricta.
   * El valor original nunca se destruye silenciosamente.
   */
  public addDataCorrection(
    observationId: string,
    fieldName: string,
    correctedValue: number | string | null,
    reason: string,
    userEmail: string
  ): DataCorrection | null {
    const obsIndex = this.data.observations.findIndex((o) => o.id === observationId);
    if (obsIndex === -1) return null;

    const obs = this.data.observations[obsIndex];
    const originalValue = (obs as any)[fieldName];

    const correction: DataCorrection = {
      id: `corr_${Date.now()}`,
      observation_id: observationId,
      field_name: fieldName,
      original_value: originalValue,
      corrected_value: correctedValue,
      reason,
      user_email: userEmail,
      corrected_at: new Date().toISOString(),
    };

    // Aplicar corrección y marcar observación
    (obs as any)[fieldName] = correctedValue;
    obs.validation_status = 'corregido';
    obs.validation_notes = `Corregido por ${userEmail}: ${reason}`;
    obs.updated_at = correction.corrected_at;

    this.data.data_corrections.unshift(correction);
    this.addAuditLog(
      'CORRECT_DATA',
      userEmail,
      `Corrección en registro ${obs.observed_at}, campo ${fieldName}: ${originalValue} -> ${correctedValue} (${reason})`
    );
    this.saveDatabase();

    return correction;
  }

  public getDataCorrections(): DataCorrection[] {
    return this.data.data_corrections;
  }

  public addAuditLog(action: string, user: string, details: string, ip?: string) {
    const log: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      action,
      user,
      details,
      ip,
    };
    this.data.audit_logs.unshift(log);
    if (this.data.audit_logs.length > 200) {
      this.data.audit_logs = this.data.audit_logs.slice(0, 200);
    }
    this.saveDatabase();
  }

  public getAuditLogs(limit: number = 50): AuditLog[] {
    return this.data.audit_logs.slice(0, limit);
  }

  public authenticate(password: string): {
    success: boolean;
    user?: { username: string; name: string; role: UserRole; email: string };
  } {
    for (const u of this.data.users) {
      const hashed = hashPassword(password, u.salt);
      if (hashed === u.password_hash) {
        return {
          success: true,
          user: {
            username: u.username,
            name: u.name,
            role: u.role,
            email: u.email,
          },
        };
      }
    }
    return { success: false };
  }

  public getUsers(): Omit<UserAccount, 'password_hash' | 'salt'>[] {
    return this.data.users.map(({ password_hash, salt, ...rest }) => rest);
  }
}

export const db = new DatabaseManager();
