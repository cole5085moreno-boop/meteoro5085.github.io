/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085 - Laboratorio
 * Simulador de Efecto Invernadero y Balance Radiativo Planetario
 * Asignaturas: Física (Ley de Stefan-Boltzmann, Radiación Infrarroja), Geografía (Cambio Climático, Glaciares), Biología (Ciclo del Carbono)
 */

import React, { useState, useMemo } from 'react';
import { Flame, Globe, Zap, Sun, Cloud, Layers, Info, BookOpen, AlertCircle } from 'lucide-react';

export const GreenhouseEffectSimulator: React.FC = () => {
  // Variables interactivas
  const [co2Ppm, setCo2Ppm] = useState<number>(425); // ppm (Actual ~425 ppm, preindustrial 280 ppm)
  const [methanePpb, setMethanePpb] = useState<number>(1920); // ppb (Actual ~1920 ppb, preindustrial 720 ppb)
  const [waterVaporPct, setWaterVaporPct] = useState<number>(100); // % respecto al nivel actual (feedback positivo)
  const [albedoPercent, setAlbedoPercent] = useState<number>(30); // % de albedo planetario medio (~30%)

  // Constantes físicas
  const SIGMA = 5.67e-8; // Constante de Stefan-Boltzmann [W / (m² · K⁴)]
  const SOLAR_CONSTANT = 1361; // Irradiancia solar total en el tope de la atmósfera [W/m²]
  const BASE_CO2 = 280; // ppm preindustrial (año 1750)
  const BASE_CH4 = 722; // ppb preindustrial

  // Cálculos del balance radiativo
  const simulation = useMemo(() => {
    // 1. Energía solar promedio incidente sobre la esfera terrestre: S_in = S_0 / 4 (relación área disco / esfera)
    const solarAvgIncoming = SOLAR_CONSTANT / 4; // ~340.25 W/m²

    // 2. Energía reflejada por albedo (nubes, hielo, desiertos):
    const albedoFrac = albedoPercent / 100;
    const reflectedSolar = solarAvgIncoming * albedoFrac; // ~102 W/m²
    const absorbedSolar = solarAvgIncoming * (1 - albedoFrac); // ~238 W/m²

    // 3. Temperatura de emisión equivalente sin atmósfera (cuerpo negro ideal):
    // T_eq = (absorbedSolar / SIGMA)^(1/4)
    const tempEqKelvin = Math.pow(absorbedSolar / SIGMA, 0.25);
    const tempEqCelsius = Number((tempEqKelvin - 273.15).toFixed(1)); // ~ -18.7 °C

    // 4. Forzamiento Radiativo Antropogénico (Fórmula canónica del IPCC):
    // Delta F_CO2 = 5.35 * ln(C / C_0) [W/m²]
    const deltaF_CO2 = 5.35 * Math.log(co2Ppm / BASE_CO2);

    // Delta F_CH4 aproximado: ~ 0.036 * (sqrt(CH4) - sqrt(CH4_0))
    const deltaF_CH4 = 0.036 * (Math.sqrt(methanePpb) - Math.sqrt(BASE_CH4));

    // Forzamiento por vapor de agua (feedback de amplificación de Clausius-Clapeyron):
    const deltaF_H2O = (waterVaporPct - 100) * 0.045;

    const totalRadiativeForcing = Number((deltaF_CO2 + deltaF_CH4 + deltaF_H2O).toFixed(2));

    // 5. Sensibilidad climática de equilibrio: lambda ~ 0.8 °C / (W/m²)
    // Delta T = lambda * Delta F
    const tempAnomalyCelsius = Number((totalRadiativeForcing * 0.78).toFixed(2));

    // Temperatura media global resultante (Base preindustrial = ~13.8 °C)
    const surfaceTempCelsius = Number((13.8 + tempAnomalyCelsius).toFixed(2));

    // Emisión infrarroja superficial hacia arriba: F_surf = SIGMA * T^4
    const surfaceTempKelvin = surfaceTempCelsius + 273.15;
    const surfaceIRFlux = Math.round(SIGMA * Math.pow(surfaceTempKelvin, 4));

    // Retención atmosférica de infrarrojo (Efecto invernadero en W/m²):
    const trappedIR = surfaceIRFlux - absorbedSolar;

    return {
      solarAvgIncoming: Math.round(solarAvgIncoming),
      absorbedSolar: Math.round(absorbedSolar),
      reflectedSolar: Math.round(reflectedSolar),
      tempEqCelsius,
      deltaF_CO2: Number(deltaF_CO2.toFixed(2)),
      deltaF_CH4: Number(deltaF_CH4.toFixed(2)),
      totalRadiativeForcing,
      tempAnomalyCelsius,
      surfaceTempCelsius,
      surfaceIRFlux,
      trappedIR: Math.max(0, trappedIR),
    };
  }, [co2Ppm, methanePpb, waterVaporPct, albedoPercent]);

  return (
    <div className="space-y-6">
      {/* Explicación Pedagógica */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1">
          <Globe className="w-5 h-5 text-emerald-500" />
          <span>Física y Geografía: Balance Radiativo Terrestre y Ley de Stefan-Boltzmann</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Sin el <strong>efecto invernadero natural</strong> (producido por el vapor de agua y el CO₂), la temperatura media de la Tierra sería de aproximadamente <strong>-18 °C</strong>, congelando todos los océanos. Los gases de efecto invernadero absorben la radiación infrarroja térmica saliente y la re-emiten en todas direcciones, calentando la superficie a unos habitables <strong>+14 °C a +15 °C</strong>. El incremento antropogénico intensifica este forzamiento térmico.
        </p>
      </div>

      {/* Controles de Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Concentración de CO2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Flame className="w-4 h-4 text-rose-500" />
              Dióxido de Carbono ($CO_2$)
            </span>
            <span className="font-mono font-bold text-rose-600">{co2Ppm} ppm</span>
          </div>
          <input
            type="range"
            min="200"
            max="850"
            step="10"
            value={co2Ppm}
            onChange={(e) => setCo2Ppm(Number(e.target.value))}
            className="w-full accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>280 (Preindustrial)</span>
            <span>425 (Hoy)</span>
            <span>850 (Extremo)</span>
          </div>
        </div>

        {/* Concentración de Metano (CH4) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Metano ($CH_4$)
            </span>
            <span className="font-mono font-bold text-amber-600">{methanePpb} ppb</span>
          </div>
          <input
            type="range"
            min="700"
            max="3200"
            step="50"
            value={methanePpb}
            onChange={(e) => setMethanePpb(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>720 (Preind.)</span>
            <span>1920 (Actual)</span>
            <span>3200 (Alto)</span>
          </div>
        </div>

        {/* Albedo Planetario */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Sun className="w-4 h-4 text-cyan-500" />
              Albedo Planetario ($\alpha$)
            </span>
            <span className="font-mono font-bold text-cyan-600">{albedoPercent} %</span>
          </div>
          <input
            type="range"
            min="15"
            max="45"
            step="1"
            value={albedoPercent}
            onChange={(e) => setAlbedoPercent(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>15% (Poco hielo/nieve)</span>
            <span>30% (Actual)</span>
            <span>45% (Glaciación)</span>
          </div>
        </div>

        {/* Retroalimentación Vapor de Agua */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Feedback Vapor de Agua ($H_2O$)
            </span>
            <span className="font-mono font-bold text-sky-600">{waterVaporPct} %</span>
          </div>
          <input
            type="range"
            min="70"
            max="140"
            step="5"
            value={waterVaporPct}
            onChange={(e) => setWaterVaporPct(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>70% (Atm. seca)</span>
            <span>100% (Normal)</span>
            <span>140% (+evaporación)</span>
          </div>
        </div>
      </div>

      {/* RESULTADOS DEL BALANCE RADIATIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Diagrama Esquemático del Balance de Radiación */}
        <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between text-xs mb-3">
            <span className="font-bold uppercase tracking-wider text-amber-400">
              Balance Radiativo de Energía (W/m²)
            </span>
            <span className="font-mono text-slate-400 text-[11px]">
              Ley de Conservación: E_entrante = E_saliente + ΔE
            </span>
          </div>

          <div className="w-full h-60 relative bg-linear-to-b from-slate-900 via-indigo-950 to-slate-900 rounded-lg p-2 border border-slate-800">
            <svg viewBox="0 0 520 220" className="w-full h-full">
              {/* Espacio Exterior */}
              <text x="20" y="20" fill="#94a3b8" fontSize="10" fontFamily="sans-serif">
                Tope de la Atmósfera (TOA) · Espacio Exterior
              </text>

              {/* Sol y Flecha de Onda Corta */}
              <circle cx="60" cy="45" r="16" fill="#f59e0b" />
              <line x1="60" y1="65" x2="60" y2="180" stroke="#fbbf24" strokeWidth="5" />
              <polygon points="60,185 54,175 66,175" fill="#fbbf24" />
              <text x="75" y="100" fill="#fbbf24" fontSize="10" fontWeight="bold">
                Solar Entrante: {simulation.solarAvgIncoming} W/m²
              </text>

              {/* Albedo Reflejado */}
              <path d="M 60 120 Q 110 80 140 30" fill="none" stroke="#38bdf8" strokeWidth="3" />
              <polygon points="140,25 133,35 145,38" fill="#38bdf8" />
              <text x="130" y="55" fill="#38bdf8" fontSize="9">
                Reflejado (Albedo {albedoPercent}%): {simulation.reflectedSolar} W/m²
              </text>

              {/* Capa de Gases de Efecto Invernadero */}
              <rect x="180" y="75" width="320" height="45" rx="6" fill="#e11d48" fillOpacity="0.25" stroke="#f43f5e" strokeDasharray="3 3" />
              <text x="195" y="93" fill="#fecdd3" fontSize="10" fontWeight="bold">
                Capa de Gases Invernadero (CO₂: {co2Ppm} ppm · CH₄: {methanePpb} ppb)
              </text>
              <text x="195" y="108" fill="#fda4af" fontSize="9">
                Forzamiento Radiativo Neto: ΔF = +{simulation.totalRadiativeForcing} W/m²
              </text>

              {/* Emisión Infrarroja Terrestre hacia la atmósfera */}
              <line x1="260" y1="185" x2="260" y2="125" stroke="#f43f5e" strokeWidth="4" />
              <polygon points="260,120 254,130 266,130" fill="#f43f5e" />
              <text x="270" y="155" fill="#f87171" fontSize="9">
                IR Superficial: {simulation.surfaceIRFlux} W/m²
              </text>

              {/* Re-emisión Infrarroja hacia abajo (Efecto invernadero) */}
              <line x1="360" y1="125" x2="360" y2="185" stroke="#fb7185" strokeWidth="4" strokeDasharray="4 2" />
              <polygon points="360,190 354,180 366,180" fill="#fb7185" />
              <text x="375" y="160" fill="#fda4af" fontSize="9" fontWeight="bold">
                IR Re-emitido al suelo: ~{simulation.trappedIR} W/m²
              </text>

              {/* Escape al espacio a través de la ventana atmosférica */}
              <line x1="450" y1="120" x2="450" y2="30" stroke="#f43f5e" strokeWidth="2.5" />
              <polygon points="450,25 444,35 456,35" fill="#f43f5e" />
              <text x="370" y="45" fill="#fca5a5" fontSize="9">
                Escape al espacio: {simulation.absorbedSolar} W/m²
              </text>

              {/* Superficie Terrestre */}
              <rect x="0" y="195" width="520" height="25" fill="#1e293b" />
              <text x="15" y="212" fill="#94a3b8" fontSize="10">
                Superficie Terrestre · Temperatura Media Resultante: {simulation.surfaceTempCelsius} °C
              </text>
            </svg>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-3 text-[11px] font-mono text-center">
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Sin atmósfera (T_eq):</span>
              <strong className="text-cyan-400 text-xs">{simulation.tempEqCelsius} °C</strong>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Forzamiento $\Delta F$:</span>
              <strong className="text-rose-400 text-xs">+{simulation.totalRadiativeForcing} W/m²</strong>
            </div>
            <div className="p-2 bg-slate-900 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Anomalía Térmica:</span>
              <strong className="text-amber-400 text-xs">
                {simulation.tempAnomalyCelsius >= 0 ? `+${simulation.tempAnomalyCelsius}` : simulation.tempAnomalyCelsius} °C
              </strong>
            </div>
          </div>
        </div>

        {/* Resumen Cuantitativo y Pedagógico */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">
              Temperatura Superficial Global
            </div>
            <div className="text-4xl font-black font-mono text-slate-900 dark:text-white my-1">
              {simulation.surfaceTempCelsius} °C
            </div>
            <div className={`text-xs font-semibold mt-1 ${simulation.tempAnomalyCelsius > 1.5 ? 'text-rose-600' : 'text-amber-600'}`}>
              Anomalía respecto a era preindustrial: {simulation.tempAnomalyCelsius > 0 ? `+${simulation.tempAnomalyCelsius}` : simulation.tempAnomalyCelsius} °C
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Aporte directo de $CO_2$:</span>
                <strong className="font-mono text-rose-600">+{simulation.deltaF_CO2} W/m²</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Aporte directo de $CH_4$:</span>
                <strong className="font-mono text-amber-600">+{simulation.deltaF_CH4} W/m²</strong>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Energía solar absorbida:</span>
                <strong className="font-mono">{simulation.absorbedSolar} W/m²</strong>
              </div>
            </div>
          </div>

          {/* Guía Pedagógica Interdisciplinaria */}
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Preguntas para el Taller Escolar:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-emerald-800 dark:text-emerald-300">
              <li><strong>Física:</strong> Utilizando la ley de Stefan-Boltzmann $F = \sigma T^4$, ¿por qué si la Tierra no tuviera atmósfera su temperatura sería de -18°C y la vida no sería viable?</li>
              <li><strong>Matemática:</strong> Observa la ecuación logarítmica de Arrhenius $\Delta F = 5.35 \cdot \ln(C/C_0)$. ¿Por qué duplicar el $CO_2$ produce un forzamiento constante sin importar el punto de partida?</li>
              <li><strong>Geografía:</strong> Si el albedo planetario disminuye del 30% al 26% por derretimiento del hielo marino en el Ártico y la Antártida, ¿cuántos W/m² adicionales de energía solar absorbe el planeta?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
