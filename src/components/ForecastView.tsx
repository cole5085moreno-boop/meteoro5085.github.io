/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Componente de Pronóstico Meteorológico e Imágenes Satelitales para General Güemes, Salta
 * Fuente oficial: MSN El Tiempo / Microsoft Bing Weather
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Sun,
  CloudRain,
  Cloud,
  CloudLightning,
  Wind,
  Droplets,
  Gauge,
  Eye,
  RotateCw,
  ExternalLink,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Sunrise,
  Sunset,
  Moon,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Radio,
  Layers,
  ZoomIn,
  Activity,
  AlertCircle,
} from 'lucide-react';
import type { ForecastData, DailyForecastItem } from '../types/forecast.ts';
import { fetchForecastData } from '../lib/api.ts';
import { degreesToCardinal } from '../lib/weather-engine.ts';

interface ForecastViewProps {
  lastSyncTimestamp?: string | null;
  theme?: 'light' | 'dark';
}

export const ForecastView: React.FC<ForecastViewProps> = ({ lastSyncTimestamp }) => {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);
  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [satelliteViewMode, setSatelliteViewMode] = useState<'msn' | 'goes' | 'radar'>('msn');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cargar datos de pronóstico desde el endpoint o fallback
  const loadForecast = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchForecastData(forceRefresh);
      setForecast(data);
    } catch (err: any) {
      console.error('Error al cargar pronóstico:', err);
      setErrorMsg(err.message || 'No se pudo obtener el pronóstico');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    loadForecast(false);
  }, [loadForecast]);

  // Actualizar automáticamente cada vez que se actualice el reporte de datos de la estación principal
  useEffect(() => {
    if (lastSyncTimestamp) {
      loadForecast(true);
    }
  }, [lastSyncTimestamp, loadForecast]);

  // Temporizador de refresco periódico cada 3 minutos
  useEffect(() => {
    const timer = setInterval(() => {
      loadForecast(false);
    }, 3 * 60 * 1000);
    return () => clearInterval(timer);
  }, [loadForecast]);

  // Selector de icono meteorológico según la condición
  const getWeatherIcon = (condition: string, daytime: 'd' | 'n' = 'd') => {
    const c = condition.toLowerCase();
    if (c.includes('tormenta') || c.includes('rayo') || c.includes('eléctric')) {
      return <CloudLightning className="w-5 h-5 text-amber-500" />;
    }
    if (c.includes('lluvia') || c.includes('chubasco') || c.includes('llovizna')) {
      return <CloudRain className="w-5 h-5 text-sky-500" />;
    }
    if (c.includes('nublado') || c.includes('cubierto')) {
      return <Cloud className="w-5 h-5 text-slate-400" />;
    }
    if (c.includes('ventoso') || c.includes('viento')) {
      return <Wind className="w-5 h-5 text-teal-500" />;
    }
    if (c.includes('parcial') || c.includes('variable') || c.includes('algo de sol')) {
      return <CloudSun className="w-5 h-5 text-amber-400" />;
    }
    return daytime === 'n' ? (
      <Moon className="w-5 h-5 text-indigo-400" />
    ) : (
      <Sun className="w-5 h-5 text-amber-500" />
    );
  };

  const formatUpdateTime = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Reciente';
    }
  };

  if (loading && !forecast) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-12 h-12 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Obteniendo pronóstico e imágenes satelitales para General Güemes...
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Consultando telemetría oficial de MSN El Tiempo / Microsoft Bing Weather
        </p>
      </div>
    );
  }

  const current = forecast?.current;
  const days = forecast?.days || [];
  const selectedDay = days[selectedDayIndex] || days[0];
  const almanac = forecast?.almanac;
  const satellite = forecast?.satellite;

  return (
    <div className="space-y-6">
      {/* 1. Header del Pronóstico */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>General Güemes, Salta, Argentina</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">Lat: -24.6745, Long: -65.0468 · 695 msnm</span>
              <span aria-hidden="true">·</span>
              <span className="px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[11px]">
                Valle de Siancas
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <CloudSun className="w-6 h-6 text-amber-500 shrink-0" />
              <span>Pronóstico Meteorológico Oficial e Imágenes Satelitales</span>
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span>Fuente:</span>
              <a
                href={forecast?.source_url}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir página oficial de MSN El Tiempo para General Güemes"
                className="font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1"
              >
                <span>MSN El Tiempo / Bing Weather</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Sincronización activa con cada reporte</span>
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            {forecast?.fetched_at && (
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                Actualizado: {formatUpdateTime(forecast.fetched_at)}
              </span>
            )}

            <button
              onClick={() => loadForecast(true)}
              disabled={refreshing}
              title="Actualizar datos del pronóstico desde MSN El Tiempo"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
              <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg} (mostrando datos de respaldo meteorológico para General Güemes).</span>
          </div>
        )}
      </section>

      {/* 2. Tarjeta Principal: Estado Actual y Resumen de Hoy */}
      {current && (
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card Hero: Temperatura y Condición Actual */}
          <div className="lg:col-span-2 bg-gradient-to-br from-sky-600 via-sky-700 to-indigo-800 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
            {/* Patrón de fondo sutil */}
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none">
              <CloudSun className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-xs font-semibold tracking-wide uppercase">
                    Condición Actual · General Güemes
                  </span>
                  <span className="text-xs font-mono text-sky-100">
                    Estación EMA 5085 & MSN
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-4 mt-3">
                  <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono">
                    {current.temperature_c}°
                  </span>
                  <div className="space-y-0.5">
                    <div className="text-xl font-bold flex items-center gap-2">
                      {getWeatherIcon(current.condition_text)}
                      <span>{current.condition_text}</span>
                    </div>
                    <div className="text-xs text-sky-100">
                      Sensación térmica: <strong>{current.feels_like_c}°C</strong>
                      {days[0] && (
                        <span> · Máx: <strong>{days[0].temp_max_c}°</strong> / Mín: <strong>{days[0].temp_min_c}°</strong></span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Malla de variables actuales de MSN */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/20 text-xs">
                {/* Probabilidad de lluvia */}
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-sky-100 text-[11px]">
                    <CloudRain className="w-3.5 h-3.5 text-sky-300" />
                    <span>Prob. Precipitación</span>
                  </div>
                  <div className="text-base font-bold font-mono mt-1">
                    {current.precipitation_probability_pct}%
                  </div>
                </div>

                {/* Viento */}
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-sky-100 text-[11px]">
                    <Wind className="w-3.5 h-3.5 text-teal-300" />
                    <span>Viento</span>
                  </div>
                  <div className="text-base font-bold font-mono mt-1">
                    {current.wind_speed_kmh} <span className="text-[11px] font-normal">km/h</span>
                  </div>
                  <div className="text-[10px] text-sky-200">
                    Rumbo: {degreesToCardinal(current.wind_direction_deg)} ({current.wind_direction_deg}°)
                  </div>
                </div>

                {/* Humedad */}
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-sky-100 text-[11px]">
                    <Droplets className="w-3.5 h-3.5 text-blue-300" />
                    <span>Humedad Relativa</span>
                  </div>
                  <div className="text-base font-bold font-mono mt-1">
                    {current.relative_humidity_pct}%
                  </div>
                  <div className="text-[10px] text-sky-200">
                    Rocío: {current.dew_point_c}°C
                  </div>
                </div>

                {/* Radiación UV / Calidad del Aire */}
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-lg">
                  <div className="flex items-center gap-1.5 text-sky-100 text-[11px]">
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>Índice UV</span>
                  </div>
                  <div className="text-base font-bold font-mono mt-1">
                    {current.uv_index} <span className="text-[11px] font-medium font-sans">({current.uv_description})</span>
                  </div>
                  <div className="text-[10px] text-sky-200 truncate">
                    AQI: {current.aqi} · {current.aqi_severity}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Complementaria: Efemérides Astronómicas de General Güemes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sunrise className="w-4 h-4 text-amber-500" />
                <span>Ciclo Solar y Lunar (General Güemes)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Datos astronómicos para Latitud -24.67° Sur
              </p>

              <div className="space-y-3 mt-4 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40">
                  <div className="flex items-center gap-2">
                    <Sunrise className="w-4 h-4 text-amber-600" />
                    <span className="font-sans text-slate-700 dark:text-slate-300">Amanecer:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{almanac?.sunrise || '06:31'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/40">
                  <div className="flex items-center gap-2">
                    <Sunset className="w-4 h-4 text-indigo-600" />
                    <span className="font-sans text-slate-700 dark:text-slate-300">Atardecer:</span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{almanac?.sunset || '19:36'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <Moon className="w-4 h-4 text-sky-500" />
                    <span className="font-sans text-slate-700 dark:text-slate-300">Fase Lunar:</span>
                  </div>
                  <span className="font-sans font-semibold text-slate-800 dark:text-slate-200">{almanac?.moon_phase || 'Luna menguante'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Luz diurna estimada:</span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400">{almanac?.day_length_hours || '13 h 05 min'}</span>
            </div>
          </div>
        </section>
      )}

      {/* 3. Desglose Horario de Hoy (Hourly Timeline) */}
      {selectedDay && selectedDay.hourly && selectedDay.hourly.length > 0 && (
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600" />
                <span>Pronóstico Horario Detallado · {selectedDay.fullDateLabel}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evolución de temperatura, nubosidad, viento y probabilidad de precipitación hora por hora
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Valle de Siancas (-24.6745, -65.0468)
            </span>
          </div>

          <div className="overflow-x-auto pb-2">
            <div className="flex gap-2.5 min-w-[680px]">
              {selectedDay.hourly.map((h, i) => (
                <div
                  key={i}
                  className="flex-1 min-w-[95px] p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 flex flex-col items-center text-center hover:border-sky-400 transition-colors"
                >
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {h.hour}
                  </span>
                  <div className="my-2">
                    {getWeatherIcon(h.condition_text, h.daytime)}
                  </div>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    {h.temperature_c}°
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[85px]" title={h.condition_text}>
                    {h.condition_text}
                  </span>

                  {/* Lluvia / Viento */}
                  <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 w-full text-[10px] font-mono space-y-1">
                    <div className="flex items-center justify-center gap-1 text-sky-600 dark:text-sky-400">
                      <CloudRain className="w-3 h-3" />
                      <span>{h.rain_probability_pct}%</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400">
                      <Wind className="w-3 h-3" />
                      <span>{h.wind_speed_kmh}k</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 4. Pronóstico Extendido de 10 Días */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-600" />
              <span>Pronóstico Extendido de 10 Días para General Güemes</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Temperaturas extremas, precipitaciones acumuladas y resúmenes sinópticos
            </p>
          </div>
          <span className="text-xs text-sky-600 dark:text-sky-400 font-semibold">
            Haz clic en un día para ver su resumen completo
          </span>
        </div>

        <div className="space-y-2.5">
          {days.map((day, idx) => {
            const isSelected = selectedDayIndex === idx;
            const isExpanded = expandedDay === idx;

            return (
              <div
                key={day.dateStr + idx}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isSelected
                    ? 'border-sky-500 dark:border-sky-500 bg-sky-50/40 dark:bg-sky-950/20 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Fila del día */}
                <div
                  onClick={() => {
                    setSelectedDayIndex(idx);
                    setExpandedDay(isExpanded ? null : idx);
                  }}
                  className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
                >
                  {/* Día y condición */}
                  <div className="flex items-center gap-3 sm:w-1/3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getWeatherIcon(day.condition_text)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {day.dayName}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          {day.dateStr.slice(5)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                        {day.condition_text}
                      </div>
                    </div>
                  </div>

                  {/* Precipitaciones y Viento */}
                  <div className="flex items-center gap-4 sm:w-1/4 text-xs font-mono text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5" title="Probabilidad de lluvia y volumen estimado">
                      <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {day.precipitation_probability_pct}%
                      </span>
                      {day.rain_amount_mm > 0 && (
                        <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">
                          ({day.rain_amount_mm} mm)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Wind className="w-3.5 h-3.5" />
                      <span>{day.wind_speed_kmh} km/h</span>
                    </div>
                  </div>

                  {/* Barra de temperaturas y botón expandir */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 sm:w-1/3">
                    <div className="flex items-center gap-2 font-mono text-sm">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {day.temp_min_c}°
                      </span>
                      {/* Barra visual de temperatura */}
                      <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                          style={{
                            marginLeft: `${Math.max(0, Math.min(60, (day.temp_min_c - 10) * 2.5))}%`,
                            width: `${Math.max(25, Math.min(80, (day.temp_max_c - day.temp_min_c) * 4))}%`,
                          }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {day.temp_max_c}°
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-label="Expandir detalles"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Acordeón expandible con descripción día/noche y parámetros */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-2">
                      {/* Resumen Diurno */}
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                          <Sun className="w-3.5 h-3.5 text-amber-500" />
                          <span>Durante el día:</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {day.day_summary ||
                            day.day_cap ||
                            `Se prevé una temperatura máxima de ${day.temp_max_c}°C con viento promedio de ${day.wind_speed_kmh} km/h.`}
                        </p>
                      </div>

                      {/* Resumen Nocturno */}
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white mb-1">
                          <Moon className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Durante la noche:</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">
                          {day.night_summary ||
                            day.night_cap ||
                            `Descenso térmico hasta los ${day.temp_min_c}°C con probabilidad de lluvia del ${day.precipitation_probability_pct}%.`}
                        </p>
                      </div>
                    </div>

                    {/* Ficha técnica del día */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700/60">
                      <span>Rango Humedad: {day.humidity_low_pct}% - {day.humidity_high_pct}%</span>
                      <span>Viento Máx: {day.wind_max_kmh} km/h</span>
                      <span>Índice UV: {day.uv_index} ({day.uv_description})</span>
                      <span>Presión Media: {day.air_pressure_hpa} hPa</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. SECCIÓN DE IMÁGENES SATELITALES Y RADAR EN VIVO */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-600 animate-pulse" />
              <span>Imágenes Satelitales y Radar en Vivo (General Güemes / Salta)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Extracción directa de satélite meteorológico de MSN Weather y radar para el Valle de Siancas y NOA
            </p>
          </div>

          {/* Selector de modo satelital */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              onClick={() => setSatelliteViewMode('msn')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                satelliteViewMode === 'msn'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Satélite MSN
            </button>
            <button
              onClick={() => setSatelliteViewMode('goes')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                satelliteViewMode === 'goes'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              GOES-16 NOA
            </button>
            <button
              onClick={() => setSatelliteViewMode('radar')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                satelliteViewMode === 'radar'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Radar Interactivo
            </button>
          </div>
        </div>

        {/* Visor Satelital Central */}
        <div className="relative w-full h-[380px] sm:h-[460px] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
          {satelliteViewMode === 'msn' && satellite && (
            <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
              <img
                src={satellite.sampleTileUrl}
                alt="Imagen Satelital MSN para General Güemes y Salta"
                className="w-full h-full object-cover sm:object-contain select-none"
                onError={(e) => {
                  // Fallback a GOES-16 si el token temporal caducó
                  (e.target as HTMLImageElement).src = satellite.goesSatelliteUrl;
                }}
              />

              {/* Overlay de telemetría de satélite */}
              <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-white text-xs max-w-xs shadow-xl">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Satélite Meteorológico MSN</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Canal Infrarrojo y Nubosidad · Valle de Siancas
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700/80 font-mono text-[10px] space-y-0.5 text-slate-400">
                  <div>Zona: General Güemes, Salta (-24.67°, -65.04°)</div>
                  <div>Marca de tiempo satelital: {satellite.timestamp}</div>
                </div>
              </div>

              {/* Botón flotante para abrir en MSN */}
              <a
                href={satellite.msnMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-lg transition-colors"
              >
                <span>Ver Mapa Interactivo Completo en MSN</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {satelliteViewMode === 'goes' && (
            <div className="w-full h-full relative flex items-center justify-center bg-slate-950">
              <img
                src="https://cdn.star.nesdis.noaa.gov/GOES16/ABI/SECTOR/ssa/GEOCOLOR/1200x1200.jpg"
                alt="Satélite GOES-16 GeoColor Sudamérica y Noroeste Argentino"
                className="w-full h-full object-cover select-none"
              />

              <div className="absolute top-3 left-3 z-10 bg-slate-950/90 backdrop-blur-md border border-slate-700/80 rounded-lg p-3 text-white text-xs max-w-xs shadow-xl">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Satélite GOES-16 GeoColor HD</span>
                </div>
                <div className="text-[11px] text-slate-300">
                  Cobertura completa de Salta, Jujuy y el Valle de Siancas
                </div>
                <div className="mt-2 pt-2 border-t border-slate-700/80 font-mono text-[10px] text-slate-400">
                  Resolución real en tiempo real (NOAA / SMN Argentina)
                </div>
              </div>

              <div className="absolute bottom-3 left-3 z-10 bg-slate-950/90 backdrop-blur-xs px-2.5 py-1 rounded text-[11px] font-mono text-slate-400">
                Punto Estación Güemes: -24.6708, -65.0498
              </div>
            </div>
          )}

          {satelliteViewMode === 'radar' && (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-white bg-slate-900">
              <div className="w-14 h-14 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
                <Radio className="w-7 h-7 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">
                Radar de Precipitaciones Interactivo · MSN El Tiempo
              </h3>
              <p className="text-xs text-slate-300 max-w-md mb-5 leading-relaxed">
                Visualiza el desplazamiento de tormentas, frentes fríos y celdas de lluvia en tiempo real directamente sobre el mapa dinámico de General Güemes.
              </p>
              <a
                href={forecast?.source_url || 'https://www.msn.com/es-ar/el-tiempo/mapas/radar'}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-lg transition-colors"
              >
                <span>Abrir Radar Meteorológico en MSN El Tiempo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>
      </section>

      {/* 6. Pie de página de Atribución y Enlace Oficial */}
      <section className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-600 shrink-0" />
          <span>
            Los datos meteorológicos predictivos y las imágenes satelitales son procesados y sincronizados desde{' '}
            <strong className="text-slate-700 dark:text-slate-200">MSN El Tiempo / Microsoft Bing Weather</strong> para el Colegio Secundario N.º 5085.
          </span>
        </div>
        <a
          href={forecast?.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-sky-600 dark:text-sky-400 hover:underline shrink-0 inline-flex items-center gap-1"
        >
          <span>Consultar fuente original MSN</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </section>
    </div>
  );
};
