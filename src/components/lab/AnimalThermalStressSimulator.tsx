/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085 - Laboratorio
 * Simulador de Estrés Térmico Animal e Índice ITH (Temperatura y Humedad)
 * Asignaturas: Biología (Homeostasis, Termorregulación Endotérmica, Fisiología Animal), Matemática (Ecuación Bivariada de Thom), Geografía y Producción (Ganadería del NOA)
 */

import React, { useState, useMemo } from 'react';
import { HeartPulse, Wind, Droplets, Thermometer, AlertCircle, ShieldCheck, BookOpen, Info, Activity } from 'lucide-react';

interface AnimalProfile {
  id: string;
  name: string;
  type: string;
  comfortMaxITH: number;
  alertITH: number;
  dangerITH: number;
  emergencyITH: number;
  lossMetric: string;
  biologyDescription: string;
}

export const AnimalThermalStressSimulator: React.FC = () => {
  const animals: AnimalProfile[] = [
    {
      id: 'dairy_cow',
      name: 'Vaca Lechera (Holando Argentino)',
      type: 'Bovino Lechero de Alta Producción',
      comfortMaxITH: 71,
      alertITH: 72,
      dangerITH: 79,
      emergencyITH: 89,
      lossMetric: 'Caída en producción láctea (Litros/vaca/día)',
      biologyDescription: 'La fermentación ruminal genera una enorme cantidad de calor metabólico endógeno. En días con alta humedad y temperaturas >26°C, la capacidad de disipación cutánea colapsa.',
    },
    {
      id: 'beef_cattle',
      name: 'Bovino de Carne (Braford / Brangus)',
      type: 'Ganadería Adaptada al Chaco Salteño',
      comfortMaxITH: 74,
      alertITH: 76,
      dangerITH: 84,
      emergencyITH: 92,
      lossMetric: 'Pérdida en Ganancia Diaria de Peso (g/animal/día)',
      biologyDescription: 'Raza sintética con sangre cebuina (Bos indicus), piel más laxa y mayor densidad de glándulas sudoríparas, lo que le otorga mayor tolerancia al clima subtropical del este salteño.',
    },
    {
      id: 'poultry',
      name: 'Aves de Corral (Pollos Parrilleros)',
      type: 'Avicultura Intensiva',
      comfortMaxITH: 70,
      alertITH: 73,
      dangerITH: 80,
      emergencyITH: 88,
      lossMetric: 'Mortalidad por Asfixia y Caída de Conversión Alimenticia',
      biologyDescription: 'Las aves carecen de glándulas sudoríparas. Su único mecanismo de disipación evaporativa es el jadeo respiratorio gular. Ambientes húmedos impiden la evaporación pulmonar.',
    },
    {
      id: 'dogs',
      name: 'Animales de Compañía (Caninos)',
      type: 'Mamífero Doméstico',
      comfortMaxITH: 72,
      alertITH: 75,
      dangerITH: 82,
      emergencyITH: 90,
      lossMetric: 'Riesgo Inminente de Golpe de Calor (Heatstroke)',
      biologyDescription: 'Sudoración limitada exclusivamente a los pulpejos plantares. El jadeo rápido es su mecanismo termorregulador primario; si la humedad supera el 75%, el jadeo se vuelve ineficaz.',
    },
  ];

  // Variables interactivas
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>('dairy_cow');
  const [dryBulbTemp, setDryBulbTemp] = useState<number>(33); // °C
  const [relativeHumidity, setRelativeHumidity] = useState<number>(70); // %
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(5); // km/h
  const [hasShadeAndMisters, setHasShadeAndMisters] = useState<boolean>(false); // Sombra + aspersores / ventiladores

  const activeAnimal = animals.find((a) => a.id === selectedAnimalId) || animals[0];

  // Cálculos bioclimáticos de Thom (Índice de Temperatura y Humedad - ITH / THI)
  const simulation = useMemo(() => {
    // Ecuación canónica de Thom (1959) adaptada por el INTA:
    // ITH = (1.8 * T + 32) - (0.55 - 0.0055 * HR) * (1.8 * T - 26)
    const T = dryBulbTemp;
    const HR = relativeHumidity;
    let rawITH = (1.8 * T + 32) - (0.55 - 0.0055 * HR) * (1.8 * T - 26);

    // Corrección por viento y mitigación (sombra y aspersión con gotas gruesas + ventiladores)
    if (hasShadeAndMisters) {
      rawITH -= 4.5;
    }
    // El viento ayuda a disipar calor por convección
    if (windSpeedKmh > 10) {
      rawITH -= Math.min(3, (windSpeedKmh - 10) * 0.15);
    }

    const calculatedITH = Number(Math.max(45, Math.min(105, rawITH)).toFixed(1));

    // Categorización según umbrales específicos del animal
    let stressCategory = 'Confort Térmico';
    let stressColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    let respirationRate = 35; // respiraciones por minuto normales
    let estimatedLoss = '0';
    let clinicalBehavior = 'Animal activo, consumo de alimento normal, rumia continua y frecuencia respiratoria basal.';

    if (calculatedITH >= activeAnimal.emergencyITH) {
      stressCategory = 'Emergencia Crítica (Peligro de Muerte)';
      stressColor = 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-300';
      respirationRate = 125;
      estimatedLoss = activeAnimal.id === 'dairy_cow' ? '-8.5 L/día (-35%)' : activeAnimal.id === 'beef_cattle' ? '-650 g/día' : 'Alta mortalidad (>15%)';
      clinicalBehavior = '¡Colapso inminente! Jadeo a boca abierta con lengua afuera y babeo profuso. Vasodilatación periférica máxima, taquicardia extrema e hipertermia corporal (>41°C).';
    } else if (calculatedITH >= activeAnimal.dangerITH) {
      stressCategory = 'Estrés Fuerte (Peligro Severo)';
      stressColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
      respirationRate = 95;
      estimatedLoss = activeAnimal.id === 'dairy_cow' ? '-4.5 L/día (-18%)' : activeAnimal.id === 'beef_cattle' ? '-380 g/día' : 'Baja severa de ingesta';
      clinicalBehavior = 'Jadeo constante y forzado, búsqueda desesperada de sombra, rechazo a la comida, caída drástica de la rumia y aumento drástico del consumo de agua (+100%).';
    } else if (calculatedITH >= activeAnimal.alertITH) {
      stressCategory = 'Estrés Moderado (Alerta)';
      stressColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      respirationRate = 65;
      estimatedLoss = activeAnimal.id === 'dairy_cow' ? '-1.8 L/día (-7%)' : activeAnimal.id === 'beef_cattle' ? '-150 g/día' : 'Estrés leve en conversión';
      clinicalBehavior = 'Respiración acelerada, los animales permanecen de pie para exponer mayor superficie corporal al aire, menor tiempo de descanso echado.';
    }

    return {
      calculatedITH,
      stressCategory,
      stressColor,
      respirationRate,
      estimatedLoss,
      clinicalBehavior,
    };
  }, [dryBulbTemp, relativeHumidity, windSpeedKmh, hasShadeAndMisters, activeAnimal]);

  return (
    <div className="space-y-6">
      {/* Explicación Pedagógica */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1">
          <HeartPulse className="w-5 h-5 text-rose-500" />
          <span>Fisiología Animal y Homeostasis: Índice de Temperatura y Humedad (ITH) en el Ganado</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Los animales endotérmicos mantienen constante su temperatura corporal mediante un equilibrio entre la <strong>termogénesis metabólica</strong> y la <strong>disipación de calor</strong>. Cuando la humedad ambiental es elevada, el gradiente de presión de vapor disminuye, volviendo casi nula la pérdida de calor por evaporación (sudor y jadeo), induciendo estrés térmico y acidosis ruminal en el ganado salteño.
        </p>
      </div>

      {/* Selector de Animal / Especie */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {animals.map((an) => (
          <button
            key={an.id}
            onClick={() => setSelectedAnimalId(an.id)}
            className={`p-3.5 rounded-xl border text-left transition-all ${
              selectedAnimalId === an.id
                ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 shadow-xs'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
            }`}
          >
            <div className="font-bold text-xs text-slate-900 dark:text-white">
              {an.name}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              {an.type}
            </div>
            <div className="text-[9px] font-mono text-sky-600 dark:text-sky-400 mt-1">
              Confort: ITH &lt; {an.comfortMaxITH}
            </div>
          </button>
        ))}
      </div>

      {/* Controles de Variables Meteorológicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Temperatura de Bulbo Seco */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              Temperatura Aire ($T$)
            </span>
            <span className="font-mono font-bold text-orange-600">{dryBulbTemp} °C</span>
          </div>
          <input
            type="range"
            min="12"
            max="45"
            step="0.5"
            value={dryBulbTemp}
            onChange={(e) => setDryBulbTemp(Number(e.target.value))}
            className="w-full accent-orange-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>15°C (Fresco)</span>
            <span>28°C (Cálido)</span>
            <span>45°C (Extremo)</span>
          </div>
        </div>

        {/* Humedad Relativa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Droplets className="w-4 h-4 text-sky-500" />
              Humedad Relativa ($HR$)
            </span>
            <span className="font-mono font-bold text-sky-600">{relativeHumidity} %</span>
          </div>
          <input
            type="range"
            min="15"
            max="95"
            step="1"
            value={relativeHumidity}
            onChange={(e) => setRelativeHumidity(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>20% (Aire seco)</span>
            <span>60% (Medio)</span>
            <span>95% (Bochorno)</span>
          </div>
        </div>

        {/* Velocidad del Viento */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Wind className="w-4 h-4 text-indigo-500" />
              Velocidad del Viento
            </span>
            <span className="font-mono font-bold text-indigo-600">{windSpeedKmh} km/h</span>
          </div>
          <input
            type="range"
            min="0"
            max="35"
            step="1"
            value={windSpeedKmh}
            onChange={(e) => setWindSpeedKmh(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>0 (Calma total)</span>
            <span>15 (Brisa)</span>
            <span>35 (Viento fuerte)</span>
          </div>
        </div>

        {/* Manejo y Mitigación Veterinaria */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1">
              Mitigación de Corrales
            </span>
            <p className="text-[10px] text-slate-500 mb-2">
              Sombra artificial + ventiladores con aspersión en sala de espera / corral
            </p>
          </div>
          <button
            onClick={() => setHasShadeAndMisters(!hasShadeAndMisters)}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${
              hasShadeAndMisters
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{hasShadeAndMisters ? 'Sombra + Aspersión (-4.5 ITH)' : 'Sin Mitigación'}</span>
          </button>
        </div>
      </div>

      {/* RESULTADOS DEL ÍNDICE ITH Y ESTADO FISIOLÓGICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tacómetro / Valor de ITH */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
            Índice de Temperatura y Humedad (ITH de Thom)
          </div>

          <div className="text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white my-2">
            {simulation.calculatedITH}
          </div>

          <div className={`mt-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${simulation.stressColor}`}>
            {simulation.stressCategory}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mt-6 overflow-hidden flex">
            <div className="bg-emerald-500 h-full w-[35%]" title="Confort (<72)" />
            <div className="bg-amber-400 h-full w-[25%]" title="Alerta (72-78)" />
            <div className="bg-rose-500 h-full w-[25%]" title="Peligro (79-88)" />
            <div className="bg-purple-600 h-full w-[15%]" title="Emergencia (89+)" />
          </div>

          <div className="flex justify-between w-full text-[10px] text-slate-400 mt-1 font-mono">
            <span>&lt; 72 Confort</span>
            <span>75 Alerta</span>
            <span>82 Peligro</span>
            <span>89+ Emergencia</span>
          </div>

          <div className="mt-4 text-[11px] text-slate-500 font-mono">
            Ecuación: ITH = 1.8·T + 32 - (0.55 - 0.0055·HR)·(1.8·T - 26)
          </div>
        </div>

        {/* Panel de Comportamiento Fisiológico y Pérdidas */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Frecuencia Respiratoria Estimada */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Activity className="w-4 h-4 text-rose-500" />
                <span>Frecuencia Respiratoria (Jadeo)</span>
              </div>
              <div className="text-3xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                ~{simulation.respirationRate} <span className="text-xs font-normal text-slate-500">mov/min</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Frecuencia basal normal: 25 a 40 mov/min
              </p>
            </div>

            {/* Impacto Productivo */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span>{activeAnimal.lossMetric}</span>
              </div>
              <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
                {simulation.estimatedLoss}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Pérdida económica directa estimada por evento de ola de calor
              </p>
            </div>
          </div>

          {/* Conducta Clínica y Fisiológica */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-sky-600" />
              <span>Manifestaciones Clínicas y Conducta Animal:</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {simulation.clinicalBehavior}
            </p>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-500 text-[11px]">
              <strong className="text-slate-700 dark:text-slate-300">Fisiología de la Especie:</strong> {activeAnimal.biologyDescription}
            </div>
          </div>

          {/* Guía Pedagógica Interdisciplinaria */}
          <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 rounded-xl text-xs text-indigo-900 dark:text-indigo-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Consignas para Biología y Matemática en Secundaria:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-indigo-800 dark:text-indigo-300">
              <li><strong>Biología:</strong> ¿Por qué una vaca con 32°C y 30% de humedad se encuentra en alerta leve (ITH ~76), pero con los mismos 32°C y 85% de humedad entra en peligro crítico (ITH &gt; 85)? ¿Qué rol cumple la evaporación del sudor?</li>
              <li><strong>Matemática:</strong> Analiza algebraicamente el término $(0.55 - 0.0055 \cdot HR)$ en la fórmula de Thom. ¿Para qué valor de $HR$ este término se anula por completo?</li>
              <li><strong>Veterinaria y Producción:</strong> Compara la tolerancia al ITH entre la vaca lechera Holando (de origen europeo) y el novillo Braford (cruce cebuino). ¿Por qué en la ganadería del NOA se prefieren razas sintéticas adaptadas al calor?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
