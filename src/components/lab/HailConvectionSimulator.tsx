/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085 - Laboratorio
 * Simulador de Convección y Formación de Granizo
 * Asignaturas: Física (Termodinámica, Flotabilidad), Geografía (Tormentas Severas en Salta), Matemática (Energía Potencial CAPE)
 */

import React, { useState, useMemo } from 'react';
import { CloudLightning, Wind, Thermometer, ArrowUp, AlertTriangle, Info, BookOpen } from 'lucide-react';

export const HailConvectionSimulator: React.FC = () => {
  // Variables interactivas
  const [surfaceTemp, setSurfaceTemp] = useState<number>(33); // °C
  const [surfaceHumidity, setSurfaceHumidity] = useState<number>(75); // %
  const [capeEnergy, setCapeEnergy] = useState<number>(2400); // J/kg (CAPE)
  const [freezingLevelAlt, setFreezingLevelAlt] = useState<number>(3600); // msnm (Nivel isoterma 0°C)
  const [windShear, setWindShear] = useState<number>(24); // m/s (Cizalladura vertical 0-6km)

  // Cálculos físicos termodinámicos
  const simulation = useMemo(() => {
    // Velocidad máxima teórica de corriente ascendente: w_max = sqrt(2 * CAPE)
    const updraftSpeedMs = Math.round(Math.sqrt(2 * capeEnergy));
    const updraftSpeedKmh = Math.round(updraftSpeedMs * 3.6);

    // Punto de rocío de superficie aproximado (Fórmula de Magnus-Tetens)
    const a = 17.27;
    const b = 237.7;
    const alpha = (a * surfaceTemp) / (b + surfaceTemp) + Math.log(surfaceHumidity / 100);
    const dewPoint = Number(((b * alpha) / (a - alpha)).toFixed(1));

    // Nivel de condensación por ascenso (LCL aproximado en metros): LCL = 125 * (T - Td)
    const lclMeters = Math.max(300, Math.round(125 * (surfaceTemp - dewPoint)));

    // Espesor de la capa de crecimiento de granizo (-10°C a -30°C): aproximadamente 2800m por encima del nivel 0°C
    const hailGrowthZoneMeters = freezingLevelAlt + 1800;

    // Estimación del diámetro del granizo basada en la velocidad de la corriente ascendente
    // La velocidad terminal de una piedra de granizo es v_term ~ 9 * sqrt(d_cm)
    // Para que el granizo se sostenga y crezca, w >= v_term  =>  d_cm ~ (w / 9)^2 / 10
    // Factor de corrección con cizalladura (la cizalladura separa la corriente ascendente de la descendente, permitiendo que la tormenta sea supercelular y el granizo crezca mucho más)
    const shearFactor = Math.min(1.8, Math.max(0.6, windShear / 20));
    const theoreticalDiameterMm = Math.max(
      0,
      Math.min(95, Math.round(Math.pow(updraftSpeedMs / 11.5, 1.8) * shearFactor * (surfaceHumidity / 70)))
    );

    // Categorización de severidad
    let severityLabel = 'Sin probabilidad de granizo';
    let severityColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200';
    let hailDesc = 'Precipitación líquida normal o granizo blando muy pequeño (< 5 mm) que se funde antes de tocar tierra.';
    let radarDbf = 35;

    if (theoreticalDiameterMm >= 50) {
      severityLabel = 'Tormenta Supercelular Severa (Granizo Destructivo)';
      severityColor = 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-300';
      hailDesc = `Granizo gigante tipo pelota de tenis o béisbol (~${theoreticalDiameterMm} mm). Capaz de perforar techos de chapa, quebrar parabrisas y destruir completamente cultivos de tabaco y caña.`;
      radarDbf = 68;
    } else if (theoreticalDiameterMm >= 25) {
      severityLabel = 'Tormenta Convectiva Fuerte (Granizo Dañino)';
      severityColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
      hailDesc = `Granizo mediano a grande (~${theoreticalDiameterMm} mm, tipo moneda de 2 pesos a pelota de golf). Daños severos en hojas de hortalizas y tabaco, abolladuras en vehículos.`;
      radarDbf = 58;
    } else if (theoreticalDiameterMm >= 10) {
      severityLabel = 'Tormenta Moderada (Granizo Chico / Garrotillo)';
      severityColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      hailDesc = `Granizo pequeño (~${theoreticalDiameterMm} mm, tamaño arveja a avellana). Daños leves en follaje tierno; acumulación rápida en desagües.`;
      radarDbf = 48;
    }

    return {
      updraftSpeedMs,
      updraftSpeedKmh,
      dewPoint,
      lclMeters,
      hailGrowthZoneMeters,
      theoreticalDiameterMm,
      severityLabel,
      severityColor,
      hailDesc,
      radarDbf,
    };
  }, [surfaceTemp, surfaceHumidity, capeEnergy, freezingLevelAlt, windShear]);

  return (
    <div className="space-y-6">
      {/* Explicación y encabezado */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1">
          <CloudLightning className="w-5 h-5" />
          <span>Física Atmosférica: Termodinámica de Convección Profunda y Granizo</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          El granizo se genera cuando intensas <strong>corrientes ascendentes térmicas</strong> suspenden gotas de agua sobreenfriada a temperaturas muy por debajo de 0°C (hasta -30°C). Cada recirculación acumula capas concéntricas de hielo transparente y lechoso por <em>acreción</em>. La piedra caerá a tierra solo cuando su peso supere la fuerza de sustentación de la corriente ascendente (F_gravedad &gt; F_ascenso).
        </p>
      </div>

      {/* Controles de Entrada (Sliders de Variables) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Temperatura en Superficie */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              Temp. Superficie (T_sup)
            </span>
            <span className="font-mono font-bold text-orange-600">{surfaceTemp} °C</span>
          </div>
          <input
            type="range"
            min="15"
            max="42"
            step="1"
            value={surfaceTemp}
            onChange={(e) => setSurfaceTemp(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>15°C (Fresco)</span>
            <span>28°C (Típico verano)</span>
            <span>42°C (Onda cálida)</span>
          </div>
        </div>

        {/* Humedad Relativa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Humedad Relativa (HR_sup)
            </span>
            <span className="font-mono font-bold text-sky-600">{surfaceHumidity} %</span>
          </div>
          <input
            type="range"
            min="20"
            max="95"
            step="1"
            value={surfaceHumidity}
            onChange={(e) => setSurfaceHumidity(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>20% (Seco)</span>
            <span>65% (Moderado)</span>
            <span>95% (Saturación)</span>
          </div>
        </div>

        {/* CAPE (Convective Available Potential Energy) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <ArrowUp className="w-4 h-4 text-rose-500" />
              Inestabilidad CAPE
            </span>
            <span className="font-mono font-bold text-rose-600">{capeEnergy} J/kg</span>
          </div>
          <input
            type="range"
            min="200"
            max="4500"
            step="100"
            value={capeEnergy}
            onChange={(e) => setCapeEnergy(Number(e.target.value))}
            className="w-full accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>&lt; 500 (Baja)</span>
            <span>2000 (Fuerte)</span>
            <span>&gt; 3500 (Extrema)</span>
          </div>
        </div>

        {/* Altura Isoterma 0°C */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Nivel de Congelación (0°C)
            </span>
            <span className="font-mono font-bold text-cyan-600">{freezingLevelAlt} msnm</span>
          </div>
          <input
            type="range"
            min="2200"
            max="4800"
            step="100"
            value={freezingLevelAlt}
            onChange={(e) => setFreezingLevelAlt(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>2200m (Bajo, +fácil que llegue)</span>
            <span>4800m (Muy alto)</span>
          </div>
        </div>

        {/* Cizalladura Vertical del Viento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 md:col-span-2 lg:col-span-2">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Wind className="w-4 h-4 text-indigo-500" />
              Cizalladura Vertical (0-6 km Shear)
            </span>
            <span className="font-mono font-bold text-indigo-600">{windShear} m/s</span>
          </div>
          <input
            type="range"
            min="5"
            max="45"
            step="1"
            value={windShear}
            onChange={(e) => setWindShear(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>&lt; 10 m/s (Tormenta unicelular de vida corta)</span>
            <span>20 m/s (Línea multicelular)</span>
            <span>&gt; 30 m/s (Supercelda rotatoria con meso-ciclón)</span>
          </div>
        </div>
      </div>

      {/* RESULTADOS DE LA SIMULACIÓN Y DIAGRAMA FÍSICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagrama Esquemático del Cumulonimbus */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 text-white relative overflow-hidden">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-sky-400">
              Corte Vertical de la Nube (Cumulonimbus Calvus / Incus)
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Topotropósfera: ~14.000m
            </span>
          </div>

          {/* Canvas SVG de la tormenta */}
          <div className="w-full h-64 relative bg-linear-to-b from-slate-900 via-sky-950 to-slate-900 rounded-lg p-2 border border-slate-800/80">
            <svg viewBox="0 0 500 240" className="w-full h-full">
              {/* Línea de suelo */}
              <rect x="0" y="220" width="500" height="20" fill="#1e293b" />
              <text x="15" y="234" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                General Güemes (695 msnm) · T: {surfaceTemp}°C · Td: {simulation.dewPoint}°C
              </text>

              {/* Nivel de condensación LCL */}
              <line x1="0" y1="180" x2="500" y2="180" stroke="#38bdf8" strokeDasharray="3 3" strokeWidth="1" />
              <text x="350" y="175" fill="#38bdf8" fontSize="9">
                Base nube (LCL ~{simulation.lclMeters}m)
              </text>

              {/* Nivel 0°C isoterma */}
              <line x1="0" y1="120" x2="500" y2="120" stroke="#06b6d4" strokeDasharray="4 4" strokeWidth="1.2" />
              <text x="10" y="115" fill="#06b6d4" fontSize="9" fontWeight="bold">
                Isoterma 0°C (~{freezingLevelAlt}m)
              </text>

              {/* Zona de crecimiento de granizo (-10°C a -30°C) */}
              <rect x="120" y="40" width="220" height="70" fill="#a855f7" fillOpacity="0.15" stroke="#a855f7" strokeDasharray="2 2" strokeWidth="1" />
              <text x="130" y="55" fill="#e9d5ff" fontSize="9" fontWeight="bold">
                Zona de Crecimiento (-10°C a -30°C)
              </text>
              <text x="130" y="68" fill="#d8b4fe" fontSize="8">
                Gotas de agua sobreenfriada + Cristales
              </text>

              {/* Cuerpo del Cumulonimbus */}
              <path
                d="M 100 210 Q 80 160 110 130 Q 90 90 140 60 Q 200 20 280 25 Q 370 20 410 70 Q 430 110 400 150 Q 410 190 380 210 Z"
                fill="#334155"
                fillOpacity="0.35"
                stroke="#64748b"
                strokeWidth="1.5"
              />

              {/* Flecha de corriente ascendente térmica (Updraft) */}
              <path
                d="M 200 210 Q 210 150 240 80"
                fill="none"
                stroke="#f43f5e"
                strokeWidth={Math.min(10, Math.max(3, simulation.updraftSpeedMs / 7))}
                strokeLinecap="round"
                strokeDasharray="6 4"
              />
              <polygon points="240,75 235,90 248,87" fill="#f43f5e" />
              <text x="255" y="100" fill="#f43f5e" fontSize="10" fontWeight="bold">
                Updraft: {simulation.updraftSpeedMs} m/s ({simulation.updraftSpeedKmh} km/h)
              </text>

              {/* Representación de piedras de granizo cayendo si diámetro > 5mm */}
              {simulation.theoreticalDiameterMm > 5 && (
                <g>
                  {/* Granizo 1 */}
                  <circle
                    cx="330"
                    cy="140"
                    r={Math.min(12, Math.max(3, simulation.theoreticalDiameterMm / 4))}
                    fill="#e0f2fe"
                    stroke="#38bdf8"
                    strokeWidth="1.5"
                  />
                  {/* Granizo 2 */}
                  <circle
                    cx="355"
                    cy="180"
                    r={Math.min(14, Math.max(3, simulation.theoreticalDiameterMm / 3.8))}
                    fill="#ffffff"
                    stroke="#38bdf8"
                    strokeWidth="2"
                  />
                  {/* Granizo 3 tocando tierra */}
                  <circle
                    cx="370"
                    cy="215"
                    r={Math.min(15, Math.max(4, simulation.theoreticalDiameterMm / 3.5))}
                    fill="#f0f9ff"
                    stroke="#0284c7"
                    strokeWidth="2"
                  />
                  <line x1="330" y1="120" x2="330" y2="135" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="355" y1="160" x2="355" y2="175" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <line x1="370" y1="195" x2="370" y2="210" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="385" y="215" fill="#38bdf8" fontSize="10" fontWeight="bold">
                    Ø ~{simulation.theoreticalDiameterMm} mm
                  </text>
                </g>
              )}
            </svg>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px] text-slate-400">
            <div>
              Fórmula de velocidad ascendente límite: <code className="text-amber-400 font-mono">w_max = √(2·CAPE)</code>
            </div>
            <div>
              Reflectividad esperada: <strong className="text-sky-400 font-mono">{simulation.radarDbf} dBZ</strong>
            </div>
          </div>
        </div>

        {/* Diagnóstico y Salidas de la Simulación */}
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${simulation.severityColor}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Diagnóstico de Severidad</span>
            </div>
            <div className="text-base font-bold mb-1">
              {simulation.severityLabel}
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              {simulation.hailDesc}
            </p>
          </div>

          {/* Métricas clave calculadas */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-sans text-slate-500">Velocidad Ascendente:</span>
              <span className="font-bold text-rose-600 text-sm">
                {simulation.updraftSpeedMs} m/s ({simulation.updraftSpeedKmh} km/h)
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-sans text-slate-500">Diámetro Granizo:</span>
              <span className="font-bold text-sky-600 text-sm">
                {simulation.theoreticalDiameterMm} mm
              </span>
            </div>

            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="font-sans text-slate-500">Punto de Rocío ($T_d$):</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {simulation.dewPoint} °C
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="font-sans text-slate-500">Base Nubosa estimada:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {simulation.lclMeters} msnm
              </span>
            </div>
          </div>

          {/* Guía Pedagógica Interdisciplinaria */}
          <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900 rounded-xl text-xs text-sky-900 dark:text-sky-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Para trabajar en el aula:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
              <li><strong>Física:</strong> ¿Por qué al aumentar el CAPE a 3500 J/kg la velocidad del viento vertical supera los 80 m/s (288 km/h)?</li>
              <li><strong>Geografía:</strong> En los meses de diciembre a marzo en Salta, ¿por qué el calentamiento solar del suelo vespertino sumado a la humedad del Atlántico genera este tipo de tormentas?</li>
              <li><strong>Biología y Agronomía:</strong> ¿Cómo impacta una granizada de 25 mm en las hojas anchas del tabaco Virginia en el Valle de Siancas?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
