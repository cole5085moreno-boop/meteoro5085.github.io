/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Generador y Exportador de Reportes Meteorológicos Consolidados en PDF
 * Ubicación: General Güemes, Salta, Argentina (Lat -24.6708, Long -65.0498 · 695 msnm)
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  CheckCircle,
  FileSpreadsheet,
  Printer,
  Sparkles,
  Sliders,
  CheckSquare,
  Square,
  RefreshCw,
  Info,
  Clock,
  Layers,
  Table,
  Thermometer,
  CloudRain,
  Wind,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { PeriodStatsBundle, WeatherObservation, StationConfig } from '../types/weather.ts';
import { fetchStats, fetchObservations, fetchStationStatus } from '../lib/api.ts';
import { generateConsolidatedPDF, type ReportOptions } from '../lib/pdf-report-generator.ts';

type PeriodPreset = '24h' | '7d' | '30d' | 'current_month' | 'current_year' | 'custom';

export const ReportsView: React.FC = () => {
  // Configuración de Fechas y Rango
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('24h');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Configuración de Opciones del Reporte Consolidado
  const [reportTitle, setReportTitle] = useState<string>('Reporte Meteorológico y Climatológico Consolidado');
  const [applicant, setApplicant] = useState<string>('Colegio Secundario N.º 5085 «Dr. Mariano Moreno»');
  const [notes, setNotes] = useState<string>(
    'Reporte emitido con fines pedagógicos, de monitoreo ambiental y agronómico para la comunidad educativa de General Güemes y el Valle de Siancas.'
  );

  // Checkboxes de Selección de Datos y Módulos a Incluir en el PDF
  const [includeExecutiveSummary, setIncludeExecutiveSummary] = useState<boolean>(true);
  const [includeStatsTable, setIncludeStatsTable] = useState<boolean>(true);
  const [includeThermal, setIncludeThermal] = useState<boolean>(true);
  const [includeHumidityPressure, setIncludeHumidityPressure] = useState<boolean>(true);
  const [includeWind, setIncludeWind] = useState<boolean>(true);
  const [includePrecipitation, setIncludePrecipitation] = useState<boolean>(true);
  const [includeRadiationUV, setIncludeRadiationUV] = useState<boolean>(true);
  const [includeObservationsSample, setIncludeObservationsSample] = useState<boolean>(true);

  // Estados de Datos
  const [station, setStation] = useState<StationConfig | null>(null);
  const [stats, setStats] = useState<PeriodStatsBundle | null>(null);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [generatingPdf, setGeneratingPdf] = useState<boolean>(false);
  const [pdfSuccessMessage, setPdfSuccessMessage] = useState<string | null>(null);

  // Cargar datos según el período seleccionado
  const loadData = async () => {
    setLoading(true);
    setPdfSuccessMessage(null);
    try {
      const stationRes = await fetchStationStatus();
      setStation(stationRes.station);

      const params: any = {};
      if (periodPreset === 'custom') {
        if (customStart) params.start = customStart;
        if (customEnd) params.end = customEnd;
      } else {
        params.range = periodPreset;
      }

      const [statsRes, obsRes] = await Promise.all([
        fetchStats(params),
        fetchObservations(params),
      ]);

      setStats(statsRes.stats);
      setObservations(obsRes);
    } catch (err) {
      console.error('Error al compilar datos para el informe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [periodPreset]);

  // Manejar Generación y Descarga de PDF Consolidado
  const handleExportPDF = () => {
    if (!stats) return;

    setGeneratingPdf(true);
    try {
      const options: ReportOptions = {
        title: reportTitle.trim() || 'Reporte Meteorológico Consolidado',
        applicant: applicant.trim() || 'Colegio Secundario N.º 5085',
        notes: notes.trim(),
        includeExecutiveSummary,
        includeStatsTable,
        includeThermal,
        includeHumidityPressure,
        includeWind,
        includePrecipitation,
        includeRadiationUV,
        includeObservationsSample,
      };

      generateConsolidatedPDF(stats, station, observations, options);
      setPdfSuccessMessage('¡Reporte consolidado en PDF generado y descargado correctamente!');
      setTimeout(() => setPdfSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setGeneratingPdf(false);
    }
  };

  // Exportar Excel
  const handleExportExcel = () => {
    if (!observations.length) return;
    const rows = observations.map((o) => ({
      'Fecha y Hora': o.observed_at,
      'Temperatura (°C)': o.temperature_c ?? '',
      'Sensación (°C)': o.feels_like_c ?? '',
      'Punto Rocío (°C)': o.dew_point_c ?? '',
      'Humedad (%)': o.relative_humidity_pct ?? '',
      'VPD (kPa)': o.vapor_pressure_deficit_kpa ?? '',
      'Radiación (W/m²)': o.solar_radiation_wm2 ?? '',
      'Índice UV': o.uv_index ?? '',
      'Lluvia Diaria (mm)': o.precipitation_daily_mm ?? '',
      'Viento (km/h)': o.wind_speed_kmh ?? '',
      'Ráfaga (km/h)': o.wind_gust_kmh ?? '',
      'Rumbo (°)': o.wind_direction_deg ?? '',
      'Presión (hPa)': o.pressure_relative_hpa ?? '',
      'Estado Cielo': o.sky_condition,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(wb, `datos_meteorologicos_colegio5085_${periodPreset}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado Principal del Módulo de Informes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Generador de Reportes Meteorológicos Consolidados</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  Formato PDF Oficial
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Genera, personaliza y descarga informes meteorológicos consolidados con resúmenes estadísticos completos para el Colegio 5085
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportPDF}
              disabled={loading || !stats || generatingPdf}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {generatingPdf ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Descargar Reporte en PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              disabled={loading || !stats}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              title="Imprimir versión web"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={handleExportExcel}
              disabled={loading || observations.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Excel (XLSX)</span>
            </button>
          </div>
        </div>

        {/* Mensaje de Éxito al Generar PDF */}
        {pdfSuccessMessage && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200 font-medium">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{pdfSuccessMessage}</span>
          </div>
        )}

        {/* Selector de Período Temporal */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-sky-600" />
            Período de Datos:
          </span>
          {[
            { id: '24h', label: 'Últimas 24 Horas' },
            { id: '7d', label: 'Últimos 7 Días' },
            { id: '30d', label: 'Últimos 30 Días' },
            { id: 'current_month', label: 'Mes Actual' },
            { id: 'current_year', label: 'Año Actual' },
            { id: 'custom', label: 'Rango Personalizado' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setPeriodPreset(preset.id as PeriodPreset)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                periodPreset === preset.id
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Inputs de Rango Personalizado */}
        {periodPreset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 mt-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg text-xs border border-slate-200 dark:border-slate-800">
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
              className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded cursor-pointer"
            >
              Aplicar Rango
            </button>
          </div>
        )}
      </div>

      {/* PANEL DE CONFIGURACIÓN Y PERSONALIZACIÓN DEL REPORTE CONSOLIDADO */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Personalización y Selección de Contenidos a Consolidar en el PDF
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Marca las secciones y resúmenes que deseas incluir en el documento oficial
          </span>
        </div>

        {/* Checkboxes de Selección de Datos y Módulos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs mb-5">
          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeExecutiveSummary}
              onChange={(e) => setIncludeExecutiveSummary(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Resumen Ejecutivo (KPIs)</span>
              <span className="text-[11px] text-slate-500">Métricas clave, T. media, lluvia acumulada y ráfaga</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeStatsTable}
              onChange={(e) => setIncludeStatsTable(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Tabla Estadística Completa</span>
              <span className="text-[11px] text-slate-500">Media, Mediana, Mínimos, Máximos, Rango y Desvío</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeThermal}
              onChange={(e) => setIncludeThermal(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Régimen Térmico y Sensación</span>
              <span className="text-[11px] text-slate-500">Temperatura, sensación térmica y punto de rocío</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeHumidityPressure}
              onChange={(e) => setIncludeHumidityPressure(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Humedad, VPD y Presión</span>
              <span className="text-[11px] text-slate-500">Presión de vapor, humedad relativa y barómetro</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeWind}
              onChange={(e) => setIncludeWind(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Dinámica del Viento</span>
              <span className="text-[11px] text-slate-500">Promedio circular vectorial y ráfagas</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includePrecipitation}
              onChange={(e) => setIncludePrecipitation(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Precipitaciones y Cielo</span>
              <span className="text-[11px] text-slate-500">Lluvia acumulada, tasa instantánea y nubosidad</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeRadiationUV}
              onChange={(e) => setIncludeRadiationUV(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Radiación Solar e Índice UV</span>
              <span className="text-[11px] text-slate-500">Irradiancia W/m² y UVI máximo OMS</span>
            </div>
          </label>

          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeObservationsSample}
              onChange={(e) => setIncludeObservationsSample(e.target.checked)}
              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
            />
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Muestra de Observaciones</span>
              <span className="text-[11px] text-slate-500">Tabla cronológica de últimas observaciones</span>
            </div>
          </label>
        </div>

        {/* Campos de Personalización de Textos del Reporte */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Título del Reporte:
            </label>
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="Ej. Reporte Meteorológico Consolidado"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Solicitante / Docente o Institución a cargo:
            </label>
            <input
              type="text"
              value={applicant}
              onChange={(e) => setApplicant(e.target.value)}
              placeholder="Ej. Departamento de Ciencias Naturales / Prof. Mariano Moreno"
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Dictamen / Notas u Observaciones Conclusivas del Reporte:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escribe conclusiones o comentarios pedagógicos que se imprimirán en el dictamen final del PDF..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* VISTA PREVIA EN VIVO (LIVE PREVIEW) DEL REPORTE CONSOLIDADO */}
      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <RefreshCw className="w-6 h-6 animate-spin text-sky-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Compilando datos y calculando resúmenes estadísticos...</p>
        </div>
      ) : stats ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xs max-w-4xl mx-auto font-sans relative">
          {/* Barra de color institucional superior */}
          <div className="h-1.5 bg-sky-600 rounded-t-lg -mt-8 -mx-8 mb-6" />

          {/* Membrete Oficial Institucional */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  República Argentina · Provincia de Salta · Ministerio de Educación
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Colegio Secundario N.º 5085 «Dr. Mariano Moreno»
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sarmiento 351, General Güemes, Salta · Lat -24.6708, Long -65.0498 · 695 msnm
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Estación Automática Ecowitt ID {station?.ecowitt_station_id || '364053'} · Red Oficial INTA Salta / EMA 5085
                </p>
              </div>

              <div className="text-left sm:text-right text-xs text-slate-500 font-mono">
                <div>Fecha de Emisión: <strong>{new Date().toLocaleDateString('es-AR')}</strong></div>
                <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">
                  Estado: Auditoría Verificada
                </div>
              </div>
            </div>

            {/* Caja de Metadatos del Reporte */}
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between text-xs gap-2">
              <div>
                <span className="font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide block">
                  {reportTitle}
                </span>
                <span className="text-slate-500 text-[11px]">
                  Solicitante: <strong>{applicant}</strong>
                </span>
              </div>
              <div className="text-slate-600 dark:text-slate-300 font-mono text-right text-[11px]">
                <div>Total Registros: <strong className="text-slate-900 dark:text-white">{stats.total_observations}</strong></div>
                <div className="text-slate-400">Desde: {stats.first_observation} | Hasta: {stats.last_observation}</div>
              </div>
            </div>
          </div>

          {/* CONTENIDOS DEL REPORTE CONSOLIDADO */}
          <div className="space-y-6 text-xs">
            {/* 1. Resumen Ejecutivo (KPI Cards) */}
            {includeExecutiveSummary && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2.5 flex items-center gap-1.5">
                  <span>1. Resumen Ejecutivo Consolidado del Período</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px] font-sans">Temperatura Media</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                      {stats.temperature.mean ?? '—'} °C
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">Normal: ~20.6 °C</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px] font-sans">Extremos Térmicos</div>
                    <div className="text-sm font-bold mt-1">
                      <span className="text-sky-600 dark:text-sky-400">Mín: {stats.temperature.min?.value ?? '—'}°</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-rose-600 dark:text-rose-400">Máx: {stats.temperature.max?.value ?? '—'}°</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">Amplitud: {stats.temperature.range ?? '—'} °C</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px] font-sans">Lluvia Acumulada</div>
                    <div className="text-lg font-bold text-sky-600 dark:text-sky-400 mt-1">
                      {stats.precipitation.daily_accumulation_mm ?? 0} mm
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">Tasa máx: {stats.precipitation.max_rate_mmh ?? 0} mm/h</div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="text-slate-400 text-[11px] font-sans">Ráfaga Máx. / UVI</div>
                    <div className="text-sm font-bold mt-1">
                      <span className="text-amber-600">{stats.wind.max_gust_kmh ?? '—'} km/h</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-purple-600">UV {stats.uv_index.max?.value ?? '—'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">Rumbo: {stats.wind.cardinal_mean}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tabla Consolidada de Estadísticas Descriptivas */}
            {includeStatsTable && (
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-sky-600" />
                  <span>2. Tabla Consolidada de Estadísticas Descriptivas</span>
                </h3>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-800 text-white uppercase text-[10px] font-sans">
                      <tr>
                        <th className="py-2 px-3">Variable Meteorológica</th>
                        <th className="py-2 px-2 text-right">Obs.</th>
                        <th className="py-2 px-2 text-right">Promedio (Media)</th>
                        <th className="py-2 px-2 text-right">Mediana</th>
                        <th className="py-2 px-2 text-right">Mínimo (Hora)</th>
                        <th className="py-2 px-2 text-right">Máximo (Hora)</th>
                        <th className="py-2 px-2 text-right">Rango</th>
                        <th className="py-2 px-2 text-right">Desv. Std</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {[
                        { name: 'Temperatura Exterior (°C)', v: stats.temperature, u: '°C' },
                        { name: 'Sensación Térmica (°C)', v: stats.feels_like, u: '°C' },
                        { name: 'Punto de Rocío (°C)', v: stats.dew_point, u: '°C' },
                        { name: 'Humedad Relativa (%)', v: stats.humidity, u: '%' },
                        { name: 'Déficit Presión Vapor (kPa)', v: stats.vpd, u: 'kPa' },
                        { name: 'Presión Relativa (hPa)', v: stats.pressure_relative, u: 'hPa' },
                        { name: 'Velocidad del Viento (km/h)', v: stats.wind_speed, u: 'km/h' },
                        { name: 'Radiación Solar (W/m²)', v: stats.solar_radiation, u: 'W/m²' },
                        { name: 'Índice Ultravioleta (UVI)', v: stats.uv_index, u: '' },
                      ].map((row, idx) => (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-slate-50/50 dark:bg-slate-800/30' : ''}>
                          <td className="py-1.5 px-3 font-sans font-medium text-slate-800 dark:text-slate-200">
                            {row.name}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-500">{row.v.count}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-white">
                            {row.v.mean !== null ? `${row.v.mean} ${row.u}` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-700 dark:text-slate-300">
                            {row.v.median !== null ? `${row.v.median}` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-sky-600 dark:text-sky-400">
                            {row.v.min ? `${row.v.min.value} (${row.v.min.observed_at.split(' ')[1] || ''})` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-rose-600 dark:text-rose-400">
                            {row.v.max ? `${row.v.max.value} (${row.v.max.observed_at.split(' ')[1] || ''})` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-600 dark:text-slate-400">
                            {row.v.range !== null ? `${row.v.range}` : '—'}
                          </td>
                          <td className="py-1.5 px-2 text-right text-slate-500">
                            {row.v.std_dev !== null ? `±${row.v.std_dev}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Régimen Térmico y Sensación */}
            {includeThermal && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-500" />
                  <span>3. Régimen Térmico y Sensación Corporal</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    • <strong>Media:</strong> {stats.temperature.mean ?? 'N/A'} °C | <strong>Mínima:</strong> {stats.temperature.min?.value ?? 'N/A'} °C ({stats.temperature.min?.observed_at ?? ''})
                  </div>
                  <div>
                    • <strong>Máxima:</strong> {stats.temperature.max?.value ?? 'N/A'} °C ({stats.temperature.max?.observed_at ?? ''}) | <strong>Amplitud:</strong> {stats.temperature.range ?? 'N/A'} °C
                  </div>
                  <div>
                    • <strong>Sensación Térmica Media:</strong> {stats.feels_like.mean ?? 'N/A'} °C (Extremos: {stats.feels_like.min?.value ?? 'N/A'} a {stats.feels_like.max?.value ?? 'N/A'} °C)
                  </div>
                  <div>
                    • <strong>Punto de Rocío Medio:</strong> {stats.dew_point.mean ?? 'N/A'} °C (Condensación activa cuando $T \approx T_d$)
                  </div>
                </div>
              </div>
            )}

            {/* 4. Humedad y Presión */}
            {includeHumidityPressure && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-500" />
                  <span>4. Humedad, Déficit de Presión de Vapor (VPD) y Presión Barométrica</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    • <strong>Humedad Relativa Media:</strong> {stats.humidity.mean ?? 'N/A'} % (Rango: {stats.humidity.min?.value ?? 'N/A'}% a {stats.humidity.max?.value ?? 'N/A'}%)
                  </div>
                  <div>
                    • <strong>Déficit de Presión de Vapor (VPD):</strong> {stats.vpd.mean ?? 'N/A'} kPa (Demanda hídrica foliar en el Valle de Siancas)
                  </div>
                  <div>
                    • <strong>Presión Barométrica Relativa:</strong> {stats.pressure_relative.mean ?? 'N/A'} hPa (Nivel normal corregido para Güemes)
                  </div>
                  <div>
                    • <strong>Presión Absoluta:</strong> {stats.pressure_absolute.mean ?? 'N/A'} hPa (Medida real a 695 msnm)
                  </div>
                </div>
              </div>
            )}

            {/* 5. Viento */}
            {includeWind && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-indigo-500" />
                  <span>5. Dinámica Circular del Viento</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    • <strong>Rumbo Medio Circular Vectorial:</strong> {stats.wind.cardinal_mean} ({stats.wind.circular_mean_deg !== null ? `${stats.wind.circular_mean_deg}°` : '—'})
                  </div>
                  <div>
                    • <strong>Velocidad Media Sostenida:</strong> {stats.wind_speed.mean ?? 'N/A'} km/h (Máx sostenida: {stats.wind.max_speed_kmh ?? 'N/A'} km/h)
                  </div>
                  <div>
                    • <strong>Ráfaga Máxima Período:</strong> {stats.wind.max_gust_kmh ?? 'N/A'} km/h
                  </div>
                  <div>
                    • <strong>Porcentaje de Calma (0 km/h):</strong> {stats.wind.calm_pct ?? 0} %
                  </div>
                </div>
              </div>
            )}

            {/* 6. Precipitaciones */}
            {includePrecipitation && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                  <span>6. Comportamiento de Precipitaciones y Nubosidad</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    • <strong>Precipitación Acumulada:</strong> {stats.precipitation.daily_accumulation_mm ?? 0} mm
                  </div>
                  <div>
                    • <strong>Intensidad Máxima (Rain Rate):</strong> {stats.precipitation.max_rate_mmh ?? 0} mm/h
                  </div>
                  <div>
                    • <strong>Intervalos con Lluvia Activa:</strong> {stats.precipitation.rain_intervals_count ?? 0} intervalos
                  </div>
                  <div>
                    • <strong>Distribución del Cielo:</strong> Soleado: {stats.sky_distribution.soleado} · Seminublado: {stats.sky_distribution.seminublado} · Nublado: {stats.sky_distribution.nublado}
                  </div>
                </div>
              </div>
            )}

            {/* 7. Radiación y UV */}
            {includeRadiationUV && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>7. Radiación Solar e Índice Ultravioleta (UVI)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div>
                    • <strong>Radiación Solar Máxima:</strong> {stats.solar_radiation.max?.value ?? 'N/A'} W/m² ({stats.solar_radiation.max?.observed_at ?? ''})
                  </div>
                  <div>
                    • <strong>Índice UV Máximo:</strong> {stats.uv_index.max?.value ?? 'N/A'} UVI (Nivel: {Number(stats.uv_index.max?.value || 0) >= 11 ? 'Extremo' : Number(stats.uv_index.max?.value || 0) >= 8 ? 'Muy Alto' : 'Moderado'})
                  </div>
                </div>
              </div>
            )}

            {/* 8. Muestra Cronológica de Registros */}
            {includeObservationsSample && observations.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>8. Muestra Cronológica de Observaciones Registradas</span>
                </h4>
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase text-[10px] font-sans">
                      <tr>
                        <th className="py-1.5 px-2.5">Fecha y Hora</th>
                        <th className="py-1.5 px-2 text-right">Temp (°C)</th>
                        <th className="py-1.5 px-2 text-right">Sens (°C)</th>
                        <th className="py-1.5 px-2 text-right">HR (%)</th>
                        <th className="py-1.5 px-2 text-right">VPD (kPa)</th>
                        <th className="py-1.5 px-2 text-right">Viento (km/h)</th>
                        <th className="py-1.5 px-2 text-right">Lluvia (mm)</th>
                        <th className="py-1.5 px-2">Cielo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {observations.slice(-10).reverse().map((o, i) => (
                        <tr key={i} className="hover:bg-slate-50/50">
                          <td className="py-1.5 px-2.5 text-slate-600 dark:text-slate-400">{o.observed_at}</td>
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900 dark:text-white">{o.temperature_c ?? '—'}</td>
                          <td className="py-1.5 px-2 text-right text-slate-600 dark:text-slate-400">{o.feels_like_c ?? '—'}</td>
                          <td className="py-1.5 px-2 text-right text-sky-600">{o.relative_humidity_pct ?? '—'}%</td>
                          <td className="py-1.5 px-2 text-right text-slate-600">{o.vapor_pressure_deficit_kpa ?? '—'}</td>
                          <td className="py-1.5 px-2 text-right text-slate-700 dark:text-slate-300">{o.wind_speed_kmh ?? '0'}</td>
                          <td className="py-1.5 px-2 text-right text-sky-600 font-bold">{o.precipitation_daily_mm ?? '0'}</td>
                          <td className="py-1.5 px-2 font-sans text-slate-600">{o.sky_condition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 9. Dictamen y Observaciones del Docente / Operador */}
            {notes.trim() && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-slate-900 dark:text-white mb-1">
                  9. Dictamen / Observaciones Conclusivas
                </h4>
                <p className="text-slate-600 dark:text-slate-300 italic text-[11px] leading-relaxed">
                  "{notes}"
                </p>
              </div>
            )}
          </div>

          {/* Pie de Firma Institucional */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 text-[11px] gap-2">
            <span>Proyecto Estación Meteorológica Colegio 5085 · Documento Institucional Certificado</span>
            <span className="font-mono">Verificación Digital: Ecowitt ID {station?.ecowitt_station_id || '364053'} / PostgreSQL</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
