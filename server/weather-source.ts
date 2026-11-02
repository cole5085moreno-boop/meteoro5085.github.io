/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Módulo de integración: weather-source
 */

import crypto from 'crypto';
import type { WeatherObservation, SyncRun } from '../src/types/weather.ts';

export const PRIMARY_CSV_URL =
  'https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv';

export const GITHUB_COMMITS_API =
  'https://api.github.com/repos/intasalta/daza/commits?path=364053_daily_station_data.csv&per_page=100';

/**
 * Normaliza un valor numérico desde el CSV.
 * Devuelve null si es "-", "", o no numérico.
 * NO convierte valores nulos en 0.
 */
function parseNumeric(val: string | undefined): number | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'null') {
    return null;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

/**
 * Convierte grados a dirección cardinal (16 rumbos).
 */
export function degreesToCardinal(deg: number | null): string {
  if (deg === null || deg < 0) return 'Calma / Variable';
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}

/**
 * Estima el estado del cielo según radiación solar y hora del día.
 * Se identifica claramente como estimación ('estimated_solar').
 */
function estimateSkyCondition(solarWm2: number | null, timeStr: string): {
  condition: 'Soleado' | 'Seminublado' | 'Nublado' | 'Sin datos';
  source: 'estimated_solar' | 'manual_observation' | 'unavailable';
} {
  if (solarWm2 === null) {
    return { condition: 'Sin datos', source: 'unavailable' };
  }

  // Extraer hora para comprobar si es diurno
  const timePart = timeStr.split(' ')[1] || '';
  const hour = parseInt(timePart.split(':')[0], 10);
  const isNight = isNaN(hour) ? false : hour < 6 || hour >= 20;

  if (isNight) {
    return { condition: 'Seminublado', source: 'estimated_solar' };
  }

  // Umbrales de radiación solar para General Güemes (lat -24.67)
  if (solarWm2 > 500) {
    return { condition: 'Soleado', source: 'estimated_solar' };
  } else if (solarWm2 > 180) {
    return { condition: 'Seminublado', source: 'estimated_solar' };
  } else {
    return { condition: 'Nublado', source: 'estimated_solar' };
  }
}

/**
 * Valida la coherencia física de los registros.
 */
function validateObservation(obs: Partial<WeatherObservation>): {
  status: 'valido' | 'sospechoso';
  note?: string;
} {
  // Verificaciones de límites físicos razonables en Salta
  if (obs.temperature_c !== null && obs.temperature_c !== undefined) {
    if (obs.temperature_c < -15 || obs.temperature_c > 52) {
      return { status: 'sospechoso', note: 'Temperatura fuera de rango esperado (-15 a 52 °C)' };
    }
  }
  if (obs.relative_humidity_pct !== null && obs.relative_humidity_pct !== undefined) {
    if (obs.relative_humidity_pct < 0 || obs.relative_humidity_pct > 100) {
      return { status: 'sospechoso', note: 'Humedad relativa fuera del intervalo 0-100%' };
    }
  }
  if (obs.pressure_relative_hpa !== null && obs.pressure_relative_hpa !== undefined) {
    if (obs.pressure_relative_hpa < 850 || obs.pressure_relative_hpa > 1080) {
      return { status: 'sospechoso', note: 'Presión barométrica fuera de rango físico normal' };
    }
  }
  return { status: 'valido' };
}

/**
 * Parsea el contenido CSV con los encabezados dobles de la estación Ecowitt del Colegio 5085.
 */
export function parseWeatherCsv(
  csvText: string,
  stationId: string = '364053'
): { observations: WeatherObservation[]; rejectedCount: number; hash: string } {
  const hash = crypto.createHash('sha256').update(csvText).digest('hex');
  const lines = csvText.trim().split(/\r?\n/);

  if (lines.length < 3) {
    return { observations: [], rejectedCount: 0, hash };
  }

  // Las dos primeras líneas corresponden a los encabezados agrupados y nombres de columnas:
  // Línea 0: Time,Outdoor,,,,,Solar and UVI,,Rainfall,,,,,,,,Wind,,,,Pressure,
  // Línea 1: ,Temperature(℃),Feels Like(℃),Dew Point(℃),Humidity(%),VPD(kPa),...
  const observations: WeatherObservation[] = [];
  let rejectedCount = 0;
  const nowIso = new Date().toISOString();

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const timeStr = cols[0]?.trim();
    if (!timeStr || timeStr === '-' || timeStr.length < 10) {
      rejectedCount++;
      continue;
    }

    const temp = parseNumeric(cols[1]);
    const feelsLike = parseNumeric(cols[2]);
    const dewPoint = parseNumeric(cols[3]);
    const humidity = parseNumeric(cols[4]);
    const vpd = parseNumeric(cols[5]);
    const solar = parseNumeric(cols[6]);
    const uvi = parseNumeric(cols[7]);
    const rainRate = parseNumeric(cols[8]);
    const dailyRain = parseNumeric(cols[9]);
    const eventRain = parseNumeric(cols[10]);
    const hourlyRain = parseNumeric(cols[11]);
    const rain24h = parseNumeric(cols[12]);
    const weeklyRain = parseNumeric(cols[13]);
    const monthlyRain = parseNumeric(cols[14]);
    const yearlyRain = parseNumeric(cols[15]);
    const windSpeed = parseNumeric(cols[16]);
    const windGust = parseNumeric(cols[17]);
    const windDir = parseNumeric(cols[18]);
    const windDir10m = parseNumeric(cols[19]);
    const relPressure = parseNumeric(cols[20]);
    const absPressure = parseNumeric(cols[21]);

    const sky = estimateSkyCondition(solar, timeStr);

    const baseObs: Partial<WeatherObservation> = {
      temperature_c: temp,
      relative_humidity_pct: humidity,
      pressure_relative_hpa: relPressure,
    };
    const validation = validateObservation(baseObs);

    const id = `obs_${stationId}_${timeStr.replace(/[^0-9]/g, '_')}`;

    observations.push({
      id,
      station_id: stationId,
      source: 'automatic_ecowitt',
      source_record_id: timeStr,
      observed_at: timeStr,
      imported_at: nowIso,
      created_at: nowIso,
      temperature_c: temp,
      feels_like_c: feelsLike,
      dew_point_c: dewPoint,
      relative_humidity_pct: humidity,
      vapor_pressure_deficit_kpa: vpd,
      solar_radiation_wm2: solar,
      uv_index: uvi,
      precipitation_rate_mmh: rainRate,
      precipitation_daily_mm: dailyRain,
      precipitation_event_mm: eventRain,
      precipitation_hourly_mm: hourlyRain,
      precipitation_24h_mm: rain24h,
      precipitation_weekly_mm: weeklyRain,
      precipitation_monthly_mm: monthlyRain,
      precipitation_yearly_mm: yearlyRain,
      wind_speed_kmh: windSpeed,
      wind_gust_kmh: windGust,
      wind_direction_deg: windDir,
      wind_direction_10min_deg: windDir10m,
      pressure_relative_hpa: relPressure,
      pressure_absolute_hpa: absPressure,
      sky_condition: sky.condition,
      sky_condition_source: sky.source,
      validation_status: validation.status,
      validation_notes: validation.note,
    });
  }

  return { observations, rejectedCount, hash };
}

