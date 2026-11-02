/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Generador y Exportador de Informes Meteorológicos Institucionales
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
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import type { PeriodStatsBundle, WeatherObservation, StationConfig } from '../types/weather.ts';
import { fetchStats, fetchObservations, fetchStationStatus } from '../lib/api.ts';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export const ReportsView: React.FC = () => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [station, setStation] = useState<StationConfig | null>(null);
  const [stats, setStats] = useState<PeriodStatsBundle | null>(null);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadReportData() {
      setLoading(true);
      try {
        const stationRes = await fetchStationStatus();
        setStation(stationRes.station);

        let rangeParam = '24h';
        if (reportType === 'weekly') rangeParam = '7d';
        if (reportType === 'monthly') rangeParam = 'current_month';
        if (reportType === 'yearly') rangeParam = 'current_year';

        const [statsRes, obsRes] = await Promise.all([
          fetchStats({ range: rangeParam }),
          fetchObservations({ range: rangeParam }),
        ]);

        setStats(statsRes.stats);
        setObservations(obsRes);
      } catch (err) {
        console.error('Error al generar informe:', err);
      } finally {
        setLoading(false);
      }
    }

    loadReportData();
  }, [reportType]);

  const reportTitles: Record<ReportType, string> = {
    daily: 'Informe Meteorológico Diario',
    weekly: 'Informe Meteorológico Semanal',
    monthly: 'Informe Climatológico Mensual',
    yearly: 'Balance Meteorológico Anual',
  };

  // Exportar PDF institucional con jsPDF
  const exportPdf = () => {
    if (!stats || !station) return;

    const doc = new jsPDF();
    const margin = 15;
    let y = 20;

    // Encabezado institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('COLEGIO SECUNDARIO N.º 5085 «DR. MARIANO MORENO»', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('General Güemes, Salta, Argentina · Lat: -24.6708, Lon: -65.0498 · Alt: 695 msnm', margin, y);
    y += 5;
    doc.text(`Estación Meteorológica Automática Ecowitt ID: ${station.ecowitt_station_id}`, margin, y);
    y += 8;

    // Título del informe
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(2, 132, 199); // sky-600
    doc.text(`${reportTitles[reportType].toUpperCase()}`, margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Fecha de emisión: ${new Date().toLocaleString('es-AR')} | Observaciones analizadas: ${stats.total_observations}`, margin, y);
    y += 4;
    doc.text(`Período cubierto: ${stats.first_observation} hasta ${stats.last_observation}`, margin, y);
    y += 10;

    // Línea separadora
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, y, 200 - margin, y);
    y += 8;

    // Resumen Ejecutivo de Temperaturas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. RÉGIMEN TÉRMICO Y SENSACIÓN', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Temperatura Media: ${stats.temperature.mean ?? 'N/A'} °C`, margin + 4, y);
    y += 5;
    doc.text(`• Temperatura Mínima: ${stats.temperature.min?.value ?? 'N/A'} °C (registrada: ${stats.temperature.min?.observed_at ?? 'N/A'})`, margin + 4, y);
    y += 5;
    doc.text(`• Temperatura Máxima: ${stats.temperature.max?.value ?? 'N/A'} °C (registrada: ${stats.temperature.max?.observed_at ?? 'N/A'})`, margin + 4, y);
    y += 5;
    doc.text(`• Sensación Térmica Media: ${stats.feels_like.mean ?? 'N/A'} °C (Extremos: ${stats.feels_like.min?.value ?? 'N/A'} a ${stats.feels_like.max?.value ?? 'N/A'} °C)`, margin + 4, y);
    y += 5;
    doc.text(`• Punto de Rocío Medio: ${stats.dew_point.mean ?? 'N/A'} °C`, margin + 4, y);
    y += 9;

    // Régimen de Humedad y Presión
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. HUMEDAD, VPD Y PRESIÓN BAROMÉTRICA', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Humedad Relativa Media: ${stats.humidity.mean ?? 'N/A'} % (Mín: ${stats.humidity.min?.value ?? 'N/A'}% / Máx: ${stats.humidity.max?.value ?? 'N/A'}%)`, margin + 4, y);
    y += 5;
    doc.text(`• Déficit de Presión de Vapor (VPD) Medio: ${stats.vpd.mean ?? 'N/A'} kPa`, margin + 4, y);
    y += 5;
    doc.text(`• Presión Relativa Media: ${stats.pressure_relative.mean ?? 'N/A'} hPa (Rango: ${stats.pressure_relative.min?.value ?? 'N/A'} a ${stats.pressure_relative.max?.value ?? 'N/A'} hPa)`, margin + 4, y);
    y += 9;

    // Vientos y Precipitaciones
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. DINÁMICA DE VIENTOS Y PRECIPITACIONES', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Rumbo Medio Circular del Viento: ${stats.wind.cardinal_mean} (${stats.wind.circular_mean_deg ?? '—'}°)`, margin + 4, y);
    y += 5;
    doc.text(`• Velocidad Media: ${stats.wind_speed.mean ?? 'N/A'} km/h | Ráfaga Máxima: ${stats.wind.max_gust_kmh ?? 'N/A'} km/h`, margin + 4, y);
    y += 5;
    doc.text(`• Lluvia Acumulada: ${stats.precipitation.daily_accumulation_mm} mm | Intensidad Máxima: ${stats.precipitation.max_rate_mmh} mm/h`, margin + 4, y);
    y += 9;

    // Radiación y UV
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('4. RADIACIÓN SOLAR E ÍNDICE ULTRAVIOLETA', margin, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(`• Radiación Solar Máxima: ${stats.solar_radiation.max?.value ?? 'N/A'} W/m² (registrada: ${stats.solar_radiation.max?.observed_at ?? 'N/A'})`, margin + 4, y);
    y += 5;
    doc.text(`• Índice UV Máximo Registrado: ${stats.uv_index.max?.value ?? 'N/A'} UVI`, margin + 4, y);
    y += 12;

    // Pie de página institucional
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Documento oficial generado automáticamente por la plataforma Proyecto Estación Meteorológica Colegio 5085.', margin, y);
    y += 4;
    doc.text('Fuente oficial de datos: INTA Salta / Colegio Secundario N.º 5085 «Dr. Mariano Moreno» (General Güemes, Salta).', margin, y);

    doc.save(`informe_meteorologico_${reportType}_5085.pdf`);
  };

  // Exportar Excel
  const exportExcel = () => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Informe');
    XLSX.writeFile(wb, `informe_${reportType}_colegio5085.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Selector de tipo de informe */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Informes Meteorológicos Oficiales
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generación de balances climatológicos institucionales para el Colegio 5085 «Dr. Mariano Moreno»
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPdf}
              disabled={loading || !stats}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar PDF</span>
            </button>

            <button
              onClick={exportExcel}
              disabled={loading || observations.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Descargar Excel</span>
            </button>
          </div>
        </div>

        {/* Pestañas de tipo de informe */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          {(['daily', 'weekly', 'monthly', 'yearly'] as ReportType[]).map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                reportType === type
                  ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {reportTitles[type]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <p className="text-xs text-slate-500">Compilando datos del informe...</p>
        </div>
      ) : stats ? (
        /* HOJA DEL INFORME CON MAQUETACIÓN INSTITUCIONAL FORMAL */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 shadow-xs max-w-4xl mx-auto font-sans">
          {/* Membrete Oficial */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-5 mb-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  República Argentina · Provincia de Salta · Ministerio de Educación
                </span>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  Colegio Secundario N.º 5085 «Dr. Mariano Moreno»
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sarmiento 351, General Güemes, Salta · Estación Automática Ecowitt ID 364053
                </p>
              </div>

              <div className="text-right text-xs text-slate-500 font-mono">
                <div>Emisión: {new Date().toLocaleDateString('es-AR')}</div>
                <div className="text-[11px] text-emerald-600 font-semibold">Fuente: INTA Salta / EMA 5085</div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                {reportTitles[reportType]}
              </span>
              <span className="text-slate-500 font-mono">
                Registros analizados: <strong className="text-slate-900 dark:text-white">{stats.total_observations}</strong> · Desde: {stats.first_observation} hasta {stats.last_observation}
              </span>
            </div>
          </div>

          {/* Bloques del Informe */}
          <div className="space-y-6 text-xs">
            {/* 1. Régimen Térmico */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                1. Régimen Térmico y Sensación
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Temperatura Media</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {stats.temperature.mean ?? '—'} °C
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Mínima Absoluta</div>
                  <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {stats.temperature.min?.value ?? '—'} °C
                  </div>
                  <div className="text-[10px] text-slate-400">{stats.temperature.min?.observed_at}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Máxima Absoluta</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {stats.temperature.max?.value ?? '—'} °C
                  </div>
                  <div className="text-[10px] text-slate-400">{stats.temperature.max?.observed_at}</div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Sensación Térmica Media</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {stats.feels_like.mean ?? '—'} °C
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Humedad y Presión */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                2. Humedad, Punto de Rocío y Presión Barométrica
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Humedad Media</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {stats.humidity.mean ?? '—'} %
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Punto de Rocío Medio</div>
                  <div className="text-base font-bold text-teal-600 dark:text-teal-400 mt-1">
                    {stats.dew_point.mean ?? '—'} °C
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">VPD Medio</div>
                  <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {stats.vpd.mean ?? '—'} kPa
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Presión Relativa Media</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {stats.pressure_relative.mean ?? '—'} hPa
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Viento y Lluvia */}
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                3. Dinámica del Viento y Precipitaciones
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Rumbo Predominante</div>
                  <div className="text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {stats.wind.cardinal_mean} ({stats.wind.circular_mean_deg ?? '—'}°)
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Ráfaga Máxima</div>
                  <div className="text-base font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {stats.wind.max_gust_kmh ?? '—'} km/h
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Lluvia Acumulada</div>
                  <div className="text-base font-bold text-sky-600 dark:text-sky-400 mt-1">
                    {stats.precipitation.daily_accumulation_mm} mm
                  </div>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="text-slate-400 text-[11px]">Intensidad Máxima</div>
                  <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {stats.precipitation.max_rate_mmh} mm/h
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Pie de Firma Institucional */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-slate-500 text-[11px] gap-2">
            <span>Proyecto Estación Meteorológica Colegio 5085 · Versión Oficial</span>
            <span>Verificación digital: Registros originales auditados en base de datos PostgreSQL</span>
          </div>
        </div>
      ) : null}
    </div>
  );
};
