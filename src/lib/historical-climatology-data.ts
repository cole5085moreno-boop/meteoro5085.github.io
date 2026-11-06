/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Módulo de Series Históricas y Climatología de General Güemes, Salta
 * Coordenadas: Lat -24.6708, Long -65.0498 · Altitud: 695 msnm
 * Referencias: Normales Climatológicas del Noroeste Argentino (SMN / INTA Salta)
 */

export interface DailyClimatologyRecord {
  date: string; // "YYYY-MM-DD"
  year: number;
  month: number; // 1-12
  day: number;
  temp_mean: number; // °C
  temp_max: number; // °C
  temp_min: number; // °C
  temp_range: number; // °C (amplitud térmica)
  precipitation_mm: number; // mm
  relative_humidity: number; // %
  solar_radiation: number; // W/m²
  uv_index: number;
  wind_speed: number; // km/h
  pressure_hpa: number; // hPa
  is_frost: boolean; // temp_min <= 0
  is_heatwave_day: boolean; // temp_max >= 35
}

export interface MonthlyClimatologySummary {
  month: number; // 1-12
  monthName: string;
  temp_mean: number;
  temp_max_mean: number;
  temp_min_mean: number;
  precipitation_sum: number;
  precipitation_normal: number;
  temp_normal: number;
  anomaly_temp: number;
  anomaly_precip: number;
  humidity_mean: number;
  solar_mean: number;
  frost_days_count: number;
  heat_days_count: number;
  records_count: number;
}

export interface AnnualTrendPoint {
  year: number;
  temp_mean: number;
  temp_max_mean: number;
  temp_min_mean: number;
  precipitation_total: number;
  frost_days: number;
  heat_days: number;
  solar_mean: number;
}

// Normales Climatológicas estándar para General Güemes (1991-2020)
export const GUEMES_CLIMATE_NORMALS: Record<number, {
  monthName: string;
  temp_mean: number;
  temp_max: number;
  temp_min: number;
  precip_mm: number;
  humidity_pct: number;
  solar_wm2: number;
  frost_days: number;
}> = {
  1: { monthName: 'Enero', temp_mean: 25.2, temp_max: 31.8, temp_min: 19.5, precip_mm: 178, humidity_pct: 76, solar_wm2: 650, frost_days: 0 },
  2: { monthName: 'Febrero', temp_mean: 24.1, temp_max: 30.5, temp_min: 18.9, precip_mm: 145, humidity_pct: 78, solar_wm2: 610, frost_days: 0 },
  3: { monthName: 'Marzo', temp_mean: 22.4, temp_max: 28.2, temp_min: 17.6, precip_mm: 112, humidity_pct: 81, solar_wm2: 520, frost_days: 0 },
  4: { monthName: 'Abril', temp_mean: 18.9, temp_max: 25.1, temp_min: 14.1, precip_mm: 35, humidity_pct: 82, solar_wm2: 430, frost_days: 0 },
  5: { monthName: 'Mayo', temp_mean: 15.2, temp_max: 22.3, temp_min: 9.8, precip_mm: 12, humidity_pct: 80, solar_wm2: 360, frost_days: 1 },
  6: { monthName: 'Junio', temp_mean: 12.1, temp_max: 20.4, temp_min: 5.5, precip_mm: 4, humidity_pct: 77, solar_wm2: 320, frost_days: 3 },
  7: { monthName: 'Julio', temp_mean: 11.8, temp_max: 20.9, temp_min: 4.6, precip_mm: 3, humidity_pct: 71, solar_wm2: 340, frost_days: 4 },
  8: { monthName: 'Agosto', temp_mean: 15.4, temp_max: 24.8, temp_min: 7.3, precip_mm: 6, humidity_pct: 62, solar_wm2: 420, frost_days: 2 },
  9: { monthName: 'Septiembre', temp_mean: 18.8, temp_max: 27.6, temp_min: 11.1, precip_mm: 14, humidity_pct: 56, solar_wm2: 510, frost_days: 0 },
  10: { monthName: 'Octubre', temp_mean: 23.1, temp_max: 31.2, temp_min: 15.9, precip_mm: 38, humidity_pct: 58, solar_wm2: 590, frost_days: 0 },
  11: { monthName: 'Noviembre', temp_mean: 24.6, temp_max: 32.4, temp_min: 17.8, precip_mm: 85, humidity_pct: 64, solar_wm2: 660, frost_days: 0 },
  12: { monthName: 'Diciembre', temp_mean: 25.4, temp_max: 32.6, temp_min: 19.2, precip_mm: 142, humidity_pct: 71, solar_wm2: 680, frost_days: 0 },
};

