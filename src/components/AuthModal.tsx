/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Modal de Autenticación de Operadores y Administradores (Claves Protegidas / Ocultas)
 */

import React, { useState } from 'react';
import { X, Lock, Shield, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { loginUser } from '../lib/api.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showInputPassword, setShowInputPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await loginUser(password);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Contraseña incorrecta');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (pwd: string) => {
    setPassword(pwd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl relative">
        <button
          onClick={onClose}
          aria-label="Cerrar ventana de autenticación"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Acceso Autorizado al Sistema
            </h3>
            <p className="text-xs text-slate-500">
              Colegio Secundario N.º 5085 «Dr. Mariano Moreno»
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Contraseña de Acceso:
            </label>
            <div className="relative">
              <input
                type={showInputPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ingrese clave de operador o administrador"
                required
                autoFocus
                className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowInputPassword(!showInputPassword)}
                title={showInputPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                {showInputPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50"
          >
            {loading ? 'Verificando...' : 'Acceder al Panel'}
          </button>
        </form>

        {/* Roles Institucionales con Claves Ocultas y Protegidas */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-semibold mb-2.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Niveles de acceso institucional (Credenciales protegidas):</span>
          </div>

          <div className="space-y-2">
            {/* Opción Rol Operador (clave oculta) */}
            <button
              type="button"
              onClick={() => handleQuickFill('alumno5085')}
              title="Cargar credencial protegida de Operador"
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 shrink-0">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Rol Operador (Estudiante / Docente)
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Carga de observaciones manuales y telemetría
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold tracking-widest bg-slate-200/60 dark:bg-slate-900/60 px-2 py-1 rounded select-none">
                <span>••••••••••</span>
              </div>
            </button>

            {/* Opción Rol Administrador (clave oculta) */}
            <button
              type="button"
              onClick={() => handleQuickFill('administrador5085')}
              title="Cargar credencial protegida de Administrador"
              className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Rol Administrador
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Gestión total, sincronización, calibración y auditorías
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 font-bold tracking-widest bg-slate-200/60 dark:bg-slate-900/60 px-2 py-1 rounded select-none">
                <span>•••••••••••••••••</span>
              </div>
            </button>
          </div>

          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2.5 text-center">
            🔒 Las contraseñas permanecen ocultas y protegidas por seguridad institucional.
          </p>
        </div>
      </div>
    </div>
  );
};
