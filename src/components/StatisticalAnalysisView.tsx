/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Módulo de Análisis Estadístico Meteorológico Completo
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Download,
  Filter,
  BarChart,
  Table,
  CheckCircle,
  HelpCircle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import type { PeriodStatsBundle, WeatherObservation } from '../types/weather.ts';
import { fetchStats, fetchObservations } from '../lib/api.ts';

export const StatisticalAnalysisView: React.FC = () => {
  const [range, setRange] = useState<string>('24h');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [statsBundle, setStatsBundle] = useState<PeriodStatsBundle | null>(null);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [correlations, setCorrelations] = useState<any>(null);

  // Selector de variables para comparación personalizada
  const [compareVarA, setCompareVarA] = useState<string>('temperature_c');
  const [compareVarB, setCompareVarB] = useState<string>('relative_humidity_pct');

  const loadData = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (range === 'custom') {
        if (customStart) params.start = customStart;
        if (customEnd) params.end = customEnd;
      } else {
        params.range = range;
      }

      const [statsRes, obsRes] = await Promise.all([
        fetchStats(params),
        fetchObservations(params),
      ]);

      setStatsBundle(statsRes.stats);
      setCorrelations(statsRes.correlations);
      setObservations(obsRes);
    } catch (e) {
      console.error('Error al cargar datos estadísticos:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [range]);

  const quickRanges = [
    { id: '24h', label: 'Últimas 24 horas' },
    { id: '48h', label: 'Últimas 48 horas' },
    { id: '7d', label: 'Últimos 7 días' },
    { id: '30d', label: 'Últimos 30 días' },
    { id: 'current_month', label: 'Mes actual' },
    { id: 'prev_month', label: 'Mes anterior' },
    { id: 'current_year', label: 'Año actual' },
    { id: 'all', label: 'Todo el historial' },
    { id: 'custom', label: 'Personalizado' },
  ];

  const variableOptions = [
    { id: 'temperature_c', label: 'Temperatura Exterior', unit: '°C' },
    { id: 'feels_like_c', label: 'Sensación Térmica', unit: '°C' },
    { id: 'dew_point_c', label: 'Punto de Rocío', unit: '°C' },
    { id: 'relative_humidity_pct', label: 'Humedad Relativa', unit: '%' },
    { id: 'vapor_pressure_deficit_kpa', label: 'Déficit Presión Vapor (VPD)', unit: 'kPa' },
    { id: 'solar_radiation_wm2', label: 'Radiación Solar', unit: 'W/m²' },
    { id: 'uv_index', label: 'Índice UV', unit: 'UVI' },
    { id: 'pressure_relative_hpa', label: 'Presión Barométrica Relativa', unit: 'hPa' },
    { id: 'wind_speed_kmh', label: 'Velocidad del Viento', unit: 'km/h' },
    { id: 'precipitation_daily_mm', label: 'Precipitación Diaria Acumulada', unit: 'mm' },
  ];

  // Métricas descriptivas tabulares
  const statsTableData = useMemo(() => {
    if (!statsBundle) return [];
    return [
      { name: 'Temperatura Exterior (°C)', stat: statsBundle.temperature, unit: '°C' },
      { name: 'Sensación Térmica (°C)', stat: statsBundle.feels_like, unit: '°C' },
      { name: 'Punto de Rocío (°C)', stat: statsBundle.dew_point, unit: '°C' },
      { name: 'Humedad Relativa (%)', stat: statsBundle.humidity, unit: '%' },
      { name: 'Déficit Presión Vapor (kPa)', stat: statsBundle.vpd, unit: 'kPa' },
      { name: 'Radiación Solar (W/m²)', stat: statsBundle.solar_radiation, unit: 'W/m²' },
      { name: 'Índice UV', stat: statsBundle.uv_index, unit: 'UVI' },
      { name: 'Presión Relativa (hPa)', stat: statsBundle.pressure_relative, unit: 'hPa' },
      { name: 'Velocidad del Viento (km/h)', stat: statsBundle.wind_speed, unit: 'km/h' },
    ];
  }, [statsBundle]);

  return (
    <div className="space-y-6">
      {/* Encabezado del Módulo */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Análisis Estadístico Meteorológico
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Computación descriptiva, agrupaciones temporales y correlaciones empíricas de la estación Colegio 5085
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/export?format=xlsx"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exportar Excel (XLSX)</span>
            </a>
            <a
              href="/api/export?format=csv"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              <span>Exportar CSV</span>
            </a>
          </div>
        </div>

        {/* Accesos Rápidos de Período Temporal */}
        <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Período:
          </span>
          {quickRanges.map((qr) => (
            <button
              key={qr.id}
              onClick={() => setRange(qr.id)}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                range === qr.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {qr.label}
            </button>
          ))}
        </div>

        {/* Filtro personalizado si se selecciona 'custom' */}
        {range === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 mt-3 p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">Desde:</label>
              <input
                type="datetime-local"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-500 font-medium">Hasta:</label>
              <input
                type="datetime-local"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-800 dark:text-slate-200 font-mono"
              />
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded"
            >
              Aplicar Rango
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Calculando estadísticas y métricas del período...</p>
        </div>
      ) : statsBundle ? (
        <>
          {/* TABLA PRINCIPAL DE ESTADÍSTICAS DESCRIPTIVAS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-sky-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Tabla de Estadísticas Descriptivas
                </h2>
              </div>
              <div className="text-xs text-slate-500 font-mono">
                Total observaciones analizadas: <strong className="text-slate-800 dark:text-slate-200">{statsBundle.total_observations}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-3">Variable</th>
                    <th className="py-2.5 px-3 text-right">Observadas</th>
                    <th className="py-2.5 px-3 text-right">Faltantes</th>
                    <th className="py-2.5 px-3 text-right">Promedio (Media)</th>
                    <th className="py-2.5 px-3 text-right">Mediana</th>
                    <th className="py-2.5 px-3 text-right">Mínimo (Fecha/Hora)</th>
                    <th className="py-2.5 px-3 text-right">Máximo (Fecha/Hora)</th>
                    <th className="py-2.5 px-3 text-right">Rango</th>
                    <th className="py-2.5 px-3 text-right">Desv. Estándar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                  {statsTableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                        {row.stat.count}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-400">
                        {row.stat.missing}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">
                        {row.stat.mean !== null ? `${row.stat.mean} ${row.unit}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-700 dark:text-slate-200">
                        {row.stat.median !== null ? `${row.stat.median} ${row.unit}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-sky-600 dark:text-sky-400">
                        {row.stat.min ? (
                          <span title={`Registrado: ${row.stat.min.observed_at}`}>
                            {row.stat.min.value} {row.unit} <span className="text-[10px] text-slate-400">({row.stat.min.observed_at.split(' ')[1] || ''})</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400">
                        {row.stat.max ? (
                          <span title={`Registrado: ${row.stat.max.observed_at}`}>
                            {row.stat.max.value} {row.unit} <span className="text-[10px] text-slate-400">({row.stat.max.observed_at.split(' ')[1] || ''})</span>
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-300">
                        {row.stat.range !== null ? `${row.stat.range} ${row.unit}` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {row.stat.std_dev !== null ? `±${row.stat.std_dev}` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ESTADÍSTICAS CIRCULARES DEL VIENTO Y ANÁLISIS DE PRECIPITACIONES */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Viento Circular */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Estadística Circular del Viento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Promedio vectorial estricto que elimina el error de media aritmética en la discontinuidad 0°/360°
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Rumbo Medio Circular</div>
                  <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {statsBundle.wind.cardinal_mean} ({statsBundle.wind.circular_mean_deg !== null ? `${statsBundle.wind.circular_mean_deg}°` : '—'})
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Ráfaga Máxima Período</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {statsBundle.wind.max_gust_kmh !== null ? `${statsBundle.wind.max_gust_kmh} km/h` : '—'}
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Velocidad máxima sostenida:</span>
                  <strong className="font-mono">{statsBundle.wind.max_speed_kmh} km/h</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Porcentaje de calma (0 km/h):</span>
                  <strong className="font-mono">{statsBundle.wind.calm_pct}%</strong>
                </div>
              </div>
            </div>

            {/* Precipitaciones */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Comportamiento de Precipitaciones
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Diferenciación entre intensidades instantáneas (mm/h) y acumulaciones por evento
              </p>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Lluvia Acumulada Período</div>
                  <div className="text-lg font-bold text-teal-600 dark:text-teal-400 mt-1">
                    {statsBundle.precipitation.daily_accumulation_mm} mm
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Intensidad Máxima (Rate)</div>
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {statsBundle.precipitation.max_rate_mmh} mm/h
                  </div>
                </div>
              </div>

              <div className="text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Intervalos con lluvia activa:</span>
                  <strong className="font-mono">{statsBundle.precipitation.rain_intervals_count}</strong>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Distribución del cielo:</span>
                  <span className="text-slate-500">
                    Soleado: {statsBundle.sky_distribution.soleado} · Seminublado: {statsBundle.sky_distribution.seminublado} · Nublado: {statsBundle.sky_distribution.nublado}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CORRELACIONES CIENTÍFICAS */}
          {correlations && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-2">
                <ArrowUpDown className="w-4 h-4 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Correlaciones Empíricas (Coeficiente de Pearson r)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Cálculo de acoplamiento estadístico entre variables atmosféricas.
                <em className="text-amber-600 dark:text-amber-400 font-semibold ml-1">
                  Nota científica: Una correlación matemática no prueba causalidad física directa.
                </em>
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temperatura vs Humedad Relativa
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    r = {correlations.temp_humidity?.r ?? 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {correlations.temp_humidity?.interpretation}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Temperatura vs Déficit Presión Vapor (VPD)
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    r = {correlations.temp_vpd?.r ?? 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {correlations.temp_vpd?.interpretation}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="font-sans font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Radiación Solar vs Temperatura
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    r = {correlations.solar_temp?.r ?? 'N/A'}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {correlations.solar_temp?.interpretation}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
};
