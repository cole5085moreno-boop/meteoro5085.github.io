/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Motor Meteorológico Isomórfico (compatible con Servidor Node.js y GitHub Pages estático)
 */

import type {
  WeatherObservation,
  VariableStats,
  WindCircularStats,
  PeriodStatsBundle,
  StationConfig,
  SyncRun,
} from '../types/weather.ts';

export const PRIMARY_CSV_URL =
  'https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv';

export const GITHUB_COMMITS_API =
  'https://api.github.com/repos/intasalta/daza/commits?path=364053_daily_station_data.csv&per_page=50';

export const DEFAULT_STATION_CONFIG: StationConfig = {
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
  primary_source_url: PRIMARY_CSV_URL,
  github_repo_url: 'https://github.com/intasalta/daza',
  sync_interval_minutes: 15,
  auto_sync_enabled: true,
  updated_at: new Date().toISOString(),
};

function simpleHash(str: string): string {
  let h1 = 0xdeadbeef,
    h2 = 0x41c6ce57;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

function parseNumeric(val: string | undefined): number | null {
  if (!val) return null;
  const trimmed = val.trim();
  if (trimmed === '' || trimmed === '-' || trimmed === 'N/A' || trimmed === 'null') {
    return null;
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? null : num;
}

export function degreesToCardinal(deg: number | null): string {
  if (deg === null || deg < 0) return 'Calma / Variable';
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ];
  const idx = Math.round(deg / 22.5) % 16;
  return directions[idx];
}

function estimateSkyCondition(
  solarWm2: number | null,
  timeStr: string
): {
  condition: 'Soleado' | 'Seminublado' | 'Nublado' | 'Sin datos';
  source: 'estimated_solar' | 'manual_observation' | 'unavailable';
} {
  if (solarWm2 === null) {
    return { condition: 'Sin datos', source: 'unavailable' };
  }
  const timePart = timeStr.split(' ')[1] || '';
  const hour = parseInt(timePart.split(':')[0], 10);
  const isNight = isNaN(hour) ? false : hour < 6 || hour >= 20;

  if (isNight) {
    return { condition: 'Seminublado', source: 'estimated_solar' };
  }
  if (solarWm2 > 500) {
    return { condition: 'Soleado', source: 'estimated_solar' };
  } else if (solarWm2 > 180) {
    return { condition: 'Seminublado', source: 'estimated_solar' };
  } else {
    return { condition: 'Nublado', source: 'estimated_solar' };
  }
}

export function parseWeatherCsv(
  csvText: string,
  stationId: string = '364053'
): { observations: WeatherObservation[]; rejectedCount: number; hash: string } {
  const hash = simpleHash(csvText);
  const lines = csvText.trim().split(/\r?\n/);

  if (lines.length < 3) {
    return { observations: [], rejectedCount: 0, hash };
  }

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
      validation_status: 'valido',
    });
  }

  return { observations, rejectedCount, hash };
}

export function computeVariableStats(
  observations: WeatherObservation[],
  getter: (obs: WeatherObservation) => number | null
): VariableStats {
  const validEntries: { val: number; time: string }[] = [];
  let missing = 0;

  for (const obs of observations) {
    const val = getter(obs);
    if (val !== null && !isNaN(val)) {
      validEntries.push({ val, time: obs.observed_at });
    } else {
      missing++;
    }
  }

  const count = validEntries.length;
  if (count === 0) {
    return {
      count: 0,
      missing,
      mean: null,
      median: null,
      min: null,
      max: null,
      range: null,
      std_dev: null,
    };
  }

  validEntries.sort((a, b) => a.val - b.val);

  const sum = validEntries.reduce((acc, curr) => acc + curr.val, 0);
  const mean = Math.round((sum / count) * 100) / 100;

  const median =
    count % 2 === 0
      ? Math.round(((validEntries[count / 2 - 1].val + validEntries[count / 2].val) / 2) * 100) / 100
      : validEntries[Math.floor(count / 2)].val;

  const min = {
    value: validEntries[0].val,
    observed_at: validEntries[0].time,
  };
  const max = {
    value: validEntries[count - 1].val,
    observed_at: validEntries[count - 1].time,
  };
  const range = Math.round((max.value - min.value) * 100) / 100;

  const variance =
    validEntries.reduce((acc, curr) => acc + Math.pow(curr.val - mean, 2), 0) / count;
  const std_dev = Math.round(Math.sqrt(variance) * 100) / 100;

  return {
    count,
    missing,
    mean,
    median,
    min,
    max,
    range,
    std_dev,
  };
}

