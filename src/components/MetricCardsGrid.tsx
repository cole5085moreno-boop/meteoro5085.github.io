/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Cuadrícula de Tarjetas de Variables Meteorológicas en Tiempo Real
 */

import React from 'react';
import {
  Thermometer,
  Droplets,
  Gauge,
  CloudRain,
  Wind,
  Sun,
  ShieldAlert,
  Leaf,
  CloudSun,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import type { WeatherObservation } from '../types/weather.ts';
import { degreesToCardinal } from '../lib/weather-engine.ts';

interface MetricCardsGridProps {
  observation: WeatherObservation | null;
  prevObservation?: WeatherObservation | null;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({
  observation,
  prevObservation,
}) => {
  if (!observation) {
    return (
      <div className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <p className="text-slate-500 dark:text-slate-400">Sin datos meteorológicos disponibles en este momento.</p>
      </div>
    );
  }

  // Ayudante de variación temporal
  const renderTrend = (current: number | null, prev: number | null | undefined, unit: string) => {
    if (current === null || prev === null || prev === undefined) return null;
    const diff = Math.round((current - prev) * 10) / 10;
    if (diff === 0) {
      return (
        <span className="inline-flex items-center text-xs text-slate-500 font-mono tabular-nums">
          <Minus className="w-3 h-3 mr-0.5" /> Estable
        </span>
      );
    }
    const isUp = diff > 0;
    return (
      <span
        className={`inline-flex items-center text-xs font-mono tabular-nums ${
          isUp ? 'text-amber-600 dark:text-amber-400' : 'text-sky-600 dark:text-sky-400'
        }`}
      >
        {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {isUp ? `+${diff}` : diff} {unit}
      </span>
    );
  };

  // Escala UV de la OMS
  const getUvScale = (uvi: number | null) => {
    if (uvi === null) return { level: 'Sin datos', color: 'text-slate-500' };
    if (uvi <= 2) return { level: 'Bajo (Seguro)', color: 'text-emerald-600 dark:text-emerald-400' };
    if (uvi <= 5) return { level: 'Moderado (Protección)', color: 'text-amber-600 dark:text-amber-400' };
    if (uvi <= 7) return { level: 'Alto (Protección necesaria)', color: 'text-orange-600 dark:text-orange-400' };
    if (uvi <= 10) return { level: 'Muy Alto (Evitar sol)', color: 'text-rose-600 dark:text-rose-400' };
    return { level: 'Extremo (Riesgo máximo)', color: 'text-purple-600 dark:text-purple-400' };
  };

  // Explicación agronómica del VPD (Déficit de Presión de Vapor)
  const getVpdEvaluation = (vpd: number | null) => {
    if (vpd === null) return 'Sin datos';
    if (vpd < 0.4) return 'Baja transpiración (Riesgo hongos)';
    if (vpd <= 1.2) return 'Rango óptimo fotosíntesis vegetal';
    if (vpd <= 1.8) return 'Transpiración elevada (Demanda hídrica)';
    return 'Estrés hídrico severo (Cierre estomático)';
  };

  const uvInfo = getUvScale(observation.uv_index);
  const windCardinal = degreesToCardinal(observation.wind_direction_deg);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      {/* 1. TEMPERATURA EXTERIOR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Temperatura Exterior
          </span>
          <Thermometer className="w-4 h-4 text-sky-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.temperature_c !== null ? observation.temperature_c.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">°C</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Sensación: <strong className="font-mono text-slate-700 dark:text-slate-200">{observation.feels_like_c !== null ? `${observation.feels_like_c}°C` : 'N/A'}</strong>
          </span>
          {renderTrend(observation.temperature_c, prevObservation?.temperature_c, '°C')}
        </div>
      </div>

      {/* 2. HUMEDAD RELATIVA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Humedad Relativa
          </span>
          <Droplets className="w-4 h-4 text-blue-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.relative_humidity_pct !== null ? Math.round(observation.relative_humidity_pct) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">%</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Punto de rocío: <strong className="font-mono text-slate-700 dark:text-slate-200">{observation.dew_point_c !== null ? `${observation.dew_point_c}°C` : 'N/A'}</strong>
          </span>
          {renderTrend(observation.relative_humidity_pct, prevObservation?.relative_humidity_pct, '%')}
        </div>
      </div>

      {/* 3. PRESIÓN ATMOSFÉRICA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Presión Atmosférica
          </span>
          <Gauge className="w-4 h-4 text-indigo-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.pressure_relative_hpa !== null ? observation.pressure_relative_hpa.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">hPa</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Absoluta: <strong className="font-mono text-slate-700 dark:text-slate-200">{observation.pressure_absolute_hpa !== null ? `${observation.pressure_absolute_hpa.toFixed(1)} hPa` : 'N/A'}</strong>
          </span>
          {renderTrend(observation.pressure_relative_hpa, prevObservation?.pressure_relative_hpa, 'hPa')}
        </div>
      </div>

      {/* 4. PRECIPITACIONES */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Precipitaciones
          </span>
          <CloudRain className="w-4 h-4 text-teal-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.precipitation_rate_mmh !== null ? observation.precipitation_rate_mmh.toFixed(1) : '0.0'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">mm/h</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Día: <strong className="font-mono text-slate-700 dark:text-slate-200">{observation.precipitation_daily_mm !== null ? `${observation.precipitation_daily_mm} mm` : '0 mm'}</strong>
          </span>
          <span className="text-slate-500">
            Mes: <strong className="font-mono text-slate-700 dark:text-slate-200">{observation.precipitation_monthly_mm !== null ? `${observation.precipitation_monthly_mm} mm` : '0 mm'}</strong>
          </span>
        </div>
      </div>

      {/* 5. VIENTO Y RÁFAGAS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Viento y Ráfagas
          </span>
          <Wind className="w-4 h-4 text-cyan-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.wind_speed_kmh !== null ? observation.wind_speed_kmh.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">km/h</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-500">
            Ráfaga: <strong className="font-mono text-slate-700 dark:text-slate-200">{observation.wind_gust_kmh !== null ? `${observation.wind_gust_kmh} km/h` : 'N/A'}</strong>
          </span>
          <span className="text-slate-500 font-mono">
            Rumbo: <strong className="text-sky-600 dark:text-sky-400 font-bold">{windCardinal}</strong> ({observation.wind_direction_deg !== null ? `${observation.wind_direction_deg}°` : '—'})
          </span>
        </div>
      </div>

      {/* 6. RADIACIÓN SOLAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Radiación Solar
          </span>
          <Sun className="w-4 h-4 text-amber-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.solar_radiation_wm2 !== null ? observation.solar_radiation_wm2.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">W/m²</span>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Potencia instantánea</span>
          {renderTrend(observation.solar_radiation_wm2, prevObservation?.solar_radiation_wm2, 'W/m²')}
        </div>
      </div>

      {/* 7. ÍNDICE UV */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Índice UV (OMS)
          </span>
          <ShieldAlert className="w-4 h-4 text-orange-500" />
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.uv_index !== null ? observation.uv_index : '—'}
          </span>
          <span className={`text-xs font-semibold ${uvInfo.color}`}>{uvInfo.level}</span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 truncate">
          Riesgo biológico de exposición solar
        </div>
      </div>

      {/* 8. DÉFICIT DE PRESIÓN DE VAPOR (VPD) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Déficit Presión Vapor (VPD)
          </span>
          <Leaf className="w-4 h-4 text-emerald-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.vapor_pressure_deficit_kpa !== null ? observation.vapor_pressure_deficit_kpa.toFixed(3) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">kPa</span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 truncate" title={getVpdEvaluation(observation.vapor_pressure_deficit_kpa)}>
          {getVpdEvaluation(observation.vapor_pressure_deficit_kpa)}
        </div>
      </div>

      {/* 9. ESTADO DEL CIELO (ESTIMADO) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Estado del Cielo
          </span>
          <CloudSun className="w-4 h-4 text-sky-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-2xl font-bold text-slate-900 dark:text-white">
            {observation.sky_condition}
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Origen: </span>
          <strong className="text-slate-700 dark:text-slate-300 font-medium">
            {observation.sky_condition_source === 'estimated_solar'
              ? 'Estimado por radiación solar'
              : observation.sky_condition_source === 'manual_observation'
              ? 'Observación humana'
              : 'Sin datos directos'}
          </strong>
        </div>
      </div>

      {/* 10. PUNTO DE ROCÍO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Punto de Rocío
          </span>
          <Droplets className="w-4 h-4 text-teal-600" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.dew_point_c !== null ? observation.dew_point_c.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">°C</span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Temperatura de condensación del aire</span>
        </div>
      </div>

      {/* 11. SENSACIÓN TÉRMICA */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Sensación Térmica
          </span>
          <Thermometer className="w-4 h-4 text-orange-500" />
        </div>

        <div className="flex items-baseline gap-1 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {observation.feels_like_c !== null ? observation.feels_like_c.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium font-mono text-slate-500">°C</span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Efecto combinado de temperatura y viento</span>
        </div>
      </div>

      {/* 12. DIRECCIÓN Y ROSA DE LOS VIENTOS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
          <span className="font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Rumbo del Viento
          </span>
          <Compass className="w-4 h-4 text-blue-500" />
        </div>

        <div className="flex items-baseline gap-2 my-1">
          <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {windCardinal}
          </span>
          <span className="text-sm font-mono text-slate-500">
            ({observation.wind_direction_deg !== null ? `${observation.wind_direction_deg}°` : '—'})
          </span>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
          <span>Proviene desde: <strong>{windCardinal}</strong></span>
        </div>
      </div>
    </div>
  );
};
