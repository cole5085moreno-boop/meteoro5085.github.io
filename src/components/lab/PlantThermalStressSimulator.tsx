/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085 - Laboratorio
 * Simulador de Estrés Térmico y Heladas en Vegetales y Cultivos del Valle de Siancas
 * Asignaturas: Biología (Citología Vegetal, Ósmosis, Fotosíntesis, Rubisco), Geografía y Economía (Cultivos de Güemes: Caña de Azúcar, Tabaco, Tomate, Cítricos)
 */

import React, { useState, useMemo } from 'react';
import { Leaf, Snowflake, Flame, Droplets, AlertTriangle, ShieldCheck, BookOpen, Info } from 'lucide-react';

interface CropProfile {
  id: string;
  name: string;
  scientificName: string;
  regionRole: string;
  frostToleranceTemp: number; // Temperatura a la que inicia daño por helada (°C)
  heatToleranceTemp: number; // Temperatura a la que inicia estrés por calor (°C)
  optimumTempRange: [number, number]; // [mín, máx] óptimo fotosintético (°C)
  vulnerabilityNotes: string;
}

export const PlantThermalStressSimulator: React.FC = () => {
  // Cultivos representativos de General Güemes y el Valle de Siancas
  const crops: CropProfile[] = [
    {
      id: 'sugar_cane',
      name: 'Caña de Azúcar',
      scientificName: 'Saccharum officinarum',
      regionRole: 'Principal motor agroindustrial (Ingenio San Isidro, Campo Santo / Güemes)',
      frostToleranceTemp: -1.5,
      heatToleranceTemp: 38,
      optimumTempRange: [24, 34],
      vulnerabilityNotes: 'Sensible a heladas intensas que necrosan los ápices vegetativos y fermentan la sacarosa del tallo, reduciendo drásticamente el rendimiento sacarimétrico.',
    },
    {
      id: 'tobacco',
      name: 'Tabaco Virginia',
      scientificName: 'Nicotiana tabacum',
      regionRole: 'Cultivo intensivo de alto valor en los campos de Güemes y Valle de Lerma',
      frostToleranceTemp: 0.5,
      heatToleranceTemp: 36,
      optimumTempRange: [20, 30],
      vulnerabilityNotes: 'Extremadamente sensible a heladas tempranas en trasplante o tardías previas a la cosecha foliar. Hojas tiernas se deshidratan y mueren de inmediato.',
    },
    {
      id: 'tomato',
      name: 'Tomate de Primicia',
      scientificName: 'Solanum lycopersicum',
      regionRole: 'Horticultura intensiva bajo invernáculo o a campo abierto',
      frostToleranceTemp: 1.0,
      heatToleranceTemp: 34,
      optimumTempRange: [18, 28],
      vulnerabilityNotes: 'A menos de 2°C sufre detención de crecimiento; a 0°C colapsan tallos y flores. Temperaturas >35°C causan caída masiva de flores y aborto de polen.',
    },
    {
      id: 'citrus',
      name: 'Cítricos (Naranjo / Limonero)',
      scientificName: 'Citrus sinensis / Citrus limon',
      regionRole: 'Fruticultura regional en las quebradas y pedemontes salteños',
      frostToleranceTemp: -2.5,
      heatToleranceTemp: 40,
      optimumTempRange: [22, 32],
      vulnerabilityNotes: 'Brotes nuevos se congelan a -1°C. Si el termómetro baja de -3°C por más de 4 horas, se rompen los gajos y vesículas de jugo en el fruto maduro.',
    },
    {
      id: 'bean',
      name: 'Poroto Alubia / Negro',
      scientificName: 'Phaseolus vulgaris',
      regionRole: 'Cultivo tradicional de exportación en el este salteño y llanura chaco-salteña',
      frostToleranceTemp: 0.0,
      heatToleranceTemp: 35,
      optimumTempRange: [18, 29],
      vulnerabilityNotes: 'Heladas a fines de mayo dañan las vainas tiernas en llenado de grano. El calor extremo con sequía induce cierre estomático total.',
    },
  ];

  // Variables interactivas
  const [selectedCropId, setSelectedCropId] = useState<string>('sugar_cane');
  const [ambientTemp, setAmbientTemp] = useState<number>(-2); // °C (-6 a 45)
  const [durationHours, setDurationHours] = useState<number>(5); // 1 a 12 horas
  const [frostType, setFrostType] = useState<'white' | 'black'>('black'); // Helada blanca vs negra
  const [hasProtection, setHasProtection] = useState<boolean>(false); // Medidas de mitigación (aspersión / manta)

  const activeCrop = crops.find((c) => c.id === selectedCropId) || crops[0];

  // Cálculos biológicos y fisiológicos
  const simulation = useMemo(() => {
    let effectiveTemp = ambientTemp;
    // Si se activa protección agronómica (ej. riego antihelada por aspersión continua que aprovecha el calor latente de fusión del agua a 80 cal/g)
    if (hasProtection && ambientTemp < 0) {
      effectiveTemp = Math.min(0, ambientTemp + 2.5);
    } else if (hasProtection && ambientTemp > 35) {
      effectiveTemp = ambientTemp - 3.0; // Mallas de sombreo
    }

    let stressType: 'extreme_frost' | 'moderate_frost' | 'optimum' | 'heat_stress' | 'extreme_heat' = 'optimum';
    let cellularState = '';
    let photosyntheticEfficiencyPct = 100;
    let yieldDamagePct = 0;
    let diagnosis = '';
    let severityBadge = '';

    if (effectiveTemp < activeCrop.frostToleranceTemp) {
      // Daño por bajas temperaturas / heladas
      const deltaBelow = activeCrop.frostToleranceTemp - effectiveTemp;
      const hoursFactor = Math.min(2.5, 0.6 + durationHours * 0.25);

      if (frostType === 'black' && effectiveTemp <= 0) {
        // Helada negra: Aire polar muy seco, punto de rocío muy bajo. El agua se congela directamente en el espacio intracelular sin escarcha visible.
        yieldDamagePct = Math.min(100, Math.round(deltaBelow * 22 * hoursFactor));
        photosyntheticEfficiencyPct = Math.max(0, 100 - yieldDamagePct * 1.2);
        stressType = 'extreme_frost';
        cellularState = 'Cristalización intracelular fulminante. Los cristales de hielo laceran la membrana plasmática y el tonoplasto de las vacuolas, causando plasmólisis irreversible y deshidratación celular mortal.';
        diagnosis = `¡Helada Negra destructiva en ${activeCrop.name}! Al no haber condensación superficial, no se libera calor latente. Tejidos foliares quemados y necrosados de color pardo-negruzco.`;
        severityBadge = 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-300';
      } else {
        // Helada blanca: Humedad alta, se forma escarcha en la superficie foliar. El agua se congela primero extracelularmente.
        yieldDamagePct = Math.min(90, Math.round(deltaBelow * 14 * hoursFactor));
        photosyntheticEfficiencyPct = Math.max(5, 100 - yieldDamagePct);
        stressType = effectiveTemp < -3 ? 'extreme_frost' : 'moderate_frost';
        cellularState = 'Cristalización extracelular en apoplasto. La planta sufre deshidratación osmótica inducida por hielo exterior; las células pierden turgencia pero las membranas pueden preservarse si no es prolongado.';
        diagnosis = `Helada Blanca con escarcha en ${activeCrop.name}. La transición de fase líquido-hielo liberó 80 cal/gramo, mitigando parcialmente el choque térmico.`;
        severityBadge = 'text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-300';
      }
    } else if (effectiveTemp > activeCrop.heatToleranceTemp) {
      // Daño por altas temperaturas / estrés térmico
      const deltaAbove = effectiveTemp - activeCrop.heatToleranceTemp;
      const hoursFactor = Math.min(2.0, 0.7 + durationHours * 0.2);
      yieldDamagePct = Math.min(85, Math.round(deltaAbove * 12 * hoursFactor));
      photosyntheticEfficiencyPct = Math.max(10, 100 - yieldDamagePct);
      stressType = effectiveTemp >= 40 ? 'extreme_heat' : 'heat_stress';
      cellularState = 'Desnaturalización térmica de la enzima Rubisco (fijación de CO₂) y desacoplamiento del Fotosistema II en la membrana tilacoide. Producción de especies reactivas de oxígeno (ROS). Cierre estomático por pérdida hídrica.';
      diagnosis = `Estrés Térmico severo por calor en ${activeCrop.name}. Cierre estomático para evitar cavitación del xilema, interrumpiendo la transpiración y provocando calentamiento foliar interno superior al aire.`;
      severityBadge = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
    } else {
      // Rango óptimo o estrés leve
      if (effectiveTemp >= activeCrop.optimumTempRange[0] && effectiveTemp <= activeCrop.optimumTempRange[1]) {
        stressType = 'optimum';
        photosyntheticEfficiencyPct = 100;
        yieldDamagePct = 0;
        cellularState = 'Metabolismo óptimo. Fotosíntesis neta máxima, óptima conductancia estomática y translocación activa de fotosintatos por el floema hacia los tallos/frutos.';
        diagnosis = `Condiciones térmicas óptimas para ${activeCrop.name} en el Valle de Siancas. Crecimiento vegetativo pleno.`;
        severityBadge = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
      } else {
        photosyntheticEfficiencyPct = 70;
        yieldDamagePct = 5;
        cellularState = 'Metabolismo desacelerado. Enzimas respiratorias y fotosintéticas operan a velocidad subóptima sin daño estructural tisular.';
        diagnosis = `Temperatura fuera del óptimo fisiológico de ${activeCrop.name}, pero dentro del rango de tolerancia pasiva.`;
        severityBadge = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      }
    }

    return {
      effectiveTemp,
      stressType,
      cellularState,
      photosyntheticEfficiencyPct: Math.round(photosyntheticEfficiencyPct),
      yieldDamagePct: Math.round(yieldDamagePct),
      diagnosis,
      severityBadge,
    };
  }, [ambientTemp, durationHours, frostType, hasProtection, activeCrop]);

  return (
    <div className="space-y-6">
      {/* Explicación Pedagógica */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1">
          <Leaf className="w-5 h-5 text-emerald-500" />
          <span>Fisiología Vegetal y Agronomía: Heladas y Estrés Térmico en los Cultivos del Valle de Siancas</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          En el Valle de Siancas (General Güemes y Campo Santo), la topografía deprimida favorece la <strong>inversión térmica nocturna en invierno</strong>, acumulando aire polar denso y causando heladas radiativas severas. Este simulador calcula la respuesta fisiológica celular (cristalización intra/extracelular vs desnaturalización de Rubisco) y la pérdida potencial de cosecha según la especie vegetal.
        </p>
      </div>

      {/* Selector de Cultivo */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {crops.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCropId(c.id)}
            className={`p-3 rounded-xl border text-left transition-all ${
              selectedCropId === c.id
                ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              {c.name}
            </div>
            <div className="text-[10px] text-slate-500 italic mt-0.5">
              {c.scientificName}
            </div>
            <div className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 mt-1">
              Óptimo: {c.optimumTempRange[0]}° a {c.optimumTempRange[1]}°C
            </div>
          </button>
        ))}
      </div>

      {/* Controles de Variables Térmicas y Meteorológicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperatura Ambiente */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Snowflake className="w-4 h-4 text-cyan-500" />
              Temperatura Ambiente ($T$)
            </span>
            <span className={`font-mono font-bold ${ambientTemp < 0 ? 'text-cyan-600' : ambientTemp > 35 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {ambientTemp} °C
            </span>
          </div>
          <input
            type="range"
            min="-6"
            max="44"
            step="0.5"
            value={ambientTemp}
            onChange={(e) => setAmbientTemp(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>-6°C (Helada negra)</span>
            <span>25°C (Ideal)</span>
            <span>44°C (Ola calor)</span>
          </div>
        </div>

        {/* Duración de la temperatura extrema */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Duración del Evento
            </span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {durationHours} horas
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="12"
            step="1"
            value={durationHours}
            onChange={(e) => setDurationHours(Number(e.target.value))}
            className="w-full accent-slate-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 h (Paso rápido)</span>
            <span>6 h (Nocturna típica)</span>
            <span>12 h (Congelación)</span>
          </div>
        </div>

        {/* Tipo de Helada (Blanca vs Negra) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
            Tipo de Atmósfera (Bajas Temp.)
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            <button
              onClick={() => setFrostType('white')}
              className={`p-2 rounded-lg text-left text-[11px] font-medium border transition-colors ${
                frostType === 'white'
                  ? 'border-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold">Helada Blanca</div>
              <div className="text-[9px] opacity-80">Rocío congelado / Escarcha (+80 cal/g)</div>
            </button>
            <button
              onClick={() => setFrostType('black')}
              className={`p-2 rounded-lg text-left text-[11px] font-medium border transition-colors ${
                frostType === 'black'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <div className="font-bold">Helada Negra</div>
              <div className="text-[9px] opacity-80">Aire polar seco, muerte celular directa</div>
            </button>
          </div>
        </div>

        {/* Medidas de Mitigación Agrícola */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Manejo Agronómico
            </span>
            <p className="text-[10px] text-slate-500 mb-2">
              Riego por aspersión protector (calor latente) o mallas térmicas de sombreado
            </p>
          </div>
          <button
            onClick={() => setHasProtection(!hasProtection)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              hasProtection
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{hasProtection ? 'Protección Activa (+2.5°C)' : 'Sin Protección'}</span>
          </button>
        </div>
      </div>

      {/* RESULTADOS DEL IMPACTO FISIOLÓGICO Y AGRONÓMICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjeta de Diagnóstico Celular y Tejidos */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-5 rounded-xl border ${simulation.severityBadge}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Diagnóstico Agronómico del Valle de Siancas</span>
            </div>
            <h3 className="text-base font-bold mb-2">
              {simulation.diagnosis}
            </h3>
            <div className="mt-3 p-3 bg-white/60 dark:bg-slate-900/60 rounded-lg text-xs leading-relaxed border border-current/20">
              <strong className="block mb-1 text-[11px] uppercase tracking-wide">Fisiología a Nivel Celular:</strong>
              {simulation.cellularState}
            </div>
          </div>

          {/* Información del Cultivo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 text-xs text-slate-600 dark:text-slate-300">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">
              Importancia Productiva en General Güemes: {activeCrop.name} ({activeCrop.scientificName})
            </h4>
            <p className="mb-2 text-slate-500">
              {activeCrop.regionRole}
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]">
              <strong className="text-slate-900 dark:text-white">Puntos Críticos:</strong> {activeCrop.vulnerabilityNotes}
            </div>
          </div>
        </div>

        {/* Métricas de Pérdida de Cosecha y Fotosíntesis */}
        <div className="space-y-4">
          {/* Daño en Cosecha */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">
              Pérdida Estimada de Cosecha / Rinde
            </div>
            <div className={`text-4xl font-black font-mono my-1 ${simulation.yieldDamagePct > 40 ? 'text-rose-600' : simulation.yieldDamagePct > 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {simulation.yieldDamagePct} %
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${simulation.yieldDamagePct > 50 ? 'bg-rose-500' : simulation.yieldDamagePct > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${simulation.yieldDamagePct}%` }}
              />
            </div>
          </div>

          {/* Eficiencia Fotosintética */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="text-xs uppercase font-bold text-slate-400 mb-1">
              Eficiencia Fotosintética Relativa
            </div>
            <div className="text-3xl font-bold font-mono text-sky-600 dark:text-sky-400 my-1">
              {simulation.photosyntheticEfficiencyPct} %
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Fijación de $CO_2$ por enzima Rubisco y tasa de translocación de carbohidratos
            </p>
          </div>

          {/* Guía Pedagógica Interdisciplinaria */}
          <div className="p-4 bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/60 rounded-xl text-xs text-sky-900 dark:text-sky-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Consigna para Biología y Geografía:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-sky-800 dark:text-sky-300">
              <li><strong>Biología:</strong> ¿Por qué la helada negra provoca daños mucho más fulminantes que la helada blanca con la misma temperatura termométrica de -2°C?</li>
              <li><strong>Física y Agronomía:</strong> ¿Cómo protege a las plantas el rociado continuo de agua durante la helada, considerando que la solidificación de cada gramo de agua cede 80 calorías de calor latente al tejido?</li>
              <li><strong>Geografía Económica:</strong> Investiga cómo las heladas de julio pueden afectar la zafra azucarera del Ingenio San Isidro en Campo Santo.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
