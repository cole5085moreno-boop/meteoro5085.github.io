/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Panel de Administración y Control del Sistema (Secciones 11 y 12)
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCw,
  PlusCircle,
  Edit3,
  Settings,
  History,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileCheck,
  Database,
  Lock,
  GitBranch,
  Save,
  ExternalLink,
  Clock,
  Zap,
} from 'lucide-react';
import type {
  StationConfig,
  SyncRun,
  ManualObservation,
  DataCorrection,
  AuditLog,
  WeatherObservation,
  UserRole,
} from '../types/weather.ts';
import {
  fetchStationStatus,
  updateStationConfig,
  triggerManualSync,
  triggerHistoricalSync,
  fetchSyncHistory,
  submitManualObservation,
  submitDataCorrection,
  fetchCorrections,
  fetchAuditLogs,
  runServerTests,
  fetchObservations,
} from '../lib/api.ts';

interface AdminPanelViewProps {
  currentUser: { username: string; name: string; role: UserRole } | null;
  onOpenLogin: () => void;
}

type AdminSection = 'sync' | 'manual' | 'corrections' | 'config' | 'audit' | 'tests';

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUser,
  onOpenLogin,
}) => {
  const [activeSection, setActiveSection] = useState<AdminSection>('sync');
  const [station, setStation] = useState<StationConfig | null>(null);
  const [syncRuns, setSyncRuns] = useState<SyncRun[]>([]);
  const [corrections, setCorrections] = useState<DataCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [forcingSync, setForcingSync] = useState<boolean>(false);
  const [gitSyncing, setGitSyncing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de conexión y telemetría de la estación
  const [connectionStatus, setConnectionStatus] = useState<
    'Actualizado' | 'Actualización pendiente' | 'Datos desactualizados' | 'Fuente no disponible'
  >('Actualizado');
  const [dataAgeMinutes, setDataAgeMinutes] = useState<number>(0);
  const [latestObservation, setLatestObservation] = useState<WeatherObservation | null>(null);
  const [lastSync, setLastSync] = useState<SyncRun | null>(null);

  // Formulario de observación manual
  const [manualForm, setManualForm] = useState({
    observed_at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    temperature_c: '',
    relative_humidity_pct: '',
    pressure_hpa: '',
    wind_speed_kmh: '',
    wind_direction_deg: '',
    sky_condition: 'Soleado' as 'Soleado' | 'Seminublado' | 'Nublado',
    notes: '',
  });

  // Formulario de corrección de datos
  const [correctionForm, setCorrectionForm] = useState({
    observation_id: '',
    field_name: 'temperature_c',
    corrected_value: '',
    reason: '',
  });

  // Formulario de configuración de estación
  const [configForm, setConfigForm] = useState({
    name: '',
    address: '',
    latitude: -24.6708,
    longitude: -65.0498,
    altitude_m: 695,
    ecowitt_station_id: '364053',
    primary_source_url:
      'https://www.ecowitt.net/home/share?authorize=5MMNHG&device_id=YkliaG1nckQ4RFlBZWE5YWFRWEMrZz09',
    sync_interval_minutes: 15,
  });

  // Resultados de pruebas automatizadas
  const [testResults, setTestResults] = useState<any>(null);
  const [runningTests, setRunningTests] = useState<boolean>(false);

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const loadAdminData = async () => {
    try {
      const stationRes = await fetchStationStatus();
      setStation(stationRes.station);
      setConnectionStatus(stationRes.connection_status);
      setDataAgeMinutes(stationRes.data_age_minutes);
      setLatestObservation(stationRes.latest_observation);
      setLastSync(stationRes.last_sync);
      setConfigForm({
        name: stationRes.station.name,
        address: stationRes.station.address,
        latitude: -24.6708,
        longitude: -65.0498,
        altitude_m: stationRes.station.altitude_m,
        ecowitt_station_id: stationRes.station.ecowitt_station_id,
        primary_source_url:
          stationRes.station.primary_source_url ||
          'https://www.ecowitt.net/home/share?authorize=5MMNHG&device_id=YkliaG1nckQ4RFlBZWE5YWFRWEMrZz09',
        sync_interval_minutes: stationRes.station.sync_interval_minutes,
      });

      const runs = await fetchSyncHistory();
      setSyncRuns(runs);

      const obs = await fetchObservations({ limit: 100 });
      setObservations(obs);
      if (obs.length > 0 && !correctionForm.observation_id) {
        setCorrectionForm((prev) => ({ ...prev, observation_id: obs[0].id }));
      }

      if (currentUser?.role === 'admin') {
        const corr = await fetchCorrections();
        setCorrections(corr);
        const logs = await fetchAuditLogs();
        setAuditLogs(logs);
      }
    } catch (e) {
      console.error('Error al cargar datos administrativos:', e);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setStatusMessage(null);
    try {
      const res = await triggerManualSync(false);
      setStatusMessage({
        type: 'success',
        text: `Sincronización completada. ${res.run.records_inserted} registros insertados. Total actual: ${res.total_records}`,
      });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error en la sincronización' });
    } finally {
      setSyncing(false);
    }
  };

  const handleForceSync = async () => {
    setForcingSync(true);
    setStatusMessage(null);
    try {
      const res = await triggerManualSync(true);
      setStatusMessage({
        type: 'success',
        text: `Actualización forzada manual completada con éxito. ${res.run.records_inserted} registros procesados / insertados. Total actual en base de datos: ${res.total_records}.`,
      });
      await loadAdminData();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al forzar la actualización manual de datos',
      });
    } finally {
      setForcingSync(false);
    }
  };

  const formatDataAge = (mins: number) => {
    if (mins < 1) return 'hace menos de un minuto';
    if (mins === 1) return 'hace 1 minuto';
    if (mins < 60) return `hace ${mins} minutos`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `hace ${hours}h ${remMins}m`;
  };

  const handleHistoricalSync = async () => {
    setGitSyncing(true);
    setStatusMessage(null);
    try {
      const res = await triggerHistoricalSync();
      setStatusMessage({
        type: 'success',
        text: `Historial de commits importado con éxito: ${res.inserted} observaciones adicionales añadidas. Total: ${res.total_now}`,
      });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al importar commits históricos' });
    } finally {
      setGitSyncing(false);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await submitManualObservation({
        observed_at: manualForm.observed_at,
        temperature_c: manualForm.temperature_c ? parseFloat(manualForm.temperature_c) : null,
        relative_humidity_pct: manualForm.relative_humidity_pct ? parseFloat(manualForm.relative_humidity_pct) : null,
        pressure_hpa: manualForm.pressure_hpa ? parseFloat(manualForm.pressure_hpa) : null,
        wind_speed_kmh: manualForm.wind_speed_kmh ? parseFloat(manualForm.wind_speed_kmh) : null,
        wind_direction_deg: manualForm.wind_direction_deg ? parseFloat(manualForm.wind_direction_deg) : null,
        sky_condition: manualForm.sky_condition,
        notes: manualForm.notes,
      });
      setStatusMessage({ type: 'success', text: 'Observación manual registrada correctamente en la base de datos.' });
      setManualForm((prev) => ({ ...prev, notes: '', temperature_c: '', relative_humidity_pct: '' }));
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al registrar observación manual' });
    }
  };

  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await submitDataCorrection({
        observation_id: correctionForm.observation_id,
        field_name: correctionForm.field_name,
        corrected_value: parseFloat(correctionForm.corrected_value),
        reason: correctionForm.reason,
      });
      setStatusMessage({
        type: 'success',
        text: 'Corrección auditada guardada con éxito. El valor original se preservó en la bitácora.',
      });
      setCorrectionForm((prev) => ({ ...prev, corrected_value: '', reason: '' }));
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al registrar corrección' });
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    try {
      await updateStationConfig(configForm);
      setStatusMessage({ type: 'success', text: 'Parámetros institucionales actualizados con éxito.' });
      loadAdminData();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error al guardar configuración' });
    }
  };

  const handleRunTests = async () => {
    setRunningTests(true);
    try {
      const suite = await runServerTests();
      setTestResults(suite);
    } catch (err) {
      console.error('Error al ejecutar pruebas:', err);
    } finally {
      setRunningTests(false);
    }
  };

  // Si no está autenticado, invitar a iniciar sesión
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-sky-600" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
          Acceso al Panel de Control
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Este panel permite sincronizar la estación, incorporar observaciones manuales y realizar auditorías institucionales.
        </p>
        <button
          onClick={onOpenLogin}
          className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
        >
          Iniciar Sesión (Operador / Administrador)
        </button>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'admin';

  return (
    <div className="space-y-6">
      {/* Banner de Control */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Panel de Control y Administración
                </h1>
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Sesión activa: {currentUser.name} ({currentUser.username})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleManualSync}
              disabled={syncing || forcingSync}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>Sincronizar Fuente Ahora</span>
            </button>

            <button
              onClick={handleForceSync}
              disabled={forcingSync || syncing}
              title="Forzar actualización manual ignorando el hash de contenido anterior"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer ${
                connectionStatus === 'Datos desactualizados'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white font-bold ring-2 ring-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${forcingSync ? 'animate-spin' : ''}`} />
              <span>Forzar Actualización Manual</span>
            </button>
          </div>
        </div>

        {/* ALERTA CRÍTICA: DATOS DESACTUALIZADOS (> 3h) */}
        {connectionStatus === 'Datos desactualizados' && (
          <div className="mt-5 p-4 sm:p-5 rounded-xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/50 shadow-xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 rounded-xl shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                      Alerta de Telemetría:
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 border border-amber-400 dark:border-amber-600">
                      <Clock className="w-3.5 h-3.5" />
                      Datos desactualizados (&gt; 3h)
                    </span>
                    <span className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      ({formatDataAge(dataAgeMinutes)})
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 dark:text-amber-200 mt-1.5 leading-relaxed">
                    La última medición registrada de la estación en General Güemes data de{' '}
                    <strong className="font-mono text-amber-950 dark:text-amber-100">
                      {latestObservation?.observed_at || 'horario no disponible'}
                    </strong>
                    . Cuando se observe este mensaje, presione el botón a la derecha para forzar la actualización de datos de forma manual e incorporar de inmediato los últimos registros omitiendo la verificación de hash de contenido.
                  </p>
                </div>
              </div>

              <button
                onClick={handleForceSync}
                disabled={forcingSync || syncing}
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${forcingSync ? 'animate-spin' : ''}`} />
                <span>Forzar Actualización de Datos de Forma Manual</span>
              </button>
            </div>
          </div>
        )}

        {/* Mensajes de retroalimentación de estado */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Menú de Secciones Administrativas */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveSection('sync')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'sync'
                ? 'bg-slate-900 dark:bg-sky-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Sincronización e Historial
          </button>

          <button
            onClick={() => setActiveSection('manual')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'manual'
                ? 'bg-slate-900 dark:bg-sky-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Observaciones Manuales
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveSection('corrections')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'corrections'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Protección y Corrección Auditada
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveSection('config')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'config'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Configuración de Estación
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => setActiveSection('audit')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeSection === 'audit'
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bitácora de Auditoría
            </button>
          )}

          <button
            onClick={() => setActiveSection('tests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeSection === 'tests'
                ? 'bg-slate-900 dark:bg-sky-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Pruebas Automatizadas (Sección 21)
          </button>
        </div>
      </div>

      {/* SECCIÓN 1: SINCRONIZACIÓN E HISTORIAL DE EJECUCIONES */}
      {activeSection === 'sync' && (
        <div className="space-y-6">
          {/* Tarjeta Principal de Control de Sincronización y Estado de Telemetría */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-sky-600" />
                  <span>Control de Sincronización y Telemetría en Vivo</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Estación Ecowitt ID <code>364053</code> · General Güemes, Salta (-24.6708, -65.0498 · 695 msnm)
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    connectionStatus === 'Actualizado'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : connectionStatus === 'Datos desactualizados'
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 border border-amber-400 dark:border-amber-600 font-bold'
                      : connectionStatus === 'Actualización pendiente'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                  }`}
                >
                  {connectionStatus === 'Datos desactualizados' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                  {connectionStatus === 'Actualizado' && <CheckCircle2 className="w-3.5 h-3.5" />}
                  {connectionStatus === 'Actualización pendiente' && <Clock className="w-3.5 h-3.5" />}
                  <span>{connectionStatus === 'Datos desactualizados' ? 'Datos desactualizados (> 3h)' : connectionStatus}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase font-semibold">
                  Última Observación:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {latestObservation?.observed_at || 'Sin registros'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  ({formatDataAge(dataAgeMinutes)})
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase font-semibold">
                  Registros en Base de Datos:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {observations.length} mediciones
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Colegio 5085 Mariano Moreno
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px] uppercase font-semibold">
                  Último Ciclo de Sincronización:
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5 block">
                  {lastSync?.completed_at
                    ? new Date(lastSync.completed_at).toLocaleTimeString('es-AR')
                    : 'Sin ejecuciones'}
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Estado: {lastSync?.status === 'success' ? 'Exitoso' : 'Pendiente / Fallido'}
                </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                {connectionStatus === 'Datos desactualizados' ? (
                  <p className="text-amber-800 dark:text-amber-300 font-medium">
                    ⚠️ <strong>Atención:</strong> La estación muestra <strong>Datos desactualizados (&gt; 3h)</strong>. Presione el botón de actualización forzada para renovar la telemetría inmediatamente.
                  </p>
                ) : (
                  <p>
                    La sincronización ordinaria evalúa el hash de contenido para prevenir duplicaciones. Al forzar la actualización se realiza una consulta directa e inserción inmediata sin esperar el intervalo habitual.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 flex-wrap shrink-0">
                <button
                  onClick={handleManualSync}
                  disabled={syncing || forcingSync}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Sincronización Ordinaria</span>
                </button>

                <button
                  onClick={handleForceSync}
                  disabled={forcingSync || syncing}
                  className={`px-4 py-2 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 ${
                    connectionStatus === 'Datos desactualizados'
                      ? 'bg-amber-600 hover:bg-amber-700 text-white ring-2 ring-amber-400 shadow-amber-500/20'
                      : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                  }`}
                >
                  <RotateCw className={`w-3.5 h-3.5 ${forcingSync ? 'animate-spin' : ''}`} />
                  <span>Forzar Actualización de Datos de Forma Manual</span>
                </button>
              </div>
            </div>
          </div>

          {/* Herramienta de Ampliación de Historial desde GitHub Commits */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-sky-600" />
                    <span>Recuperación de Historial desde Commits Previos de GitHub</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Descarga los commits históricos del repositorio <code>intasalta/daza</code> para incorporar días anteriores de observaciones de la estación 364053 sin sobreescribir datos existentes.
                  </p>
                </div>
                <button
                  onClick={handleHistoricalSync}
                  disabled={gitSyncing}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  {gitSyncing ? 'Importando commits...' : 'Importar Historial Real de Git'}
                </button>
              </div>
            </div>
          )}

          {/* Historial de ejecuciones de sincronización */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-sky-600" />
              <span>Registro de Sincronizaciones (sync_runs)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-sans font-semibold text-[11px] uppercase">
                    <th className="py-2 px-3">Fecha y Hora</th>
                    <th className="py-2 px-3">Estado</th>
                    <th className="py-2 px-3 text-right">Encontrados</th>
                    <th className="py-2 px-3 text-right">Insertados</th>
                    <th className="py-2 px-3 text-right">Omitidos</th>
                    <th className="py-2 px-3">Hash Contenido</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {syncRuns.map((run) => (
                    <tr key={run.id} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                        {new Date(run.completed_at || run.started_at).toLocaleString('es-AR')}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={`font-semibold ${
                            run.status === 'success'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {run.status === 'success' ? 'Éxito' : 'Fallo'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-700 dark:text-slate-300">
                        {run.records_found}
                      </td>
                      <td className="py-2 px-3 text-right font-bold text-sky-600">
                        {run.records_inserted}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-400">
                        {run.records_skipped}
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-xs">
                        {run.content_hash?.slice(0, 16) || '—'}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECCIÓN 2: OBSERVACIONES MANUALES */}
      {activeSection === 'manual' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Registrar Observación Meteorológica Complementaria</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Permite ingresar observaciones in situ de alumnos o docentes. Se identifican claramente como <code>manual_operator</code> sin sobreescribir datos automáticos del sensor.
          </p>

          <form onSubmit={handleSubmitManual} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Fecha y Hora de Observación:
              </label>
              <input
                type="text"
                value={manualForm.observed_at}
                onChange={(e) => setManualForm({ ...manualForm, observed_at: e.target.value })}
                placeholder="YYYY-MM-DD HH:mm"
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Temperatura (°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualForm.temperature_c}
                  onChange={(e) => setManualForm({ ...manualForm, temperature_c: e.target.value })}
                  placeholder="Ej: 24.5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Humedad Relativa (%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={manualForm.relative_humidity_pct}
                  onChange={(e) => setManualForm({ ...manualForm, relative_humidity_pct: e.target.value })}
                  placeholder="Ej: 55"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Presión Barométrica (hPa):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualForm.pressure_hpa}
                  onChange={(e) => setManualForm({ ...manualForm, pressure_hpa: e.target.value })}
                  placeholder="Ej: 1012.5"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Estado del Cielo Observado:
                </label>
                <select
                  value={manualForm.sky_condition}
                  onChange={(e: any) => setManualForm({ ...manualForm, sky_condition: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                >
                  <option value="Soleado">Soleado</option>
                  <option value="Seminublado">Seminublado</option>
                  <option value="Nublado">Nublado</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Notas y Justificación Observacional:
              </label>
              <textarea
                value={manualForm.notes}
                onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                placeholder="Observación realizada durante clase práctica de física / meteorología..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
            >
              Guardar Observación Manual
            </button>
          </form>
        </div>
      )}

      {/* SECCIÓN 3: PROTECCIÓN Y CORRECCIÓN AUDITADA DE DATOS */}
      {activeSection === 'corrections' && isAdmin && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-2xl mx-auto">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-600" />
              <span>Corrección Auditada de Mediciones (No Destructiva)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Conforme a la Sección 11.3, los datos importados nunca se alteran silenciosamente. Cada modificación conserva el valor original y registra el motivo formal y usuario responsable.
            </p>

            <form onSubmit={handleSubmitCorrection} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Observación a Corregir:
                </label>
                <select
                  value={correctionForm.observation_id}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, observation_id: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                >
                  {observations.slice(-50).map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.observed_at} · T: {o.temperature_c}°C · H: {o.relative_humidity_pct}%
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Campo a Corregir:
                  </label>
                  <select
                    value={correctionForm.field_name}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, field_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                  >
                    <option value="temperature_c">Temperatura (°C)</option>
                    <option value="relative_humidity_pct">Humedad Relativa (%)</option>
                    <option value="pressure_relative_hpa">Presión Relativa (hPa)</option>
                    <option value="wind_speed_kmh">Velocidad del Viento (km/h)</option>
                    <option value="precipitation_daily_mm">Lluvia Diaria (mm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Nuevo Valor Corregido:
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={correctionForm.corrected_value}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, corrected_value: e.target.value })}
                    placeholder="Valor corregido"
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Motivo Formal de la Corrección:
                </label>
                <textarea
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="Ej: Calibración realizada tras comparación con instrumental patrón INTA..."
                  required
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
              >
                Aplicar Corrección con Auditoría
              </button>
            </form>
          </div>

          {/* Historial de correcciones auditadas */}
          {corrections.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                Historial de Correcciones Auditadas (data_corrections)
              </h4>
              <div className="overflow-x-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-sans">
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Campo</th>
                      <th className="py-2 px-3 text-right">Valor Original</th>
                      <th className="py-2 px-3 text-right">Valor Corregido</th>
                      <th className="py-2 px-3">Motivo</th>
                      <th className="py-2 px-3">Usuario</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {corrections.map((c) => (
                      <tr key={c.id}>
                        <td className="py-2 px-3 text-slate-500">{c.corrected_at.slice(0, 16).replace('T', ' ')}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{c.field_name}</td>
                        <td className="py-2 px-3 text-right text-rose-600">{String(c.original_value)}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-bold">{String(c.corrected_value)}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{c.reason}</td>
                        <td className="py-2 px-3 text-slate-500">{c.user_email}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 4: CONFIGURACIÓN DE LA ESTACIÓN */}
      {activeSection === 'config' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs max-w-2xl mx-auto">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4 text-sky-600" />
            <span>Configuración Institucional de la Estación</span>
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Parámetros geográficos, institucionales y de enlace Ecowitt para el Colegio Secundario N.º 5085 «Dr. Mariano Moreno».
          </p>

          <form onSubmit={handleSaveConfig} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Nombre Oficial de la Aplicación:
              </label>
              <input
                type="text"
                value={configForm.name}
                onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Dirección Institucional:
              </label>
              <input
                type="text"
                value={configForm.address}
                onChange={(e) => setConfigForm({ ...configForm, address: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Latitud:
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={configForm.latitude}
                  onChange={(e) => setConfigForm({ ...configForm, latitude: parseFloat(e.target.value) })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Longitud:
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={configForm.longitude}
                  onChange={(e) => setConfigForm({ ...configForm, longitude: parseFloat(e.target.value) })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Altitud (msnm):
                </label>
                <input
                  type="number"
                  value={configForm.altitude_m}
                  onChange={(e) => setConfigForm({ ...configForm, altitude_m: parseInt(e.target.value, 10) })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Identificador Ecowitt:
                </label>
                <input
                  type="text"
                  value={configForm.ecowitt_station_id}
                  onChange={(e) => setConfigForm({ ...configForm, ecowitt_station_id: e.target.value })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Intervalo Sincronización (minutos):
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={configForm.sync_interval_minutes}
                  onChange={(e) => setConfigForm({ ...configForm, sync_interval_minutes: parseInt(e.target.value, 10) })}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Dirección URL Fuente de Datos (Ecowitt.net):
              </label>
              <input
                type="url"
                value={configForm.primary_source_url}
                onChange={(e) => setConfigForm({ ...configForm, primary_source_url: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-800 dark:text-slate-200"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>Enlace oficial de telemetría de la estación</span>
                <a
                  href={configForm.primary_source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold"
                >
                  <span>Abrir panel en Ecowitt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg transition-colors shadow-xs"
            >
              Guardar Configuración de Estación
            </button>
          </form>
        </div>
      )}

      {/* SECCIÓN 5: BITÁCORA DE AUDITORÍA */}
      {activeSection === 'audit' && isAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
            Bitácora de Auditoría del Sistema (audit_logs)
          </h3>
          <div className="overflow-x-auto text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 text-[11px] font-sans">
                  <th className="py-2 px-3">Fecha y Hora</th>
                  <th className="py-2 px-3">Acción</th>
                  <th className="py-2 px-3">Usuario</th>
                  <th className="py-2 px-3">Detalle del Evento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 px-3 text-slate-500">{new Date(log.timestamp).toLocaleString('es-AR')}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">{log.action}</td>
                    <td className="py-2 px-3 text-sky-600">{log.user}</td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SECCIÓN 6: SUITE DE PRUEBAS AUTOMATIZADAS (SECCIÓN 21) */}
      {activeSection === 'tests' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-sky-600" />
                  <span>Suite de Pruebas Automatizadas de Aceptación</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Verificación de parser CSV, calidad de datos, estadísticas circulares, seguridad por roles y auditoría.
                </p>
              </div>

              <button
                onClick={handleRunTests}
                disabled={runningTests}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                <Play className={`w-3.5 h-3.5 ${runningTests ? 'animate-spin' : ''}`} />
                <span>{runningTests ? 'Ejecutando...' : 'Ejecutar Suite de Pruebas'}</span>
              </button>
            </div>
          </div>

          {testResults && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Resultado Global:</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                    {testResults.passed} / {testResults.total} PRUEBAS SUPERADAS ({Math.round((testResults.passed / testResults.total) * 100)}%)
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Ejecutado: {new Date(testResults.executedAt).toLocaleTimeString('es-AR')}
                </div>
              </div>

              <div className="space-y-3">
                {testResults.results.map((r: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs ${
                      r.passed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold mb-1">
                      <div className="flex items-center gap-2">
                        {r.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span className="text-slate-900 dark:text-white">{r.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{r.durationMs}ms</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 ml-6">
                      {r.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
