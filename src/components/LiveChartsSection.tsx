/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Gráficos Meteorológicos Interactivos de Alta Precisión y Rosa de los Vientos
 */

import React, { useState, useMemo } from 'react';
import type { WeatherObservation } from '../types/weather.ts';

interface LiveChartsSectionProps {
  observations: WeatherObservation[];
}

type ChartMetric =
  | 'temp_dew'
  | 'humidity_vpd'
  | 'pressure'
  | 'wind'
  | 'solar_uv'
  | 'rain';

export const LiveChartsSection: React.FC<LiveChartsSectionProps> = ({ observations }) => {
  const [selectedMetric, setSelectedMetric] = useState<ChartMetric>('temp_dew');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Ordenar cronológicamente
  const sorted = useMemo(() => {
    return [...observations].sort(
      (a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
    );
  }, [observations]);

  // Si hay más de 120 puntos, submuestrear ordenadamente para suavizar render SVG
  const data = useMemo(() => {
    if (sorted.length <= 150) return sorted;
    const step = Math.ceil(sorted.length / 120);
    const sampled: WeatherObservation[] = [];
    for (let i = 0; i < sorted.length; i += step) {
      sampled.push(sorted[i]);
    }
    // Asegurar siempre el último punto
    if (sampled[sampled.length - 1] !== sorted[sorted.length - 1]) {
      sampled.push(sorted[sorted.length - 1]);
    }
    return sampled;
  }, [sorted]);

  // Configuración de la métrica activa
  const config = useMemo(() => {
    switch (selectedMetric) {
      case 'temp_dew':
        return {
          title: 'Temperatura Exterior y Punto de Rocío',
          seriesA: { name: 'Temperatura', unit: '°C', color: '#0284c7', getter: (o: WeatherObservation) => o.temperature_c },
          seriesB: { name: 'Punto de Rocío', unit: '°C', color: '#0d9488', getter: (o: WeatherObservation) => o.dew_point_c },
          seriesC: { name: 'Sensación Térmica', unit: '°C', color: '#ea580c', getter: (o: WeatherObservation) => o.feels_like_c },
        };
      case 'humidity_vpd':
        return {
          title: 'Humedad Relativa y Déficit de Presión de Vapor (VPD)',
          seriesA: { name: 'Humedad', unit: '%', color: '#2563eb', getter: (o: WeatherObservation) => o.relative_humidity_pct },
          seriesB: { name: 'VPD', unit: 'kPa', color: '#16a34a', getter: (o: WeatherObservation) => o.vapor_pressure_deficit_kpa ? o.vapor_pressure_deficit_kpa * 30 : null }, // escalado visual
          seriesBReal: { name: 'VPD Real', unit: 'kPa', getter: (o: WeatherObservation) => o.vapor_pressure_deficit_kpa },
        };
      case 'pressure':
        return {
          title: 'Presión Barométrica Relativa y Absoluta',
          seriesA: { name: 'Presión Relativa', unit: 'hPa', color: '#6366f1', getter: (o: WeatherObservation) => o.pressure_relative_hpa },
          seriesB: { name: 'Presión Absoluta', unit: 'hPa', color: '#8b5cf6', getter: (o: WeatherObservation) => o.pressure_absolute_hpa },
        };
      case 'wind':
        return {
          title: 'Velocidad del Viento y Ráfagas Máximas',
          seriesA: { name: 'Velocidad Media', unit: 'km/h', color: '#06b6d4', getter: (o: WeatherObservation) => o.wind_speed_kmh },
          seriesB: { name: 'Ráfaga', unit: 'km/h', color: '#f59e0b', getter: (o: WeatherObservation) => o.wind_gust_kmh },
        };
      case 'solar_uv':
        return {
          title: 'Radiación Solar e Índice Ultravioleta',
          seriesA: { name: 'Radiación Solar', unit: 'W/m²', color: '#f59e0b', getter: (o: WeatherObservation) => o.solar_radiation_wm2 },
          seriesB: { name: 'Índice UV (x50)', unit: 'Índice', color: '#ef4444', getter: (o: WeatherObservation) => o.uv_index ? o.uv_index * 50 : null },
          seriesBReal: { name: 'Índice UV Real', unit: 'UV', getter: (o: WeatherObservation) => o.uv_index },
        };
      case 'rain':
        return {
          title: 'Precipitaciones e Intensidad de Lluvia',
          seriesA: { name: 'Lluvia Diaria', unit: 'mm', color: '#0284c7', getter: (o: WeatherObservation) => o.precipitation_daily_mm },
          seriesB: { name: 'Intensidad', unit: 'mm/h', color: '#06b6d4', getter: (o: WeatherObservation) => o.precipitation_rate_mmh },
        };
    }
  }, [selectedMetric]);

  // Dimensiones SVG
  const width = 860;
  const height = 280;
  const padLeft = 55;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 35;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Encontrar valores min y max para escala Y
  const { minY, maxY } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;

    for (const obs of data) {
      const vA = config.seriesA.getter(obs);
      if (vA !== null && !isNaN(vA)) {
        if (vA < min) min = vA;
        if (vA > max) max = vA;
      }
      if (config.seriesB) {
        const vB = config.seriesB.getter(obs);
        if (vB !== null && !isNaN(vB)) {
          if (vB < min) min = vB;
          if (vB > max) max = vB;
        }
      }
      if (config.seriesC) {
        const vC = config.seriesC.getter(obs);
        if (vC !== null && !isNaN(vC)) {
          if (vC < min) min = vC;
          if (vC > max) max = vC;
        }
      }
    }

    if (min === Infinity || max === -Infinity) {
      return { minY: 0, maxY: 100 };
    }

    // Agregar margen del 10%
    const diff = max - min || 10;
    return {
      minY: Math.floor(min - diff * 0.1),
      maxY: Math.ceil(max + diff * 0.1),
    };
  }, [data, config]);

  const getYCoord = (val: number) => {
    const range = maxY - minY || 1;
    return padTop + chartH - ((val - minY) / range) * chartH;
  };

  const getXCoord = (idx: number) => {
    if (data.length <= 1) return padLeft + chartW / 2;
    return padLeft + (idx / (data.length - 1)) * chartW;
  };

  // Construir caminos SVG
  const buildPath = (getter: (o: WeatherObservation) => number | null) => {
    const pts: { x: number; y: number }[] = [];
    data.forEach((obs, idx) => {
      const val = getter(obs);
      if (val !== null && !isNaN(val)) {
        pts.push({ x: getXCoord(idx), y: getYCoord(val) });
      }
    });

    if (pts.length === 0) return '';
    return pts.reduce((acc, p, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, '');
  };

  const pathA = buildPath(config.seriesA.getter);
  const pathB = config.seriesB ? buildPath(config.seriesB.getter) : '';
  const pathC = config.seriesC ? buildPath(config.seriesC.getter) : '';

  // Distribución para Rosa de los Vientos
  const windRoseData = useMemo(() => {
    const cardinalBuckets = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    const counts: Record<string, number> = { N: 0, NE: 0, E: 0, SE: 0, S: 0, SW: 0, W: 0, NW: 0 };
    let valid = 0;

    for (const obs of sorted) {
      if (obs.wind_direction_deg !== null && obs.wind_direction_deg >= 0) {
        const deg = obs.wind_direction_deg;
        const idx = Math.round(deg / 45) % 8;
        counts[cardinalBuckets[idx]]++;
        valid++;
      }
    }

    const maxCount = Math.max(...Object.values(counts), 1);
    return { counts, maxCount, valid };
  }, [sorted]);

  const activeObs = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-8 shadow-xs transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Evolución Meteorológica y Dinámica de Vientos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Series temporales de la estación automática Colegio 5085 · {data.length} puntos analizados
          </p>
        </div>

        {/* Selector de variable con estilo segmentado limpio */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-medium">
          <button
            onClick={() => setSelectedMetric('temp_dew')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMetric === 'temp_dew'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Temperatura
          </button>

          <button
            onClick={() => setSelectedMetric('humidity_vpd')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMetric === 'humidity_vpd'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Humedad y VPD
          </button>

          <button
            onClick={() => setSelectedMetric('wind')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMetric === 'wind'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Viento
          </button>

          <button
            onClick={() => setSelectedMetric('solar_uv')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMetric === 'solar_uv'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Radiación y UV
          </button>

          <button
            onClick={() => setSelectedMetric('pressure')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMetric === 'pressure'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Presión
          </button>

          <button
            onClick={() => setSelectedMetric('rain')}
            className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 ${
              selectedMetric === 'rain'
                ? 'bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Lluvia
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* GRÁFICO PRINCIPAL DE LÍNEAS EN SVG (3 columnas) */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
            <span>{config.title}</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: config.seriesA.color }} />
                <span>{config.seriesA.name}</span>
              </span>
              {config.seriesB && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: config.seriesB.color }} />
                  <span>{config.seriesB.name}</span>
                </span>
              )}
              {config.seriesC && (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: config.seriesC.color }} />
                  <span>{config.seriesC.name}</span>
                </span>
              )}
            </div>
          </div>

          <div className="relative w-full overflow-hidden bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg p-2">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto cursor-crosshair select-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const svgX = ((e.clientX - rect.left) / rect.width) * width;
                const relX = svgX - padLeft;
                const ratio = Math.max(0, Math.min(1, relX / chartW));
                const idx = Math.round(ratio * (data.length - 1));
                setHoverIndex(idx);
              }}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* Ejes y líneas de cuadrícula horizontales */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padTop + chartH * (1 - ratio);
                const val = minY + (maxY - minY) * ratio;
                return (
                  <g key={ratio}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={width - padRight}
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-slate-200 dark:text-slate-800"
                    />
                    <text
                      x={padLeft - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {val.toFixed(0)}
                    </text>
                  </g>
                );
              })}

              {/* Trazos de curvas de datos */}
              {pathA && (
                <path
                  d={pathA}
                  fill="none"
                  stroke={config.seriesA.color}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {pathB && (
                <path
                  d={pathB}
                  fill="none"
                  stroke={config.seriesB.color}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {pathC && config.seriesC && (
                <path
                  d={pathC}
                  fill="none"
                  stroke={config.seriesC.color}
                  strokeWidth="1.6"
                  strokeDasharray="4 2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Cursor interactivo vertical */}
              {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < data.length && (
                <line
                  x1={getXCoord(hoverIndex)}
                  y1={padTop}
                  x2={getXCoord(hoverIndex)}
                  y2={padTop + chartH}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              )}

              {/* Marcas de tiempo en el eje X */}
              {data.length > 0 && (
                <>
                  <text
                    x={padLeft}
                    y={height - 10}
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {data[0]?.observed_at?.split(' ')[1] || data[0]?.observed_at}
                  </text>
                  <text
                    x={padLeft + chartW / 2}
                    y={height - 10}
                    textAnchor="middle"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {data[Math.floor(data.length / 2)]?.observed_at?.split(' ')[1] || ''}
                  </text>
                  <text
                    x={width - padRight}
                    y={height - 10}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 font-mono"
                  >
                    {data[data.length - 1]?.observed_at?.split(' ')[1] || ''}
                  </text>
                </>
              )}
            </svg>

            {/* Tooltip flotante interactivo */}
            {activeObs && hoverIndex !== null && (
              <div
                className="absolute z-10 pointer-events-none bg-slate-900/90 text-white rounded-lg p-2.5 text-xs shadow-lg backdrop-blur-xs font-mono"
                style={{
                  left: `${Math.min(75, Math.max(15, (getXCoord(hoverIndex) / width) * 100))}%`,
                  top: '12px',
                  transform: 'translateX(-50%)',
                }}
              >
                <div className="text-[11px] text-slate-300 font-semibold border-b border-slate-700 pb-1 mb-1.5">
                  {activeObs.observed_at}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400">{config.seriesA.name}:</span>
                    <strong className="text-sky-400">
                      {config.seriesA.getter(activeObs) !== null ? config.seriesA.getter(activeObs) : '—'} {config.seriesA.unit}
                    </strong>
                  </div>
                  {config.seriesB && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">{config.seriesB.name}:</span>
                      <strong className="text-emerald-400">
                        {config.seriesB.getter(activeObs) !== null ? config.seriesB.getter(activeObs) : '—'} {config.seriesB.unit}
                      </strong>
                    </div>
                  )}
                  {config.seriesC && (
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-400">{config.seriesC.name}:</span>
                      <strong className="text-amber-400">
                        {config.seriesC.getter(activeObs) !== null ? config.seriesC.getter(activeObs) : '—'} {config.seriesC.unit}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ROSA DE LOS VIENTOS (1 columna) */}
        <div className="flex flex-col items-center justify-center p-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Rosa de los Vientos (General Güemes)
          </div>
          <div className="text-[11px] text-slate-500 mb-3 text-center">
            Frecuencia de rumbos · {windRoseData.valid} mediciones
          </div>

          <svg viewBox="0 0 160 160" className="w-40 h-40">
            {/* Círculos concéntricos de referencia */}
            <circle cx="80" cy="80" r="60" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="2 2" />
            <circle cx="80" cy="80" r="40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="2 2" />
            <circle cx="80" cy="80" r="20" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="2 2" />
            <line x1="80" y1="15" x2="80" y2="145" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <line x1="15" y1="80" x2="145" y2="80" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />

            {/* Etiquetas cardinales */}
            <text x="80" y="12" textAnchor="middle" className="text-[10px] font-bold fill-slate-700 dark:text-slate-300">N</text>
            <text x="148" y="83" textAnchor="start" className="text-[10px] font-bold fill-slate-700 dark:text-slate-300">E</text>
            <text x="80" y="156" textAnchor="middle" className="text-[10px] font-bold fill-slate-700 dark:text-slate-300">S</text>
            <text x="12" y="83" textAnchor="end" className="text-[10px] font-bold fill-slate-700 dark:text-slate-300">W</text>

            {/* Pétalos radiales según frecuencia real */}
            {Object.entries(windRoseData.counts).map(([cardinal, count], idx) => {
              const deg = idx * 45;
              const rad = (deg - 90) * (Math.PI / 180);
              const length = (count / windRoseData.maxCount) * 55;
              const x2 = 80 + length * Math.cos(rad);
              const y2 = 80 + length * Math.sin(rad);

              return (
                <line
                  key={cardinal}
                  x1="80"
                  y1="80"
                  x2={x2}
                  y2={y2}
                  stroke="#0284c7"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="hover:stroke-sky-400 transition-colors"
                >
                  <title>{`${cardinal}: ${count} observaciones (${Math.round((count / (windRoseData.valid || 1)) * 100)}%)`}</title>
                </line>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
};
