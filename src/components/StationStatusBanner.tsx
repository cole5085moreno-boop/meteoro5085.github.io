/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Banner de Estado Institucional con Sistema de Notificación de Alertas Meteorológicas
 * Ubicación: General Güemes, Salta, Argentina (Lat -24.6708, Long -65.0498 · 695 msnm)
 */

import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Clock,
  Radio,
  Database,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  WifiOff,
  AlertTriangle,
  Wind,
  Flame,
  Snowflake,
  CloudRain,
  Sun,
  ShieldAlert,
  ChevronRight,
  X,
  Sliders,
  Info,
  ShieldCheck,
  Bell,
  Sparkles,
} from 'lucide-react';
import type { StationConfig, SyncRun, WeatherObservation } from '../types/weather.ts';
import {
  evaluateWeatherAlerts,
  WEATHER_THRESHOLDS,
  type WeatherAlert,
} from '../lib/weather-alerts.ts';

interface StationStatusBannerProps {
  station: StationConfig | null;
  latestObservation: WeatherObservation | null;
  lastSync: SyncRun | null;
  connectionStatus: 'Actualizado' | 'Actualización pendiente' | 'Datos desactualizados' | 'Fuente no disponible';
  dataAgeMinutes: number;
  totalRecords: number;
}

export const StationStatusBanner: React.FC<StationStatusBannerProps> = ({
  station,
  latestObservation,
  lastSync,
  connectionStatus,
  dataAgeMinutes,
  totalRecords,
}) => {
  // Estado para modal de umbrales y protocolos
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState<boolean>(false);

  // Alertas descartadas temporalmente en la sesión
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Estado para simulación de alertas (herramienta pedagógica para docentes y alumnos)
  const [simulatedObs, setSimulatedObs] = useState<WeatherObservation | null>(null);

  // Observación efectiva a evaluar (real o simulada para demostración)
  const effectiveObservation = simulatedObs || latestObservation;

  // Evaluación de alertas activas según los umbrales meteorológicos
  const activeAlerts = useMemo(() => {
    return evaluateWeatherAlerts(effectiveObservation);
  }, [effectiveObservation]);

  // Alertas no descartadas
  const visibleAlerts = useMemo(() => {
    return activeAlerts.filter((a) => !dismissedAlertIds.includes(a.id));
  }, [activeAlerts, dismissedAlertIds]);

  // Alerta principal a destacar en el banner (la de mayor severidad)
  const primaryAlert: WeatherAlert | null = visibleAlerts.length > 0 ? visibleAlerts[0] : null;

  // Configuración semántica del estado de conexión
  const statusConfig = {
    Actualizado: {
      label: 'Conexión activa · Actualizado',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
      icon: CheckCircle2,
    },
    'Actualización pendiente': {
      label: 'Actualización en espera',
      textColor: 'text-amber-700 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
      icon: Clock,
    },
    'Datos desactualizados': {
      label: 'Datos desactualizados (> 3h)',
      textColor: 'text-amber-800 dark:text-amber-300',
      bgColor: 'bg-amber-100/60 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
      icon: AlertCircle,
    },
    'Fuente no disponible': {
      label: 'Fuente temporalmente fuera de línea',
      textColor: 'text-rose-700 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
      icon: WifiOff,
    },
  }[connectionStatus] || {
    label: 'Estado desconocido',
    textColor: 'text-slate-700 dark:text-slate-300',
    bgColor: 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
    icon: HelpCircle,
  };

  const StatusIcon = statusConfig.icon;

  const formatDataAge = (mins: number) => {
    if (mins < 1) return 'hace menos de un minuto';
    if (mins === 1) return 'hace 1 minuto';
    if (mins < 60) return `hace ${mins} minutos`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `hace ${hours}h ${remMins}m`;
  };

  // Helper para renderizar icono según tipo de alerta
  const getAlertIcon = (type: WeatherAlert['type'], className = 'w-4 h-4') => {
    switch (type) {
      case 'wind':
        return <Wind className={className} />;
      case 'heat':
        return <Flame className={className} />;
      case 'frost':
        return <Snowflake className={className} />;
      case 'rain':
        return <CloudRain className={className} />;
      case 'uv':
        return <Sun className={className} />;
      case 'zonda_fire':
        return <AlertTriangle className={className} />;
      default:
        return <AlertCircle className={className} />;
    }
  };

  // Preset de simulación para pruebas de aula
  const triggerSimulation = (simType: 'wind' | 'heat' | 'frost' | 'zonda' | 'rain') => {
    if (!latestObservation) return;
    const base = { ...latestObservation };
    switch (simType) {
      case 'wind':
        base.wind_speed_kmh = 48;
        base.wind_gust_kmh = 68;
        break;
      case 'heat':
        base.temperature_c = 39.4;
        base.feels_like_c = 43.1;
        break;
      case 'frost':
        base.temperature_c = -1.5;
        base.dew_point_c = -3.0;
        break;
      case 'zonda':
        base.temperature_c = 33.5;
        base.relative_humidity_pct = 12;
        base.wind_speed_kmh = 36;
        base.wind_gust_kmh = 58;
        break;
      case 'rain':
        base.precipitation_rate_mmh = 38.5;
        base.precipitation_daily_mm = 45.2;
        break;
    }
    setSimulatedObs(base);
    setDismissedAlertIds([]);
  };

  const resetSimulation = () => {
    setSimulatedObs(null);
    setDismissedAlertIds([]);
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-xs transition-colors">
      {/* CUERPO SUPERIOR DEL BANNER: Identidad Institucional y Telemetría */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Información Institucional */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Colegio Secundario N.º 5085 «Dr. Mariano Moreno»</span>
            <span aria-hidden="true">·</span>
            <span>Estación Automática Ecowitt ID {station?.ecowitt_station_id || '364053'}</span>
            <span aria-hidden="true">·</span>
            <a
              href={station?.primary_source_url || 'https://www.ecowitt.net/home/share?authorize=5MMNHG&device_id=YkliaG1nckQ4RFlBZWE5YWFRWEMrZz09'}
              target="_blank"
              rel="noopener noreferrer"
              title="Abrir panel oficial de la estación en Ecowitt.net"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 font-semibold hover:underline"
            >
              <span>Fuente Ecowitt.net (En vivo)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-balance">
            {station?.name || 'Proyecto Estación Meteorológica Colegio 5085'}
          </h1>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1 font-mono">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>General Güemes, Salta (-24.6708, -65.0498 · 695 msnm)</span>
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                {totalRecords}
              </span>
              <span>observaciones almacenadas</span>
            </div>
          </div>
        </div>

        {/* Telemetría de Conexión, Badges de Alerta y Antigüedad */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2.5 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            {/* Badge de Estado de Conexión */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}
            >
              <StatusIcon className="w-4 h-4 shrink-0" />
              <span>{statusConfig.label}</span>
            </div>

            {/* BADGES DE ADVERTENCIA METEOROLÓGICA */}
            {activeAlerts.length > 0 ? (
              <button
                onClick={() => setIsThresholdModalOpen(true)}
                title="Haga clic para ver el detalle de umbrales y alertas activas"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-xs cursor-pointer bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100"
              >
                {/* Indicador de pulso activo */}
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600" />
                </span>
                <Bell className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>
                  {activeAlerts.length} {activeAlerts.length === 1 ? 'Alerta Meteorológica' : 'Alertas Meteorológicas'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => setIsThresholdModalOpen(true)}
                title="Haga clic para consultar los umbrales de alerta monitoreados"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Condiciones normales · Sin alertas</span>
              </button>
            )}
          </div>

          {/* Badges individuales de variables que superan umbrales */}
          {activeAlerts.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {activeAlerts.map((alert) => (
                <button
                  key={alert.id}
                  onClick={() => setIsThresholdModalOpen(true)}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors cursor-pointer ${alert.bgColor} ${alert.textColor} ${alert.borderColor}`}
                >
                  {getAlertIcon(alert.type, 'w-3 h-3')}
                  <span>{alert.badgeLabel}</span>
                </button>
              ))}
            </div>
          )}

          {/* Información de Última Medición */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-0.5 text-left lg:text-right">
            <div>
              <span className="text-slate-400">Última observación: </span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
                {latestObservation?.observed_at || 'Sin mediciones'}
              </span>{' '}
              <span className="text-slate-500">({formatDataAge(dataAgeMinutes)})</span>
            </div>
            <div>
              <span className="text-slate-400">Última sincronización exitosa: </span>
              <span className="font-mono text-slate-600 dark:text-slate-300">
                {lastSync?.completed_at
                  ? new Date(lastSync.completed_at).toLocaleTimeString('es-AR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* TIRA DE NOTIFICACIÓN DESTACADA DE ALERTA METEOROLÓGICA (SI HAY ALERTA ACTIVA) */}
      {primaryAlert && (
        <div
          className={`mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 rounded-xl border ${primaryAlert.bgColor} ${primaryAlert.borderColor} transition-all`}
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-white/80 dark:bg-slate-900/80 shadow-xs ${primaryAlert.textColor} shrink-0 mt-0.5`}>
              {getAlertIcon(primaryAlert.type, 'w-5 h-5 animate-pulse')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-wider ${primaryAlert.textColor}`}>
                  {primaryAlert.title}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/70 dark:bg-slate-900/70 border border-current font-bold">
                  Umbral: {primaryAlert.thresholdDisplay}
                </span>
              </div>

              <p className={`text-xs mt-0.5 font-medium leading-relaxed opacity-95 ${primaryAlert.textColor}`}>
                {primaryAlert.description}
              </p>

              {primaryAlert.recommendations.length > 0 && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] opacity-90">
                  <span className="font-semibold">Recomendación escolar:</span>
                  <span>{primaryAlert.recommendations[0]}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-current text-slate-800 dark:text-slate-200 hover:bg-slate-50 shadow-xs cursor-pointer transition-colors"
            >
              <span>Ver Protocolos ({activeAlerts.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setDismissedAlertIds((prev) => [...prev, primaryAlert.id])}
              title="Ocultar aviso de alerta por ahora"
              className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* AVISO DE MODO SIMULACIÓN ACTIVO (SI EL DOCENTE ACTIVÓ PRUEBA) */}
      {simulatedObs && (
        <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg flex items-center justify-between text-xs text-amber-800 dark:text-amber-200 font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Modo de Demostración Activo:</strong> Se están simulando condiciones meteorológicas de prueba para verificar la respuesta del sistema de alertas.
            </span>
          </div>
          <button
            onClick={resetSimulation}
            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px] cursor-pointer"
          >
            Restablecer Telemetría Real
          </button>
        </div>
      )}

      {/* MODAL INTERACTIVO: DETALLE DE UMBRALES, ALERTAS Y PROTOCOLOS */}
      {isThresholdModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            {/* Encabezado del Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Sistema de Alertas y Umbrales Meteorológicos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estación Colegio N.º 5085 «Dr. Mariano Moreno» · General Güemes, Salta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsThresholdModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estado actual de alertas */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Alertas Activas en Tiempo Real
                </span>
                <span className="text-xs font-mono text-slate-500">
                  Total: {activeAlerts.length}
                </span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Sin Alertas Meteorológicas Activas</span>
                    <span className="text-[11px] opacity-90">
                      Todos los parámetros atmosféricos (viento, temperatura, radiación y humedad) se encuentran dentro de los rangos normales de seguridad.
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-xl border ${alert.bgColor} ${alert.borderColor} text-xs`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {getAlertIcon(alert.type, 'w-4 h-4')}
                          <span className={`font-bold ${alert.textColor}`}>{alert.title}</span>
                        </div>
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-current">
                          Registrado: {alert.valueDisplay}
                        </span>
                      </div>

                      <p className={`leading-relaxed mb-2 opacity-95 ${alert.textColor}`}>
                        {alert.description}
                      </p>

                      <div className="pt-2 border-t border-current/20">
                        <span className="font-bold block text-[11px] mb-1">Protocolos de Seguridad Recomendados:</span>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] opacity-90">
                          {alert.recommendations.map((rec, i) => (
                            <li key={i}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tabla de Umbrales Configurados */}
            <div className="mb-5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
                Tabla de Umbrales Meteorológicos Monitoreados
              </h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] uppercase font-sans">
                    <tr>
                      <th className="py-2 px-3">Fenómeno</th>
                      <th className="py-2 px-2 text-right">Advertencia</th>
                      <th className="py-2 px-2 text-right">Alerta Peligro</th>
                      <th className="py-2 px-3 font-sans">Impacto Regional en Güemes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {WEATHER_THRESHOLDS.map((th) => (
                      <tr key={th.type} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-white">
                          {th.category}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-amber-600 dark:text-amber-400">
                          ≥ {th.warningThreshold} {th.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-rose-600 dark:text-rose-400">
                          {th.type === 'frost' ? `≤ ${th.dangerThreshold} ${th.unit}` : th.type === 'zonda_fire' ? `≤ ${th.dangerThreshold} ${th.unit}` : `≥ ${th.dangerThreshold} ${th.unit}`}
                        </td>
                        <td className="py-2 px-3 font-sans text-[11px] text-slate-500 dark:text-slate-400">
                          {th.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Banco de Pruebas / Simulación de Alertas para Docentes */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white mb-1.5">
                <Sliders className="w-4 h-4 text-sky-600" />
                <span>Simulador de Prueba de Alertas (Docentes y Alumnos)</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                Permite simular eventos meteorológicos extremos para observar cómo reacciona en tiempo real el banner institucional y los badges de advertencia:
              </p>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => triggerSimulation('wind')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 text-[11px] cursor-pointer"
                >
                  💨 Viento Fuerte (68 km/h)
                </button>
                <button
                  onClick={() => triggerSimulation('heat')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 text-[11px] cursor-pointer"
                >
                  🔥 Ola de Calor (39.4 °C)
                </button>
                <button
                  onClick={() => triggerSimulation('frost')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 text-[11px] cursor-pointer"
                >
                  ❄️ Helada Activa (-1.5 °C)
                </button>
                <button
                  onClick={() => triggerSimulation('zonda')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 text-[11px] cursor-pointer"
                >
                  ⚠️ Viento Zonda (HR 12%)
                </button>
                <button
                  onClick={() => triggerSimulation('rain')}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-100 text-[11px] cursor-pointer"
                >
                  🌧️ Tormenta (38 mm/h)
                </button>
                {simulatedObs && (
                  <button
                    onClick={resetSimulation}
                    className="px-2.5 py-1.5 rounded-lg bg-sky-600 text-white font-bold text-[11px] cursor-pointer"
                  >
                    Restablecer
                  </button>
                )}
              </div>
            </div>

            {/* Botón de Cierre */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setIsThresholdModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-sky-600 text-white font-semibold text-xs cursor-pointer hover:bg-slate-800 transition-colors"
              >
                Cerrar Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
