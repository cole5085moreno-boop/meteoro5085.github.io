/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Sección de Climatología Histórica y Tendencias Anuales con D3.js
 * Ubicación: General Güemes, Salta, Argentina (Lat -24.6708, Long -65.0498 · 695 msnm)
 */

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  TrendingUp,
  Download,
  Filter,
  BarChart3,
  Thermometer,
  CloudRain,
  Sun,
  Droplets,
  Layers,
  Sparkles,
  Info,
  Flame,
  Snowflake,
  Activity,
} from 'lucide-react';
import {
  filterClimatologyRecords,
  aggregateMonthlyClimatology,
  calculateAnnualTrends,
  HISTORICAL_CLIMATOLOGY_SERIES,
  type DailyClimatologyRecord,
} from '../lib/historical-climatology-data.ts';
import { D3TimeSeriesChart } from './d3/D3TimeSeriesChart.tsx';
import { D3ClimogramChart } from './d3/D3ClimogramChart.tsx';
import { D3AnomalyChart } from './d3/D3AnomalyChart.tsx';

export const HistoricalClimatologySection: React.FC = () => {
  // Rango de fechas por defecto: Año 2024 a 2026
  const [startDate, setStartDate] = useState<string>('2024-01-01');
  const [endDate, setEndDate] = useState<string>('2026-11-06');
  const [selectedVariable, setSelectedVariable] = useState<'temp' | 'precip' | 'humidity' | 'solar'>('temp');
  const [showMovingAverage, setShowMovingAverage] = useState<boolean>(true);
  const [activeChartTab, setActiveChartTab] = useState<'series' | 'climogram' | 'anomalies'>('series');

  // Filtrado de la serie histórica
  const filteredData = useMemo(() => {
    return filterClimatologyRecords(startDate, endDate);
  }, [startDate, endDate]);

  // Agregación mensual para el climograma y anomalías
  const monthlyData = useMemo(() => {
    return aggregateMonthlyClimatology(filteredData);
  }, [filteredData]);

  // Resumen estadístico del período seleccionado
  const summaryKPIs = useMemo(() => {
    if (filteredData.length === 0) {
      return {
        avgTemp: 0,
        maxTemp: 0,
        maxTempDate: '',
        minTemp: 0,
        minTempDate: '',
        totalPrecip: 0,
        avgHumidity: 0,
        frostDays: 0,
        heatDays: 0,
      };
    }

    const tempSum = filteredData.reduce((acc, cur) => acc + cur.temp_mean, 0);
    const precipSum = filteredData.reduce((acc, cur) => acc + cur.precipitation_mm, 0);
    const humSum = filteredData.reduce((acc, cur) => acc + cur.relative_humidity, 0);

    let maxT = filteredData[0].temp_max;
    let maxDate = filteredData[0].date;
    let minT = filteredData[0].temp_min;
    let minDate = filteredData[0].date;
    let frost = 0;
    let heat = 0;

    for (const d of filteredData) {
      if (d.temp_max > maxT) {
        maxT = d.temp_max;
        maxDate = d.date;
      }
      if (d.temp_min < minT) {
        minT = d.temp_min;
        minDate = d.date;
      }
      if (d.is_frost) frost++;
      if (d.is_heatwave_day) heat++;
    }

    return {
      avgTemp: Number((tempSum / filteredData.length).toFixed(1)),
      maxTemp: maxT,
      maxTempDate: maxDate,
      minTemp: minT,
      minTempDate: minDate,
      totalPrecip: Number(precipSum.toFixed(1)),
      avgHumidity: Math.round(humSum / filteredData.length),
      frostDays: frost,
      heatDays: heat,
    };
  }, [filteredData]);

  // Presets rápidos de fechas
  const handlePreset = (preset: string) => {
    switch (preset) {
      case '2026':
        setStartDate('2026-01-01');
        setEndDate('2026-11-06');
        break;
      case '2025':
        setStartDate('2025-01-01');
        setEndDate('2025-12-31');
        break;
      case '2024':
        setStartDate('2024-01-01');
        setEndDate('2024-12-31');
        break;
      case 'last3y':
        setStartDate('2024-01-01');
        setEndDate('2026-11-06');
        break;
      case 'all':
        setStartDate('2021-01-01');
        setEndDate('2026-11-06');
        break;
    }
  };

  // Exportar datos a CSV
  const handleExportCSV = () => {
    const headers = 'Fecha,Año,Mes,Dia,Temp_Media,Temp_Max,Temp_Min,Amplitud,Precipitacion_mm,Humedad_pct,Radiacion_wm2,UV,Viento_kmh,Presion_hpa\n';
    const rows = filteredData
      .map(
        (r) =>
          `${r.date},${r.year},${r.month},${r.day},${r.temp_mean},${r.temp_max},${r.temp_min},${r.temp_range},${r.precipitation_mm},${r.relative_humidity},${r.solar_radiation},${r.uv_index},${r.wind_speed},${r.pressure_hpa}`
      )
      .join('\n');

    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `climatologia_historica_guemes_${startDate}_${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Panel Superior: Selector de Rango de Fechas y Controles */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-600" />
              <span>Climatología Histórica y Tendencias Anuales (D3.js)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Visualización interactiva con D3.js para análisis de series temporales, climogramas de Walter-Lieth y anomalías en General Güemes
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors self-start lg:self-auto cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Descargar Serie CSV ({filteredData.length} días)</span>
          </button>
        </div>

        {/* Filtros de Rango de Fechas */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Selectores de calendario */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Rango de Fechas:</span>
            </span>

            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-700 font-mono">
              <label className="text-[11px] text-slate-400 pl-1">Desde:</label>
              <input
                type="date"
                value={startDate}
                min="2021-01-01"
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs"
              />

              <label className="text-[11px] text-slate-400 pl-1">Hasta:</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max="2026-11-06"
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Accesos rápidos de año */}
          <div className="flex flex-wrap items-center gap-1 text-xs">
            <span className="text-slate-400 mr-1 text-[11px]">Accesos rápidos:</span>
            {[
              { id: '2026', label: '2026' },
              { id: '2025', label: '2025' },
              { id: '2024', label: '2024' },
              { id: 'last3y', label: 'Últimos 3 Años' },
              { id: 'all', label: 'Completo (2021-2026)' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handlePreset(p.id)}
                className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tarjetas KPI del Período Seleccionado */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Temperatura Media */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Thermometer className="w-3.5 h-3.5 text-sky-600" />
            <span>Temp. Media</span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
            {summaryKPIs.avgTemp} °C
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Normal: ~20.6 °C
          </div>
        </div>

        {/* Máxima Absoluta */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Flame className="w-3.5 h-3.5 text-rose-500" />
            <span>Máx. Absoluta</span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">
            {summaryKPIs.maxTemp} °C
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={summaryKPIs.maxTempDate}>
            Fecha: {summaryKPIs.maxTempDate}
          </div>
        </div>

        {/* Mínima Absoluta */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Snowflake className="w-3.5 h-3.5 text-cyan-500" />
            <span>Mín. Absoluta</span>
          </div>
          <div className="text-xl font-bold font-mono text-cyan-600 dark:text-cyan-400">
            {summaryKPIs.minTemp} °C
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate" title={summaryKPIs.minTempDate}>
            Fecha: {summaryKPIs.minTempDate}
          </div>
        </div>

        {/* Lluvia Acumulada */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <CloudRain className="w-3.5 h-3.5 text-sky-500" />
            <span>Precipitación</span>
          </div>
          <div className="text-xl font-bold font-mono text-sky-600 dark:text-sky-400">
            {summaryKPIs.totalPrecip} mm
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Total en el período
          </div>
        </div>

        {/* Días con Heladas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Snowflake className="w-3.5 h-3.5 text-indigo-500" />
            <span>Días c/ Helada</span>
          </div>
          <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {summaryKPIs.frostDays}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            T. Mínima ≤ 0°C
          </div>
        </div>

        {/* Días Calor Extremo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Días &gt; 35°C</span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {summaryKPIs.heatDays}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Estrés térmico estival
          </div>
        </div>
      </div>

      {/* Contenedor Principal de Gráficos D3.js */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        {/* Selector de tipo de gráfico D3 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-600" />
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Visualizaciones Interactivas con D3.js:
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveChartTab('series')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'series'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Series y Tendencias
            </button>
            <button
              onClick={() => setActiveChartTab('climogram')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'climogram'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Climograma Walter-Lieth
            </button>
            <button
              onClick={() => setActiveChartTab('anomalies')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'anomalies'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Anomalías Climáticas
            </button>
          </div>
        </div>

        {/* PESTAÑA 1: Gráfico D3 de Series Temporales */}
        {activeChartTab === 'series' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Selector de variable */}
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-500 mr-1 font-semibold">Variable:</span>
                {[
                  { id: 'temp', label: 'Temperatura (°C)' },
                  { id: 'precip', label: 'Precipitación (mm)' },
                  { id: 'humidity', label: 'Humedad (%)' },
                  { id: 'solar', label: 'Radiación (W/m²)' },
                ].map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariable(v.id as any)}
                    className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      selectedVariable === v.id
                        ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>

              {/* Toggle de media móvil */}
              {selectedVariable === 'temp' && (
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showMovingAverage}
                    onChange={(e) => setShowMovingAverage(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Mostrar Media Móvil (Tendencia de 30 días)</span>
                </label>
              )}
            </div>

            {/* Gráfico interactivo D3 */}
            <D3TimeSeriesChart
              data={filteredData}
              variable={selectedVariable}
              showMovingAverage={showMovingAverage}
            />

            {/* Leyenda explicativa para alumnos */}
            {selectedVariable === 'temp' && (
              <div className="flex flex-wrap items-center justify-center gap-6 pt-2 text-xs font-medium text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-orange-500" />
                  <span>Máxima Diaria</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-sky-600" />
                  <span>Media Diaria</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400" />
                  <span>Mínima Diaria</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-2 rounded bg-sky-500/20" />
                  <span>Envolvente Térmica (Amplitud)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-0.5 border-b-2 border-dashed border-rose-500" />
                  <span>Tendencia Anual (Media Móvil)</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: Climograma de Walter-Lieth */}
        {activeChartTab === 'climogram' && (
          <div className="space-y-4">
            <div className="p-3 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-lg text-xs text-sky-900 dark:text-sky-200">
              <span className="font-bold">Fundamento Geográfico y Pedagógico:</span> El climograma de Walter-Lieth utiliza la regla bioclimática de Gaussen (Precipitación $P$ = 2 × Temperatura $T$). Cuando la barra de lluvia queda por debajo de la curva de temperatura ($P &lt; 2T$), se define el <strong className="text-amber-700 dark:text-amber-300">período seco o árido</strong> (invierno en Güemes). Cuando la lluvia supera la curva ($P &gt; 2T$), existe un <strong className="text-sky-700 dark:text-sky-300">período húmedo con superávit hídrico</strong> (verano monzónico).
            </div>

            <D3ClimogramChart monthlyData={monthlyData} />

            <div className="flex items-center justify-center gap-8 pt-2 text-xs font-semibold border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-sky-600" />
                <span className="text-slate-700 dark:text-slate-300">Lluvia Observada (mm)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-sky-300/40 border border-sky-400" />
                <span className="text-slate-700 dark:text-slate-300">Lluvia Normal Histórica (1991-2020)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-1 rounded bg-orange-600" />
                <span className="text-slate-700 dark:text-slate-300">Temperatura Media (°C)</span>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 3: Gráfico de Anomalías Climáticas */}
        {activeChartTab === 'anomalies' && (
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white">Anomalías respecto a la Normal 1991-2020:</span> Los valores positivos (rojo) representan meses más cálidos que la media climatológica de los últimos 30 años; los valores negativos (azul) señalan meses con temperaturas inferiores a la normal.
            </div>

            <D3AnomalyChart monthlyData={monthlyData} />
          </div>
        )}
      </div>

      {/* Tabla Climatológica Mensual Detallada */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
          Resumen Mensual de la Serie Climatológica (General Güemes)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-sans font-semibold">
                <th className="py-2.5 px-3">Mes</th>
                <th className="py-2.5 px-3 text-right">Temp. Media</th>
                <th className="py-2.5 px-3 text-right">Máx. Media</th>
                <th className="py-2.5 px-3 text-right">Mín. Media</th>
                <th className="py-2.5 px-3 text-right">Lluvia Obs.</th>
                <th className="py-2.5 px-3 text-right">Lluvia Normal</th>
                <th className="py-2.5 px-3 text-right">Anomalía Térmica</th>
                <th className="py-2.5 px-3 text-right">Humedad</th>
                <th className="py-2.5 px-3 text-right">Días Helada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {monthlyData.map((m) => (
                <tr key={m.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2 px-3 font-sans font-bold text-slate-900 dark:text-white">
                    {m.monthName}
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                    {m.temp_mean} °C
                  </td>
                  <td className="py-2 px-3 text-right text-orange-600">
                    {m.temp_max_mean} °C
                  </td>
                  <td className="py-2 px-3 text-right text-sky-600">
                    {m.temp_min_mean} °C
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-sky-700 dark:text-sky-300">
                    {m.precipitation_sum} mm
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400">
                    {m.precipitation_normal} mm
                  </td>
                  <td className={`py-2 px-3 text-right font-bold ${m.anomaly_temp >= 0 ? 'text-rose-500' : 'text-cyan-500'}`}>
                    {m.anomaly_temp > 0 ? `+${m.anomaly_temp}` : m.anomaly_temp} °C
                  </td>
                  <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                    {m.humidity_mean}%
                  </td>
                  <td className="py-2 px-3 text-right font-bold text-indigo-600">
                    {m.frost_days_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