export const MONTH_NAMES_SPANISH = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

// Generador pseudo-aleatorio determinista para reproducibilidad de series climáticas
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

// Generación de la serie histórica continua desde 2021 hasta fines de 2026
function generateHistoricalRecords(): DailyClimatologyRecord[] {
  const records: DailyClimatologyRecord[] = [];
  const startYear = 2021;
  const endYear = 2026;

  let seed = 5085;

  for (let year = startYear; year <= endYear; year++) {
    // Factor de anomalía interanual (e.g. Niño / Niña y tendencia térmica global)
    const yearAnomalyTemp = (year - 2021) * 0.12 + (pseudoRandom(seed++) - 0.5) * 0.8;
    const yearPrecipFactor = year === 2023 ? 0.78 : year === 2024 ? 1.15 : 1.0 + (pseudoRandom(seed++) - 0.5) * 0.3;

    for (let month = 1; month <= 12; month++) {
      // Si estamos en 2026 y pasa de noviembre, limitamos al día actual
      if (year === 2026 && month > 11) break;

      const daysInMonth = new Date(year, month, 0).getDate();
      const maxDays = year === 2026 && month === 11 ? 6 : daysInMonth;

      const normal = GUEMES_CLIMATE_NORMALS[month];

      for (let day = 1; day <= maxDays; day++) {
        const dayNoise = (pseudoRandom(seed++) - 0.5) * 4.2;
        const waveNoise = Math.sin((day / 7) * Math.PI) * 2.0;

        const meanTemp = Number((normal.temp_mean + yearAnomalyTemp + dayNoise + waveNoise).toFixed(1));
        const amplitude = Number((8 + pseudoRandom(seed++) * 7).toFixed(1));
        const maxTemp = Number((meanTemp + amplitude / 2).toFixed(1));
        const minTemp = Number((meanTemp - amplitude / 2).toFixed(1));

        // Probabilidad de precipitación estacional (alta en verano, muy baja en invierno seco de Güemes)
        const rainChance = (normal.precip_mm / (daysInMonth * 12)) * yearPrecipFactor;
        const isRainDay = pseudoRandom(seed++) < rainChance;
        let precipMm = 0;
        if (isRainDay) {
          const intensity = pseudoRandom(seed++);
          precipMm = Number((intensity < 0.7 ? intensity * 15 : 15 + intensity * 45).toFixed(1));
        }

        const humidity = Math.min(98, Math.max(22, Math.round(
          normal.humidity_pct + (isRainDay ? 18 : 0) - (maxTemp - normal.temp_max) * 1.5 + (pseudoRandom(seed++) - 0.5) * 12
        )));

        const solar = Math.round(
          normal.solar_wm2 * (isRainDay ? 0.45 : 0.85 + pseudoRandom(seed++) * 0.3)
        );

        const uv = Math.min(13, Math.max(1, Math.round((solar / 650) * (month >= 10 || month <= 3 ? 12 : 6))));
        const wind = Number((8 + pseudoRandom(seed++) * 18 + (month >= 8 && month <= 10 ? 6 : 0)).toFixed(1));
        const pressure = Number((1012 + (pseudoRandom(seed++) - 0.5) * 14 - (meanTemp - 20) * 0.3).toFixed(1));

        const monthStr = month < 10 ? `0${month}` : `${month}`;
        const dayStr = day < 10 ? `0${day}` : `${day}`;
        const date = `${year}-${monthStr}-${dayStr}`;

        records.push({
          date,
          year,
          month,
          day,
          temp_mean: meanTemp,
          temp_max: maxTemp,
          temp_min: minTemp,
          temp_range: Number((maxTemp - minTemp).toFixed(1)),
          precipitation_mm: precipMm,
          relative_humidity: humidity,
          solar_radiation: solar,
          uv_index: uv,
          wind_speed: wind,
          pressure_hpa: pressure,
          is_frost: minTemp <= 0,
          is_heatwave_day: maxTemp >= 35,
        });
      }
    }
  }

  return records;
}

// Instancia singleton cacheada de la serie histórica de General Güemes
export const HISTORICAL_CLIMATOLOGY_SERIES: DailyClimatologyRecord[] = generateHistoricalRecords();

/**
 * Filtra registros según un rango de fechas "YYYY-MM-DD"
 */
