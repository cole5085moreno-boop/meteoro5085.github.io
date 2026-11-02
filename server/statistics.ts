/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Módulo de Análisis Estadístico y Computación Científica
 */

import type {
  WeatherObservation,
  VariableStats,
  WindCircularStats,
  PeriodStatsBundle,
} from '../src/types/weather.ts';
import { degreesToCardinal } from './weather-source.ts';

/**
 * Calcula estadísticas descriptivas para una variable numérica.
 */
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

  // Ordenar valores para mediana y extremos
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

  // Varianza y desviación estándar
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

/**
 * Calcula estadísticas circulares para la dirección del viento.
 * No utiliza la media aritmética convencional.
 */
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

  // Convertir distribución a porcentajes
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

/**
 * Agrupa y genera el paquete completo de estadísticas de un período.
 */
export function computePeriodStatsBundle(
  observations: WeatherObservation[],
  periodLabel: string = 'Período seleccionado'
): PeriodStatsBundle {
  const sorted = [...observations].sort(
    (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
  );

  const firstObs = sorted[0]?.observed_at || 'Sin observaciones';
  const lastObs = sorted[sorted.length - 1]?.observed_at || 'Sin observaciones';

  // Precipitaciones
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

  // Distribución del cielo
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

/**
 * Calcula el coeficiente de correlación de Pearson r entre dos series numéricas.
 */
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
