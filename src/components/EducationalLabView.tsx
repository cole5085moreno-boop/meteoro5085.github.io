/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Laboratorio de Investigación Meteorológica (Sección 17)
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FlaskConical,
  BookOpen,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Scale,
  Sparkles,
  Compass,
  Thermometer,
  Droplets,
  Sun,
  Leaf,
  Layers,
} from 'lucide-react';
import type { WeatherObservation } from '../types/weather.ts';
import { fetchObservations, fetchStats } from '../lib/api.ts';

interface ScientificQuestion {
  id: string;
  title: string;
  subtitle: string;
  category: 'Termodinámica' | 'Humedad & VPD' | 'Radiación Solar' | 'Dinámica del Viento';
  question: string;
  hypothesisGuide: string;
  variables: { varA: string; varB: string; labelA: string; labelB: string };
  scientificExplanation: string;
  reflectionQuestion: string;
}

export const EducationalLabView: React.FC = () => {
  const [selectedTopicId, setSelectedTopicId] = useState<string>('temp_dew');
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [studentHypothesis, setStudentHypothesis] = useState<string>('');
  const [hypothesisConfirmed, setHypothesisConfirmed] = useState<boolean | null>(null);

  // Preguntas científicas preconfiguradas con rigor físico y pedagógico
  const topics: ScientificQuestion[] = [
    {
      id: 'temp_dew',
      title: 'Punto de Rocío y Condensación Atmosférica',
      subtitle: '¿A qué temperatura se satura el vapor de agua en General Güemes?',
      category: 'Termodinámica',
      question: '¿Por qué la humedad relativa aumenta durante la madrugada aunque no llueva?',
      hypothesisGuide: 'Al enfriarse el aire nocturno, su capacidad de retener vapor disminuye. Cuando la temperatura desciende hasta el punto de rocío, la humedad relativa alcanza el 100% y se forma rocío o niebla.',
      variables: { varA: 'temperature_c', varB: 'dew_point_c', labelA: 'Temperatura (°C)', labelB: 'Punto de Rocío (°C)' },
      scientificExplanation: 'El punto de rocío es la temperatura a la que el aire debe enfriarse para que el vapor de agua se sature a presión constante. Cuanto más cerca esté la temperatura del punto de rocío, mayor es la humedad relativa.',
      reflectionQuestion: 'Examina en el gráfico la hora de menor temperatura del día: ¿Qué valor alcanzó la humedad relativa en ese instante?',
    },
    {
      id: 'vpd_plants',
      title: 'Déficit de Presión de Vapor (VPD) y Transpiración',
      subtitle: 'El balance hídrico de los cultivos en el Valle de Siancas',
      category: 'Humedad & VPD',
      question: '¿Cómo afecta el VPD a la transpiración y apertura de estomas en las plantas?',
      hypothesisGuide: 'Un VPD alto (> 1.6 kPa) indica aire muy seco que succiona agua de las hojas. Si la planta no tiene suficiente agua en el suelo, cerrará sus estomas para no deshidratarse, frenando la fotosíntesis.',
      variables: { varA: 'temperature_c', varB: 'vapor_pressure_deficit_kpa', labelA: 'Temperatura (°C)', labelB: 'VPD (kPa)' },
      scientificExplanation: 'El VPD representa la diferencia entre la presión de vapor de saturación dentro de la hoja y la presión de vapor del aire circundante. Es un parámetro agronómico superior a la humedad relativa aislada.',
      reflectionQuestion: '¿En qué franja horaria el VPD alcanza su máximo valor diario? ¿Qué recomendaciones de riego se deducen para la agricultura de Güemes?',
    },
    {
      id: 'solar_lag',
      title: 'Desfase Térmico y Radiación Solar (Inercia Térmica)',
      subtitle: '¿Por qué la hora más calurosa no coincide con el mediodía solar?',
      category: 'Radiación Solar',
      question: '¿Por qué el pico de temperatura se registra entre las 15:00 y las 16:30, mientras que el pico de radiación solar ocurre a las 13:00?',
      hypothesisGuide: 'La radiación solar calienta primero la superficie del suelo, y el suelo calienta luego el aire por conducción y convección. La temperatura máxima ocurre cuando el balance de calor acumulado supera las pérdidas por radiación infrarroja.',
      variables: { varA: 'solar_radiation_wm2', varB: 'temperature_c', labelA: 'Radiación Solar (W/m²)', labelB: 'Temperatura (°C)' },
      scientificExplanation: 'Este fenómeno se denomina inercia térmica o desfase radiativo. La atmósfera continúa acumulando calor neto mientras la energía solar entrante supere la emisión terrestre saliente.',
      reflectionQuestion: 'Compara la hora exacta del pico de radiación solar y el pico de temperatura en los datos de la estación.',
    },
    {
      id: 'wind_temp',
      title: 'Sensación Térmica y Efecto del Viento (Wind Chill)',
      subtitle: 'Diferencia física entre temperatura real y sensación corporal',
      category: 'Dinámica del Viento',
      question: '¿Por qué el viento hace que sintamos más frío o calor que el termómetro?',
      hypothesisGuide: 'El cuerpo humano genera una microcapa de aire tibio alrededor de la piel. El viento remueve continuamente esta capa protectora y acelera la evaporación del sudor, enfriando la superficie cutánea con mayor rapidez.',
      variables: { varA: 'temperature_c', varB: 'feels_like_c', labelA: 'Temperatura (°C)', labelB: 'Sensación Térmica (°C)' },
      scientificExplanation: 'La sensación térmica cuantifica la tasa de pérdida de calor corporal debida a la convección forzada del viento y la humedad. El sensor de temperatura mide la energía cinética de las moléculas de aire; la sensación térmica modela el intercambio de calor de un ser vivo.',
      reflectionQuestion: 'Observa momentos con ráfagas de viento fuertes: ¿Qué diferencia en grados se registró respecto a la temperatura ambiente?',
    },
  ];

  const currentTopic = topics.find((t) => t.id === selectedTopicId) || topics[0];

  useEffect(() => {
    async function fetchLabData() {
      setLoading(true);
      try {
        const obs = await fetchObservations({ range: '48h' });
        setObservations(obs);
      } catch (err) {
        console.error('Error al cargar datos del laboratorio:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLabData();
  }, []);

  // Gráfico simplificado para la experiencia de laboratorio
  const chartPoints = useMemo(() => {
    if (observations.length === 0) return [];
    const sample = observations.slice(-30);
    return sample.map((o) => {
      const valA = (o as any)[currentTopic.variables.varA] ?? null;
      const valB = (o as any)[currentTopic.variables.varB] ?? null;
      return {
        time: o.observed_at.split(' ')[1] || o.observed_at,
        valA,
        valB,
      };
    });
  }, [observations, currentTopic]);

  return (
    <div className="space-y-6">
      {/* Encabezado del Laboratorio Escolar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Laboratorio de Investigación Meteorológica
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Espacio de experimentación científica y aprendizaje activo para docentes y alumnos del Colegio 5085
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Método Científico · Datos Empíricos Reales
          </div>
        </div>

        {/* Selector de módulos de investigación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
          {topics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => {
                setSelectedTopicId(topic.id);
                setHypothesisConfirmed(null);
                setStudentHypothesis('');
              }}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedTopicId === topic.id
                  ? 'border-sky-600 bg-sky-50/50 dark:bg-sky-950/30 shadow-xs'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                {topic.category}
              </span>
              <div className="font-bold text-xs text-slate-900 dark:text-white mt-1 line-clamp-1">
                {topic.title}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {topic.subtitle}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ZONA DE TRABAJO CIENTÍFICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Planteo de Hipótesis y Concepto (2 columnas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta del Experimento */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-2">
              <BookOpen className="w-4 h-4 text-sky-600" />
              <span>Pregunta de Investigación</span>
            </div>

            <h2 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {currentTopic.question}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {currentTopic.scientificExplanation}
            </p>

            {/* Gráfico Comparativo de Laboratorio */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-lg">
              <div className="flex items-center justify-between text-xs font-semibold mb-3">
                <span className="text-slate-700 dark:text-slate-300">
                  Comportamiento Observado (Últimos Registros Reales)
                </span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-sky-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-600" />
                    <span>{currentTopic.variables.labelA}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <span>{currentTopic.variables.labelB}</span>
                  </span>
                </div>
              </div>

              {/* Mini visualizador de datos en tabla comparativa */}
              <div className="overflow-x-auto max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 text-[11px] text-slate-500 uppercase">
                    <tr>
                      <th className="py-1.5 px-3">Hora</th>
                      <th className="py-1.5 px-3 text-right">{currentTopic.variables.labelA}</th>
                      <th className="py-1.5 px-3 text-right">{currentTopic.variables.labelB}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {chartPoints.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-slate-100/50">
                        <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400">{pt.time}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-sky-600">{pt.valA !== null ? pt.valA : '—'}</td>
                        <td className="py-1.5 px-3 text-right font-bold text-amber-600">{pt.valB !== null ? pt.valB : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pregunta para reflexionar */}
            <div className="mt-5 p-4 bg-sky-50/50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 rounded-lg">
              <div className="flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-sky-900 dark:text-sky-300">
                    Consigna de Análisis para el Estudiante:
                  </h4>
                  <p className="text-xs text-sky-800 dark:text-sky-200 mt-1">
                    {currentTopic.reflectionQuestion}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulación Interactiva de Hipótesis */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
              Formular y Contrastar tu Hipótesis
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Escribe qué relación esperas encontrar entre ambas variables antes de revisar las conclusiones científicas:
            </p>

            <textarea
              value={studentHypothesis}
              onChange={(e) => setStudentHypothesis(e.target.value)}
              placeholder="Ejemplo: 'Pienso que cuando la temperatura sube, la humedad relativa baja porque el aire caliente puede contener más vapor...'"
              rows={3}
              className="w-full text-xs p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />

            <div className="flex items-center justify-between mt-3">
              <button
                onClick={() => setHypothesisConfirmed(true)}
                disabled={!studentHypothesis.trim()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-sky-600 dark:hover:bg-sky-500 text-white font-semibold text-xs rounded-lg transition-colors disabled:opacity-50"
              >
                Contrastar con Datos Científicos
              </button>
            </div>

            {hypothesisConfirmed && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs">
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  Fundamento Científico Validado:
                </h4>
                <p className="text-emerald-700 dark:text-emerald-200">
                  {currentTopic.hypothesisGuide}
                </p>
                <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800">
                  ¡Excelente trabajo de indagación científica! Has formulado una hipótesis basada en la física atmosférica.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Glosario de Conceptos Clave (1 columna) */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Scale className="w-4 h-4 text-sky-600" />
              <span>Principio Científico Fundamental</span>
            </h3>
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>Correlación ≠ Causalidad:</strong> Que dos variables suban o bajen juntas no significa que una sea la causa directa de la otra. Siempre debe investigarse el mecanismo físico subyacente.
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Glosario Meteorológico
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">Punto de Rocío (Dew Point):</dt>
                <dd className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Temperatura a la que una masa de aire debe enfriarse para saturarse y condensar vapor en gotas de agua.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">Déficit de Presión de Vapor (VPD):</dt>
                <dd className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Fuerza secante del aire medida en kilopascales (kPa). Determina el estrés hídrico de la flora y la tasa de evaporación.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">Radiación Solar (W/m²):</dt>
                <dd className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Flujo de energía electromagnética procedente del Sol que incide por unidad de superficie terrestre.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">Estadística Circular del Viento:</dt>
                <dd className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Método vectorial para promediar rumbos angulares sin el error de la media aritmética tradicional en 0°/360°.
                </dd>
              </div>

              <div>
                <dt className="font-semibold text-slate-900 dark:text-slate-100">Presión Atmosférica Relativa:</dt>
                <dd className="text-slate-500 dark:text-slate-400 mt-0.5">
                  Presión medida corregida a nivel del mar para permitir comparaciones meteorológicas regionales estandarizadas.
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