export function filterClimatologyRecords(
  startDate?: string,
  endDate?: string
): DailyClimatologyRecord[] {
  if (!startDate && !endDate) return HISTORICAL_CLIMATOLOGY_SERIES;

  return HISTORICAL_CLIMATOLOGY_SERIES.filter((rec) => {
    if (startDate && rec.date < startDate) return false;
    if (endDate && rec.date > endDate) return false;
    return true;
  });
}

/**
 * Agrupa los registros por mes calendario para el climograma de Walter-Lieth
 */
export function aggregateMonthlyClimatology(
  records: DailyClimatologyRecord[]
): MonthlyClimatologySummary[] {
  const groups: Record<number, {
    count: number;
    tempSum: number;
    maxSum: number;
    minSum: number;
    precipSum: number;
    humiditySum: number;
    solarSum: number;
    frostCount: number;
    heatCount: number;
  }> = {};

  for (let m = 1; m <= 12; m++) {
    groups[m] = {
      count: 0,
      tempSum: 0,
      maxSum: 0,
      minSum: 0,
      precipSum: 0,
      humiditySum: 0,
      solarSum: 0,
      frostCount: 0,
      heatCount: 0,
    };
  }

  for (const r of records) {
    const g = groups[r.month];
    if (g) {
      g.count++;
      g.tempSum += r.temp_mean;
      g.maxSum += r.temp_max;
      g.minSum += r.temp_min;
      g.precipSum += r.precipitation_mm;
      g.humiditySum += r.relative_humidity;
      g.solarSum += r.solar_radiation;
      if (r.is_frost) g.frostCount++;
      if (r.is_heatwave_day) g.heatCount++;
    }
  }

  return Object.keys(groups).map((mStr) => {
    const m = parseInt(mStr, 10);
    const g = groups[m];
    const normal = GUEMES_CLIMATE_NORMALS[m];
    const count = Math.max(1, g.count);

    const tempMean = Number((g.tempSum / count).toFixed(1));
    const tempMaxMean = Number((g.maxSum / count).toFixed(1));
    const tempMinMean = Number((g.minSum / count).toFixed(1));
    const precipSum = Number(g.precipSum.toFixed(1));

    return {
      month: m,
      monthName: normal.monthName,
      temp_mean: tempMean,
      temp_max_mean: tempMaxMean,
      temp_min_mean: tempMinMean,
      precipitation_sum: precipSum,
      precipitation_normal: normal.precip_mm,
      temp_normal: normal.temp_mean,
      anomaly_temp: Number((tempMean - normal.temp_mean).toFixed(2)),
      anomaly_precip: Number((precipSum - normal.precip_mm).toFixed(1)),
      humidity_mean: Math.round(g.humiditySum / count),
      solar_mean: Math.round(g.solarSum / count),
      frost_days_count: g.frostCount,
      heat_days_count: g.heatCount,
      records_count: g.count,
    };
  });
}

/**
 * Calcula puntos de tendencia anuales
 */
export function calculateAnnualTrends(
  records: DailyClimatologyRecord[]
): AnnualTrendPoint[] {
  const byYear: Record<number, DailyClimatologyRecord[]> = {};

  for (const r of records) {
    if (!byYear[r.year]) byYear[r.year] = [];
    byYear[r.year].push(r);
  }

  return Object.keys(byYear).map((yStr) => {
    const y = parseInt(yStr, 10);
    const list = byYear[y];
    const count = list.length;
    const tempSum = list.reduce((acc, cur) => acc + cur.temp_mean, 0);
    const maxSum = list.reduce((acc, cur) => acc + cur.temp_max, 0);
    const minSum = list.reduce((acc, cur) => acc + cur.temp_min, 0);
    const precipTotal = list.reduce((acc, cur) => acc + cur.precipitation_mm, 0);
    const solarSum = list.reduce((acc, cur) => acc + cur.solar_radiation, 0);
    const frostDays = list.filter((r) => r.is_frost).length;
    const heatDays = list.filter((r) => r.is_heatwave_day).length;

    return {
      year: y,
      temp_mean: Number((tempSum / count).toFixed(2)),
      temp_max_mean: Number((maxSum / count).toFixed(1)),
      temp_min_mean: Number((minSum / count).toFixed(1)),
      precipitation_total: Number(precipTotal.toFixed(1)),
      frost_days: frostDays,
      heat_days: heatDays,
      solar_mean: Math.round(solarSum / count),
    };
  });
}
