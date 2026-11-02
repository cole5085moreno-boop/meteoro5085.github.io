/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Banner de Estado Institucional y Conectividad de la Estación
 */

import React from 'react';
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
} from 'lucide-react';
import type { StationConfig, SyncRun, WeatherObservation } from '../types/weather.ts';

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
  // Configuración semántica del estado de conexión (sin basarse únicamente en color)
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

  return (
    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 shadow-xs transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Información Institucional */}
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-medium">
            <span>Colegio Secundario N.º 5085 «Dr. Mariano Moreno»</span>
            <span aria-hidden="true">·</span>
            <span>Estación Automática Ecowitt ID {station?.ecowitt_station_id || '364053'}</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://intasalta.github.io/ema_5085mm/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 dark:text-sky-400 hover:underline"
            >
              <span>Fuente INTA Salta</span>
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

        {/* Telemetría de Conexión y Antigüedad */}
        <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}
          >
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span>{statusConfig.label}</span>
          </div>

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
    </section>
  );
};
