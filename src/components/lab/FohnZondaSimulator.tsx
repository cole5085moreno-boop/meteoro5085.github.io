/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085 - Laboratorio
 * Simulador de Efecto Föhn y Viento Zonda en el NOA
 * Asignaturas: Física (Termodinámica, Procesos Adiabáticos, Calor Latente de Condensación), Geografía (Viento Zonda, Cordillera de los Andes, Sombra de Lluvia, Riesgo de Incendios en Salta)
 */

import React, { useState, useMemo } from 'react';
import { Wind, Mountain, Flame, Droplets, Thermometer, ArrowRight, AlertTriangle, BookOpen, Info } from 'lucide-react';

export const FohnZondaSimulator: React.FC = () => {
  // Variables interactivas
  const [mountainPeakAlt, setMountainPeakAlt] = useState<number>(3800); // msnm (Cordillera Oriental / Cumbres Calchaquíes)
  const [windwardStartTemp, setWindwardStartTemp] = useState<number>(16); // °C (Nivel mar / base a barlovento)
  const [windwardStartHumidity, setWindwardStartHumidity] = useState<number>(85); // %
  const leewardValleyAlt = 695; // General Güemes (695 msnm)

  // Gradientes térmicos adiabáticos estándar de la física atmosférica:
  const DRY_ADIABATIC_LAPSE_RATE = 9.8 / 1000; // 9.8 °C por cada 1000m (°C/m)
  const MOIST_ADIABATIC_LAPSE_RATE = 5.5 / 1000; // 5.5 °C por cada 1000m (por liberación de calor latente Lv ~ 2.5e6 J/kg)

  // Cálculos del Efecto Föhn / Zonda
  const simulation = useMemo(() => {
    // 1. Punto de rocío a barlovento
    const a = 17.27;
    const b = 237.7;
    const alpha = (a * windwardStartTemp) / (b + windwardStartTemp) + Math.log(windwardStartHumidity / 100);
    const dewPointStart = (b * alpha) / (a - alpha);

    // 2. Nivel de Condensación por Ascenso (LCL / NCA en metros sobre el punto de partida):
    // LCL = 125 * (T - Td)
    const lclElevation = Math.max(200, Math.min(mountainPeakAlt - 200, Math.round(125 * (windwardStartTemp - dewPointStart))));

    // 3. Temperatura al alcanzar la base de la nube (LCL): Ascenso adiabático seco
    const tempAtLCL = windwardStartTemp - (lclElevation * DRY_ADIABATIC_LAPSE_RATE);

    // 4. Ascenso desde LCL hasta la cumbre montañosa: Ascenso adiabático saturado (liberación de calor latente)
    const saturatedAscentDistance = Math.max(0, mountainPeakAlt - lclElevation);
    const tempAtPeak = tempAtLCL - (saturatedAscentDistance * MOIST_ADIABATIC_LAPSE_RATE);

    // 5. Precipitación orográfica en barlovento: humedad que se pierde al llover en la montaña
    const moistureLossGrams = Math.round(saturatedAscentDistance * 0.0035 * 10) / 10;

    // 6. Descenso a sotavento desde la cumbre (mountainPeakAlt) hasta General Güemes (695 msnm):
    // El aire desciende comprimiéndose adiabáticamente seco todo el trayecto (9.8 °C/km)
    const descentDistance = Math.max(0, mountainPeakAlt - leewardValleyAlt);
    const tempAtValley = Number((tempAtPeak + (descentDistance * DRY_ADIABATIC_LAPSE_RATE)).toFixed(1));

    // 7. Humedad relativa final en el valle de Güemes:
    // Al calentarse enormemente sin añadir vapor, la presión de vapor de saturación se dispara y la HR se desploma
    // Relación Clausius-Clapeyron simplificada:
    const finalHumidity = Math.max(5, Math.min(95, Math.round(windwardStartHumidity * Math.exp(-0.068 * (tempAtValley - windwardStartTemp)) * 0.45)));

    // 8. Calentamiento neto por efecto Föhn:
    const netWarmingDelta = Number((tempAtValley - windwardStartTemp).toFixed(1));

    // Índice de peligro de incendios forestales
    let fireRisk = 'Bajo';
    let fireColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    if (finalHumidity <= 15 && tempAtValley >= 30) {
      fireRisk = '¡Extremo (Alerta Roja de Incendios)!';
      fireColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
    } else if (finalHumidity <= 25 || tempAtValley >= 28) {
      fireRisk = 'Muy Alto (Peligro de Fuego)';
      fireColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
    } else if (finalHumidity <= 40) {
      fireRisk = 'Moderado';
      fireColor = 'text-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300';
    }

    return {
      dewPointStart: Number(dewPointStart.toFixed(1)),
      lclElevation,
      tempAtLCL: Number(tempAtLCL.toFixed(1)),
      tempAtPeak: Number(tempAtPeak.toFixed(1)),
      tempAtValley,
      finalHumidity,
      netWarmingDelta,
      moistureLossGrams,
      fireRisk,
      fireColor,
    };
  }, [mountainPeakAlt, windwardStartTemp, windwardStartHumidity]);

  return (
    <div className="space-y-6">
      {/* Explicación Pedagógica */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1">
          <Wind className="w-5 h-5 text-indigo-500" />
          <span>Física y Geografía del NOA: Termodinámica del Efecto Föhn y Viento Zonda</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          El <strong>Viento Zonda</strong> es la manifestación clásica del efecto Föhn en los valles de Salta, Jujuy, San Juan y Mendoza. Cuando una masa de aire húmeda se ve obligada a remontar la cordillera, se enfría y condensa su vapor de agua, <strong>liberando una enorme cantidad de calor latente de condensación</strong> (2.5 × 10⁶ J/kg). Al trasponer la cumbre y descender hacia General Güemes, el aire seco se <strong>comprime adiabáticamente a razón de 9.8 °C por cada 1000 metros</strong>, llegando al valle recalentado, turbulento y con humedades extremadamente bajas (&lt; 15%).
        </p>
      </div>

      {/* Controles de Variables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Altura de la Cordillera / Precordillera */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Mountain className="w-4 h-4 text-slate-500" />
              Altura Cumbre Cordillerana
            </span>
            <span className="font-mono font-bold text-indigo-600">{mountainPeakAlt} msnm</span>
          </div>
          <input
            type="range"
            min="1800"
            max="4800"
            step="100"
            value={mountainPeakAlt}
            onChange={(e) => setMountainPeakAlt(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1800m (Sierras bajas)</span>
            <span>3800m (Cumbres Calchaquíes)</span>
            <span>4800m (Alta Puna)</span>
          </div>
        </div>

        {/* Temperatura a Barlovento (Inicio) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              Temp. Inicial Barlovento ($T_0$)
            </span>
            <span className="font-mono font-bold text-orange-600">{windwardStartTemp} °C</span>
          </div>
          <input
            type="range"
            min="8"
            max="26"
            step="1"
            value={windwardStartTemp}
            onChange={(e) => setWindwardStartTemp(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>8°C (Aire frío)</span>
            <span>16°C (Pacífico medio)</span>
            <span>26°C (Cálido)</span>
          </div>
        </div>

        {/* Humedad Inicial a Barlovento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Droplets className="w-4 h-4 text-sky-500" />
              Humedad Relativa Inicial ($HR_0$)
            </span>
            <span className="font-mono font-bold text-sky-600">{windwardStartHumidity} %</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="1"
            value={windwardStartHumidity}
            onChange={(e) => setWindwardStartHumidity(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>50% (Poco vapor)</span>
            <span>85% (Húmedo marino)</span>
            <span>95% (Casi saturado)</span>
          </div>
        </div>
      </div>

      {/* DIAGRAMA PERFIL TOPOGRÁFICO Y FÍSICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagrama Esquemático de la Montaña y Termodinámica */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-sky-400">
              Perfil Termodinámico Transcordillerano
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Efecto Föhn / Zonda en el NOA
            </span>
          </div>

          <div className="w-full h-64 relative bg-linear-to-b from-sky-950/80 via-slate-900 to-slate-950 rounded-lg p-2 border border-slate-800">
            <svg viewBox="0 0 540 240" className="w-full h-full">
              {/* Relieve Montañoso */}
              <polygon
                points="0,220 220,60 540,220"
                fill="#1e293b"
                stroke="#475569"
                strokeWidth="2"
              />

              {/* Lado Barlovento (Izquierda) */}
              <text x="15" y="210" fill="#93c5fd" fontSize="10" fontWeight="bold">
                Barlovento (Océano)
              </text>
              <text x="15" y="225" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                T: {windwardStartTemp}°C · HR: {windwardStartHumidity}%
              </text>

              {/* Flecha de Ascenso Barlovento */}
              <path d="M 30 200 Q 110 150 160 110" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="5 3" />
              <polygon points="160,105 152,118 165,115" fill="#38bdf8" />
              <text x="60" y="145" fill="#38bdf8" fontSize="8">
                Gradiente seco: -9.8°C/km
              </text>

              {/* Nube Orográfica y Lluvia en Cumbre */}
              <path
                d="M 160 110 Q 180 80 220 50 Q 250 80 240 110 Z"
                fill="#64748b"
                fillOpacity="0.5"
                stroke="#94a3b8"
                strokeWidth="1.5"
              />
              <text x="150" y="70" fill="#f8fafc" fontSize="9" fontWeight="bold">
                Lluvia Orográfica (Lv)
              </text>
              <text x="140" y="82" fill="#bae6fd" fontSize="8">
                Gradiente húmedo: -5.5°C/km
              </text>

              {/* Cumbre de la montaña */}
              <circle cx="220" cy="60" r="4" fill="#ef4444" />
              <text x="230" y="55" fill="#fca5a5" fontSize="10" fontWeight="bold">
                Cumbre ({mountainPeakAlt}m): {simulation.tempAtPeak}°C
              </text>

              {/* Flecha de Descenso Zonda a Sotavento (Derecha) */}
              <path d="M 240 70 Q 360 140 450 200" fill="none" stroke="#f43f5e" strokeWidth="4" />
              <polygon points="455,205 440,195 448,190" fill="#f43f5e" />
              <text x="320" y="125" fill="#fb7185" fontSize="9" fontWeight="bold">
                Compresión Adiabática Seca (+9.8°C/km)
              </text>
              <text x="320" y="138" fill="#fda4af" fontSize="8">
                Pérdida drástica de humedad relativa
              </text>

              {/* Llegada a General Güemes (Sotavento) */}
              <rect x="420" y="200" width="115" height="35" rx="4" fill="#0f172a" stroke="#e11d48" strokeWidth="1.5" />
              <text x="428" y="214" fill="#f43f5e" fontSize="10" fontWeight="bold">
                General Güemes ({leewardValleyAlt}m)
              </text>
              <text x="428" y="228" fill="#fecdd3" fontSize="10" fontFamily="monospace" fontWeight="bold">
                T: {simulation.tempAtValley}°C · HR: {simulation.finalHumidity}%
              </text>
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 text-xs font-mono">
            <div className="text-slate-400">
              Calentamiento neto Föhn: <strong className="text-amber-400">+{simulation.netWarmingDelta} °C</strong>
            </div>
            <div className="text-slate-400">
              Base de la nube (LCL): <strong className="text-sky-400">~{simulation.lclElevation} m</strong>
            </div>
          </div>
        </div>

        {/* Diagnóstico y Riesgo de Incendios en Salta */}
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${simulation.fireColor}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
              <Flame className="w-4 h-4 shrink-0" />
              <span>Riesgo de Incendios Forestales</span>
            </div>
            <div className="text-base font-bold mb-1">
              {simulation.fireRisk}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {simulation.finalHumidity <= 20
                ? 'El aire extremadamente desecado deshidrata el pasto seco y monte nativo en cuestión de horas. Máximo peligro de propagación explosiva por ráfagas violentas.'
                : 'Condiciones de Zonda moderadas a leves. Mantener monitoreo preventivo de quemas.'}
            </p>
          </div>

          {/* Tarjeta de Valores Finales en Güemes */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-sans text-slate-500">Temperatura en Güemes:</span>
              <span className="font-bold text-rose-600 text-sm">
                {simulation.tempAtValley} °C
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-sans text-slate-500">Humedad en Güemes:</span>
              <span className="font-bold text-amber-600 text-sm">
                {simulation.finalHumidity} %
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-sans text-slate-500">Diferencia Térmica ($\Delta T$):</span>
              <span className="font-bold text-indigo-600 text-sm">
                +{simulation.netWarmingDelta} °C
              </span>
            </div>
          </div>

          {/* Guía Pedagógica Interdisciplinaria */}
          <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 rounded-xl text-xs text-purple-900 dark:text-purple-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-purple-600" />
              <span>Preguntas para Física y Geografía:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-purple-800 dark:text-purple-300">
              <li><strong>Física:</strong> ¿Por qué el aire sube a razón de -5.5°C/km dentro de la nube pero baja a +9.8°C/km a sotavento? ¿De dónde provino la energía térmica neta extra?</li>
              <li><strong>Geografía:</strong> ¿Por qué los meses de agosto a noviembre son los más propensos a episodios de Zonda en Salta y qué impacto tiene en los incendios de pastizales?</li>
              <li><strong>Salud y Sociedad:</strong> ¿Por qué el viento Zonda produce cefaleas, irritabilidad y descompensaciones en personas con problemas circulatorios o respiratorios?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