export function computeCircularWindStats(
  observations: WeatherObservation[]
): WindCircularStats {
  let sinSum = 0;
  let cosSum = 0;
  let validCount = 0;
  let calmCount = 0;
  let maxSpeed: number | null = null;
  let maxGust: number | null = null;

  const directions: Record<string, number> = {
    N: 0, NNE: 0, NE: 0, ENE: 0, E: 0, ESE: 0, SE: 0, SSE: 0,
    S: 0, SSW: 0, SW: 0, WSW: 0, W: 0, WNW: 0, NW: 0, NNW: 0,
  };

  for (const obs of observations) {
    if (obs.wind_speed_kmh !== null) {
      if (maxSpeed === null || obs.wind_speed_kmh > maxSpeed) {
        maxSpeed = obs.wind_speed_kmh;
      }
      if (obs.wind_speed_kmh === 0) {
        calmCount++;
      }
    }
    if (obs.wind_gust_kmh !== null) {
      if (maxGust === null || obs.wind_gust_kmh > maxGust) {
        maxGust = obs.wind_gust_kmh;
      }
    }

    const deg = obs.wind_direction_deg;
    if (deg !== null && deg >= 0) {
      const rad = (deg * Math.PI) / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
      validCount++;

      const cardinal = degreesToCardinal(deg);
      if (directions[cardinal] !== undefined) {
        directions[cardinal]++;
      }
    }
  }

  let circularMean: number | null = null;
  let cardinalMean = 'Calma / Variable';

  if (validCount > 0) {
    const avgSin = sinSum / validCount;
    const avgCos = cosSum / validCount;
    let radMean = Math.atan2(avgSin, avgCos);
    let degMean = (radMean * 180) / Math.PI;
    if (degMean < 0) degMean += 360;
    circularMean = Math.round(degMean * 10) / 10;
    cardinalMean = degreesToCardinal(circularMean);
  }

  const totalWithDir = validCount || 1;
  const distributionPct: Record<string, number> = {};
  for (const [k, v] of Object.entries(directions)) {
    distributionPct[k] = Math.round((v / totalWithDir) * 1000) / 10;
  }

  return {
    count: validCount,
    circular_mean_deg: circularMean,
    cardinal_mean: cardinalMean,
    max_speed_kmh: maxSpeed,
    max_gust_kmh: maxGust,
    calm_pct: observations.length > 0 ? Math.round((calmCount / observations.length) * 100) : 0,
    direction_distribution: distributionPct,
  };
}

export function computePeriodStatsBundle(
  observations: WeatherObservation[],
  periodLabel: string = 'Período seleccionado'
): PeriodStatsBundle {
  const sorted = [...observations].sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );

  const firstObs = sorted[0]?.observed_at || 'Sin observaciones';
  const lastObs = sorted[sorted.length - 1]?.observed_at || 'Sin observaciones';

  let maxRate = 0;
  let lastDailyAccum = 0;
  let rainIntervals = 0;
  for (const obs of sorted) {
    if (obs.precipitation_rate_mmh && obs.precipitation_rate_mmh > maxRate) {
      maxRate = obs.precipitation_rate_mmh;
    }
    if (obs.precipitation_daily_mm !== null) {
      lastDailyAccum = Math.max(lastDailyAccum, obs.precipitation_daily_mm);
    }
    if (obs.precipitation_rate_mmh && obs.precipitation_rate_mmh > 0) {
      rainIntervals++;
    }
  }

  const skyCounts = { soleado: 0, seminublado: 0, nublado: 0, sin_datos: 0 };
  for (const obs of sorted) {
    if (obs.sky_condition === 'Soleado') skyCounts.soleado++;
    else if (obs.sky_condition === 'Seminublado') skyCounts.seminublado++;
    else if (obs.sky_condition === 'Nublado') skyCounts.nublado++;
    else skyCounts.sin_datos++;
  }

  return {
    period_label: periodLabel,
    total_observations: sorted.length,
    first_observation: firstObs,
    last_observation: lastObs,
    temperature: computeVariableStats(sorted, (o) => o.temperature_c),
    feels_like: computeVariableStats(sorted, (o) => o.feels_like_c),
    dew_point: computeVariableStats(sorted, (o) => o.dew_point_c),
    humidity: computeVariableStats(sorted, (o) => o.relative_humidity_pct),
    vpd: computeVariableStats(sorted, (o) => o.vapor_pressure_deficit_kpa),
    solar_radiation: computeVariableStats(sorted, (o) => o.solar_radiation_wm2),
    uv_index: computeVariableStats(sorted, (o) => o.uv_index),
    pressure_relative: computeVariableStats(sorted, (o) => o.pressure_relative_hpa),
    pressure_absolute: computeVariableStats(sorted, (o) => o.pressure_absolute_hpa),
    wind_speed: computeVariableStats(sorted, (o) => o.wind_speed_kmh),
    wind: computeCircularWindStats(sorted),
    precipitation: {
      total_event_rain_mm: lastDailyAccum,
      max_rate_mmh: Math.round(maxRate * 10) / 10,
      daily_accumulation_mm: Math.round(lastDailyAccum * 10) / 10,
      rain_intervals_count: rainIntervals,
    },
    sky_distribution: skyCounts,
  };
}

export function computePearsonCorrelation(
  observations: WeatherObservation[],
  getterX: (o: WeatherObservation) => number | null,
  getterY: (o: WeatherObservation) => number | null
): { r: number | null; n: number; interpretation: string } {
  const pairs: { x: number; y: number }[] = [];
  for (const obs of observations) {
    const x = getterX(obs);
    const y = getterY(obs);
    if (x !== null && y !== null && !isNaN(x) && !isNaN(y)) {
      pairs.push({ x, y });
    }
  }

  const n = pairs.length;
  if (n < 3) {
    return { r: null, n, interpretation: 'Muestra insuficiente para correlación' };
  }

  const meanX = pairs.reduce((acc, p) => acc + p.x, 0) / n;
  const meanY = pairs.reduce((acc, p) => acc + p.y, 0) / n;

  let num = 0;
  let denX = 0;
  let denY = 0;

  for (const p of pairs) {
    const dx = p.x - meanX;
    const dy = p.y - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  if (denom === 0) {
    return { r: 0, n, interpretation: 'Sin varianza en una de las variables' };
  }

  const r = Math.round((num / denom) * 1000) / 1000;
  let interpretation = '';
  const absR = Math.abs(r);
  if (absR > 0.8) {
    interpretation = r > 0 ? 'Fuerte correlación positiva' : 'Fuerte correlación negativa';
  } else if (absR > 0.5) {
    interpretation = r > 0 ? 'Moderada correlación positiva' : 'Moderada correlación negativa';
  } else if (absR > 0.2) {
    interpretation = 'Débil correlación';
  } else {
    interpretation = 'Sin correlación aparente';
  }

  return { r, n, interpretation };
}
