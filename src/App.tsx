/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Aplicación Web Oficial para la Estación Meteorológica Automática (Ecowitt ID: 364053)
 * Colegio Secundario N.º 5085 «Dr. Mariano Moreno» · General Güemes, Salta, Argentina
 */

import React, { useState, useEffect } from 'react';
import { Header, type ActiveTab } from './components/Header.tsx';
import { StationStatusBanner } from './components/StationStatusBanner.tsx';
import { MetricCardsGrid } from './components/MetricCardsGrid.tsx';
import { LiveChartsSection } from './components/LiveChartsSection.tsx';
import { StatisticalAnalysisView } from './components/StatisticalAnalysisView.tsx';
import { StationGeoMap } from './components/StationGeoMap.tsx';
import { ForecastView } from './components/ForecastView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { EducationalLabView } from './components/EducationalLabView.tsx';
import { AdminPanelView } from './components/AdminPanelView.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import type { StationConfig, SyncRun, WeatherObservation, UserRole } from './types/weather.ts';
import {
  fetchStationStatus,
  fetchObservations,
  triggerManualSync,
  getStoredUser,
  clearAuthSession,
} from './lib/api.ts';
import { ExternalLink, Database, Activity, MapPin } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [station, setStation] = useState<StationConfig | null>(null);
  const [latestObs, setLatestObs] = useState<WeatherObservation | null>(null);
  const [prevObs, setPrevObs] = useState<WeatherObservation | null>(null);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [lastSync, setLastSync] = useState<SyncRun | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'Actualizado' | 'Actualización pendiente' | 'Datos desactualizados' | 'Fuente no disponible'
  >('Actualizado');
  const [dataAgeMinutes, setDataAgeMinutes] = useState<number>(0);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Modo Día / Modo Noche con persistencia
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('ema5085_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('ema5085_theme', theme);
    } catch (e) {
      console.error('Error al guardar tema:', e);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const [currentUser, setCurrentUser] = useState<{
    username: string;
    name: string;
    role: UserRole;
  } | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);

  // Cargar sesión almacenada
  useEffect(() => {
    const user = getStoredUser();
    if (user) setCurrentUser(user);
  }, []);

  // Cargar datos de la estación
  const loadData = async () => {
    try {
      const statusRes = await fetchStationStatus();
      setStation(statusRes.station);
      setLatestObs(statusRes.latest_observation);
      setLastSync(statusRes.last_sync);
      setConnectionStatus(statusRes.connection_status);
      setDataAgeMinutes(statusRes.data_age_minutes);
      setTotalRecords(statusRes.total_records);

      const obsRes = await fetchObservations({ limit: 120 });
      setObservations(obsRes);
      if (obsRes.length >= 2) {
        setPrevObs(obsRes[obsRes.length - 2]);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setConnectionStatus('Fuente no disponible');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Actualizar cada 60 segundos el dashboard
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async (force: boolean = false) => {
    setIsSyncing(true);
    try {
      await triggerManualSync(force);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Error en la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header con contrato estricto de 3 zonas y selector Día/Noche */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onSync={() => handleManualSync(false)}
        isSyncing={isSyncing}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* 2. Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {initialLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mb-4" />
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Conectando con la Estación Meteorológica Colegio 5085...
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Recuperando observaciones reales desde la fuente de INTA Salta
            </p>
          </div>
        ) : (
          <>
            {/* VISTA 1: DASHBOARD PRINCIPAL */}
            {activeTab === 'dashboard' && (
              <div>
                <StationStatusBanner
                  station={station}
                  latestObservation={latestObs}
                  lastSync={lastSync}
                  connectionStatus={connectionStatus}
                  dataAgeMinutes={dataAgeMinutes}
                  totalRecords={totalRecords}
                  onNavigateToAdmin={() => setActiveTab('admin')}
                  onForceSync={() => handleManualSync(true)}
                />

                <MetricCardsGrid
                  observation={latestObs}
                  prevObservation={prevObs}
                />

                {/* MAPA GEOGRÁFICO CON SUPERPOSICIÓN DE TEMPERATURA, HUMEDAD, PRESIÓN, VIENTO Y LLUVIA */}
                <StationGeoMap
                  station={station}
                  observation={latestObs}
                  theme={theme}
                />

                <LiveChartsSection observations={observations} />

                {/* Tabla de registros recientes */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-sky-600" />
                      <span>Últimas Mediciones de la Estación Automática</span>
                    </h3>
                    <button
                      onClick={() => setActiveTab('stats')}
                      className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold"
                    >
                      Ver análisis estadístico completo →
                    </button>
                  </div>

                  <div className="overflow-x-auto text-xs font-mono">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[11px] font-sans">
                          <th className="py-2.5 px-3">Hora Observación</th>
                          <th className="py-2.5 px-3 text-right">Temp (°C)</th>
                          <th className="py-2.5 px-3 text-right">Sensación (°C)</th>
                          <th className="py-2.5 px-3 text-right">Humedad (%)</th>
                          <th className="py-2.5 px-3 text-right">VPD (kPa)</th>
                          <th className="py-2.5 px-3 text-right">Radiación (W/m²)</th>
                          <th className="py-2.5 px-3 text-right">UV</th>
                          <th className="py-2.5 px-3 text-right">Viento (km/h)</th>
                          <th className="py-2.5 px-3 text-right">Presión (hPa)</th>
                          <th className="py-2.5 px-3">Estado Cielo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                        {observations.slice(-10).reverse().map((o) => (
                          <tr key={o.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                            <td className="py-2 px-3 font-semibold text-slate-700 dark:text-slate-300">
                              {o.observed_at}
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-white">
                              {o.temperature_c !== null ? `${o.temperature_c.toFixed(1)}°` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600 dark:text-slate-400">
                              {o.feels_like_c !== null ? `${o.feels_like_c.toFixed(1)}°` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right text-blue-600 font-semibold">
                              {o.relative_humidity_pct !== null ? `${Math.round(o.relative_humidity_pct)}%` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600">
                              {o.vapor_pressure_deficit_kpa !== null ? o.vapor_pressure_deficit_kpa.toFixed(3) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right text-amber-600">
                              {o.solar_radiation_wm2 !== null ? o.solar_radiation_wm2.toFixed(1) : '—'}
                            </td>
                            <td className="py-2 px-3 text-right">
                              {o.uv_index !== null ? o.uv_index : '—'}
                            </td>
                            <td className="py-2 px-3 text-right text-cyan-600 font-semibold">
                              {o.wind_speed_kmh !== null ? `${o.wind_speed_kmh.toFixed(1)}` : '—'}
                            </td>
                            <td className="py-2 px-3 text-right text-indigo-600">
                              {o.pressure_relative_hpa !== null ? o.pressure_relative_hpa.toFixed(1) : '—'}
                            </td>
                            <td className="py-2 px-3 font-sans text-[11px] text-slate-600 dark:text-slate-300">
                              {o.sky_condition}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VISTA: PRONÓSTICO METEOROLÓGICO OFICIAL E IMÁGENES SATELITALES */}
            {activeTab === 'forecast' && (
              <ForecastView
                lastSyncTimestamp={lastSync?.completed_at || latestObs?.observed_at}
                theme={theme}
              />
            )}

            {/* VISTA DE MAPA GEOGRÁFICO DEDICADO */}
            {activeTab === 'map' && (
              <div className="space-y-6">
                <StationStatusBanner
                  station={station}
                  latestObservation={latestObs}
                  lastSync={lastSync}
                  connectionStatus={connectionStatus}
                  dataAgeMinutes={dataAgeMinutes}
                  totalRecords={totalRecords}
                  onNavigateToAdmin={() => setActiveTab('admin')}
                  onForceSync={() => handleManualSync(true)}
                />
                <StationGeoMap
                  station={station}
                  observation={latestObs}
                  theme={theme}
                />
              </div>
            )}

            {/* VISTA 2: ANÁLISIS ESTADÍSTICO */}
            {activeTab === 'stats' && <StatisticalAnalysisView />}

            {/* VISTA 3: INFORMES */}
            {activeTab === 'reports' && <ReportsView />}

            {/* VISTA 4: LABORATORIO EDUCATIVO */}
            {activeTab === 'lab' && <EducationalLabView />}

            {/* VISTA 5: PANEL ADMINISTRATIVO */}
            {activeTab === 'admin' && (
              <AdminPanelView
                currentUser={currentUser}
                onOpenLogin={() => setAuthModalOpen(true)}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Footer Institucional Oficial */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <span className="font-semibold text-slate-900 dark:text-white">
              Proyecto Estación Meteorológica Colegio 5085
            </span>
            <span className="hidden sm:inline" aria-hidden="true">·</span>
            <span>Colegio Secundario N.º 5085 «Dr. Mariano Moreno» (Sarmiento 351, General Güemes, Salta)</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="font-mono">Zona Horaria: America/Argentina/Salta</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://www.ecowitt.net/home/share?authorize=5MMNHG&device_id=YkliaG1nckQ4RFlBZWE5YWFRWEMrZz09"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-600 hover:underline font-semibold"
            >
              <span>Fuente Ecowitt.net (En vivo)</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Modal de Autenticación */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setActiveTab('admin');
        }}
      />
    </div>
  );
}
