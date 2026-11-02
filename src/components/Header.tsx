/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Barra de navegación principal (cumple estrictamente el Top Bar Contract de 3 zonas)
 */

import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  FlaskConical,
  ShieldCheck,
  RotateCw,
  LogOut,
  User,
  Sun,
  Moon,
  MapPin,
} from 'lucide-react';
import type { UserRole } from '../types/weather.ts';

export type ActiveTab = 'dashboard' | 'map' | 'stats' | 'reports' | 'lab' | 'admin';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: { username: string; name: string; role: UserRole } | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSync: () => void;
  isSyncing: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onSync,
  isSyncing,
  theme,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-6 h-16">
          {/* ZONA 1: Wordmark / Título de Marca en una sola línea */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                5085
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold text-slate-900 dark:text-white tracking-tight whitespace-nowrap group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Estación Meteorológica Colegio 5085
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  Colegio Secundario Dr. Mariano Moreno · General Güemes
                </span>
              </div>
            </button>
          </div>

          {/* ZONA 2: Enlaces de navegación principales */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'dashboard'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'map'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4 text-sky-500" />
              <span>Mapa Geográfico</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'stats'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Estadísticas</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'reports'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Informes</span>
            </button>

            <button
              onClick={() => setActiveTab('lab')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'lab'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FlaskConical className="w-4 h-4" />
              <span>Laboratorio</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                activeTab === 'admin'
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Administración</span>
            </button>
          </nav>

          {/* ZONA 3: Acción primaria & Toggle de Modo Día / Noche */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Toggle Modo Día / Modo Noche */}
            <button
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Modo Día</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden sm:inline">Modo Noche</span>
                </>
              )}
            </button>

            <button
              onClick={onSync}
              disabled={isSyncing}
              title="Sincronizar datos con estación meteorológica"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-sky-600' : ''}`} />
              <span className="hidden md:inline">Sincronizar</span>
            </button>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800">
                  <User className="w-3.5 h-3.5 text-sky-600" />
                  <span className="font-semibold capitalize">{currentUser.role}</span>
                </div>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white text-xs font-semibold tracking-wide transition-colors whitespace-nowrap shadow-sm"
              >
                Acceso Operador
              </button>
            )}
          </div>
        </div>

        {/* Barra de navegación móvil */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-100 dark:border-slate-800 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'dashboard'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'map' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Mapa
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'stats' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Estadísticas
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'reports'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Informes
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'lab' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Laboratorio
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`px-2.5 py-1 rounded whitespace-nowrap font-medium ${
              activeTab === 'admin' ? 'bg-sky-600 text-white' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            Admin
          </button>
        </div>
      </div>
    </header>
  );
};