/**
 * Consulta la fuente original (con soporte para ETag/Last-Modified/Hash)
 */
export async function fetchLiveStationData(
  stationId: string = '364053',
  sourceUrl: string = PRIMARY_CSV_URL,
  lastHash?: string
): Promise<{
  run: SyncRun;
  observations: WeatherObservation[];
  hasChanged: boolean;
}> {
  const startedAt = new Date().toISOString();
  try {
    const res = await fetch(sourceUrl, {
      headers: {
        'User-Agent': 'Proyecto-Estacion-Colegio5085/1.0',
        'Cache-Control': 'no-cache',
      },
    });

    if (!res.ok) {
      throw new Error(`Error HTTP al consultar la estación: ${res.status} ${res.statusText}`);
    }

    const csvText = await res.text();
    const { observations, rejectedCount, hash } = parseWeatherCsv(csvText, stationId);

    const hasChanged = hash !== lastHash;

    const completedAt = new Date().toISOString();
    const run: SyncRun = {
      id: `sync_${Date.now()}`,
      started_at: startedAt,
      completed_at: completedAt,
      status: 'success',
      source_url: sourceUrl,
      records_found: observations.length + rejectedCount,
      records_inserted: hasChanged ? observations.length : 0,
      records_updated: 0,
      records_skipped: hasChanged ? 0 : observations.length,
      records_rejected: rejectedCount,
      content_hash: hash,
    };

    return { run, observations, hasChanged };
  } catch (err: any) {
    const completedAt = new Date().toISOString();
    const run: SyncRun = {
      id: `sync_${Date.now()}`,
      started_at: startedAt,
      completed_at: completedAt,
      status: 'failed',
      source_url: sourceUrl,
      records_found: 0,
      records_inserted: 0,
      records_updated: 0,
      records_skipped: 0,
      records_rejected: 0,
      error_message: err.message || 'Error de conexión con la fuente de datos',
    };
    return { run, observations: [], hasChanged: false };
  }
}

/**
 * Obtiene el historial real desde los commits previos de GitHub en el repositorio intasalta/daza.
 * Esto permite recuperar días anteriores reales de mediciones de la estación 364053.
 */
export async function fetchHistoricalCommitsData(
  maxCommits: number = 30,
  stationId: string = '364053'
): Promise<WeatherObservation[]> {
  try {
    const res = await fetch(GITHUB_COMMITS_API, {
      headers: { 'User-Agent': 'Proyecto-Estacion-Colegio5085/1.0' },
    });

    if (!res.ok) {
      console.warn('No se pudo acceder a la API de commits de GitHub:', res.status);
      return [];
    }

    const commits = await res.json();
    if (!Array.isArray(commits)) return [];

    // Agrupar por fecha para no descargar commits redundantes del mismo día
    const dateMap = new Map<string, string>();
    for (const c of commits) {
      const dateKey = c.commit?.author?.date?.slice(0, 10);
      if (dateKey && !dateMap.has(dateKey)) {
        dateMap.set(dateKey, c.sha);
      }
      if (dateMap.size >= maxCommits) break;
    }

    const allHistoricalObs: WeatherObservation[] = [];

    for (const [date, sha] of dateMap.entries()) {
      const rawUrl = `https://raw.githubusercontent.com/intasalta/daza/${sha}/364053_daily_station_data.csv`;
      try {
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          const csvText = await rawRes.text();
          const { observations } = parseWeatherCsv(csvText, stationId);
          allHistoricalObs.push(...observations);
        }
      } catch (e) {
        console.warn(`Error al recuperar datos históricos de ${date}:`, e);
      }
    }

    return allHistoricalObs;
  } catch (err) {
    console.error('Error al consultar commits históricos:', err);
    return [];
  }
}
