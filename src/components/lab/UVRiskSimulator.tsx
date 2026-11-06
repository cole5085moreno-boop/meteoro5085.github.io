/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085 - Laboratorio
 * Simulador de Riesgo por Radiación Ultravioleta (UV) y Fototipos
 * Asignaturas: Biología (Melanina, ADN, Síntesis Vitamina D), Física (Espectro Electromagnético, Dispersión Rayleigh), Geografía (Altitud en el NOA)
 */

import React, { useState, useMemo } from 'react';
import { Sun, Shield, AlertTriangle, User, Clock, HeartPulse, Info, BookOpen } from 'lucide-react';

export const UVRiskSimulator: React.FC = () => {
  // Variables interactivas
  const [solarHour, setSolarHour] = useState<number>(13.5); // 13:30 (Cenit solar en Salta)
  const [altitudeMeters, setAltitudeMeters] = useState<number>(695); // General Güemes 695 msnm
  const [cloudCover, setCloudCover] = useState<'clear' | 'cirrus' | 'scattered' | 'overcast'>('clear');
  const [ozoneDobson, setOzoneDobson] = useState<number>(270); // Unidades Dobson (típico NOA)
  const [skinType, setSkinType] = useState<number>(2); // Fototipo Fitzpatrick II (Piel clara intermedia)
  const [spfFactor, setSpfFactor] = useState<number>(0); // FPS (0 = sin protector)

  // Fototipos de Fitzpatrick
  const fitzpatrickTypes = [
    { type: 1, name: 'Fototipo I', desc: 'Piel muy pálida / pelirroja / pecosa', burn: 'Siempre se quema, nunca se broncea', med: 200 },
    { type: 2, name: 'Fototipo II', desc: 'Piel clara, ojos claros', burn: 'Se quema con facilidad, se broncea mínimamente', med: 250 },
    { type: 3, name: 'Fototipo III', desc: 'Piel castaña clara (muy común en Argentina)', burn: 'Se quema con moderación, bronceado gradual', med: 350 },
    { type: 4, name: 'Fototipo IV', desc: 'Piel trigueña / morena clara (típica NOA)', burn: 'Rara vez se quema, se broncea con facilidad', med: 450 },
    { type: 5, name: 'Fototipo V', desc: 'Piel morena oscura / amerindia / mestiza', burn: 'Casi nunca se quema, bronceado intenso', med: 600 },
    { type: 6, name: 'Fototipo VI', desc: 'Piel negra / muy oscura', burn: 'Nunca se quema ante exposiciones usuales', med: 800 },
  ];

  // Cálculos físicos y biológicos
  const simulation = useMemo(() => {
    // 1. Ángulo Cenital Solar aproximado según la hora (Cénit a las 13.5 hs en Salta UTC-3)
    const hourDiff = Math.abs(solarHour - 13.5);
    const solarElevationDeg = Math.max(0, 90 - hourDiff * 14.5); // Elevación solar máxima ~90° en verano
    const zenithAngleRad = ((90 - solarElevationDeg) * Math.PI) / 180;

    // 2. Modelo de Radiación UV base sobre plano horizontal
    let baseUVI = 13.2 * Math.pow(Math.cos(zenithAngleRad), 1.35);
    if (solarElevationDeg <= 5) baseUVI = 0;

    // 3. Factor de Altitud: La radiación UV aumenta ~8% a 10% por cada 1000m de elevación
    // (menor densidad de la columna atmosférica y menor dispersión de Rayleigh)
    const altitudeFactor = 1 + (altitudeMeters / 1000) * 0.09;

    // 4. Factor de Capa de Ozono (300 DU es referencia normal)
    const ozoneFactor = Math.pow(300 / Math.max(180, ozoneDobson), 1.1);

    // 5. Factor de Nubosidad
    let cloudFactor = 1.0;
    if (cloudCover === 'cirrus') cloudFactor = 0.92;
    if (cloudCover === 'scattered') cloudFactor = 0.78; // Puede haber momentos de amplificación, pero media menor
    if (cloudCover === 'overcast') cloudFactor = 0.32;

    const rawUVI = baseUVI * altitudeFactor * ozoneFactor * cloudFactor;
    const finalUVI = Number(Math.max(0, Math.min(18, rawUVI)).toFixed(1));

    // Categoría de la OMS
    let whoCategory = 'Bajo';
    let categoryColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300';
    let protectionAdvice = 'No requiere protección especial prolongada. Ideal para sintetizar vitamina D de forma segura.';
    if (finalUVI >= 11) {
      whoCategory = 'Extremadamente Alto (Peligro Crítico)';
      categoryColor = 'text-purple-700 bg-purple-50 dark:bg-purple-950/40 border-purple-300';
      protectionAdvice = '¡Peligro extremo! Evitar exposición solar entre las 10:30 y 16:30. Buscar sombra indispensable, camisa de manga larga, sombrero legionario y lentes con filtro UV400.';
    } else if (finalUVI >= 8) {
      whoCategory = 'Muy Alto';
      categoryColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border-rose-300';
      protectionAdvice = 'Riesgo alto de quemaduras dérmicas. Utilizar protector solar FPS 30+, gafas UV y sombrero de ala ancha.';
    } else if (finalUVI >= 6) {
      whoCategory = 'Alto';
      categoryColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300';
      protectionAdvice = 'Protección necesaria. Reducir la exposición durante el mediodía y aplicar protector solar en zonas expuestas.';
    } else if (finalUVI >= 3) {
      whoCategory = 'Moderado';
      categoryColor = 'text-yellow-700 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300';
      protectionAdvice = 'Riesgo leve a moderado. Usar sombrero o permanecer en semisombra al mediodía si la piel es sensible.';
    }

    // Biología: Tiempo para eritema / quemadura solar (MED = Dosis Eritemática Mínima)
    // 1 UVI = 25 mW/m² de radiación ponderada eritemáticamente = 0.025 J/(s·m²)
    // Tiempo en segundos = MED / (finalUVI * 0.025)
    const selectedSkin = fitzpatrickTypes.find((f) => f.type === skinType) || fitzpatrickTypes[1];
    let timeToBurnMin = 999;
    if (finalUVI > 0.3) {
      const uviPowerEffective = finalUVI * 0.025; // J/(s*m2)
      const baseSeconds = selectedSkin.med / uviPowerEffective;
      // El factor de protección solar (FPS) multiplica el tiempo seguro antes del eritema
      const effectiveFactor = spfFactor > 0 ? Math.min(60, spfFactor * 0.85) : 1;
      timeToBurnMin = Math.round((baseSeconds * effectiveFactor) / 60);
    }

    // Tiempo óptimo para síntesis de Vitamina D (aproximadamente 25% a 30% del tiempo de eritema de fototipo II sin protector)
    const timeForVitDMin = finalUVI > 0.5 ? Math.max(5, Math.round(20 / finalUVI)) : 60;

    return {
      finalUVI,
      whoCategory,
      categoryColor,
      protectionAdvice,
      solarElevationDeg: Math.round(solarElevationDeg),
      selectedSkin,
      timeToBurnMin: timeToBurnMin > 360 ? '> 6 horas' : `${timeToBurnMin} minutos`,
      rawMinutes: timeToBurnMin,
      timeForVitDMin: timeForVitDMin > 60 ? '> 60 minutos' : `${timeForVitDMin} minutos`,
    };
  }, [solarHour, altitudeMeters, cloudCover, ozoneDobson, skinType, spfFactor]);

  return (
    <div className="space-y-6">
      {/* Explicación Pedagógica */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 text-sky-600 font-bold text-sm mb-1">
          <Sun className="w-5 h-5 text-amber-500" />
          <span>Física y Biología: Radiación Ultravioleta, Capa de Ozono y Fotoprotección</span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          El <strong>Índice UV Solar Mundial (UVI)</strong> cuantifica el riesgo de daño eritematoso sobre la piel humana. En el Noroeste Argentino (Salta y Jujuy), los índices UV suelen superar con frecuencia el valor 12 en verano debido a la <strong>elevada altitud geográfica</strong> (menor masa atmosférica) y a la <strong>baja latitud subtropical</strong>.
        </p>
      </div>

      {/* Controles de Entrada */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Hora del Día */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Clock className="w-4 h-4 text-amber-500" />
              Hora Solar del Día
            </span>
            <span className="font-mono font-bold text-amber-600">
              {Math.floor(solarHour)}:{Math.round((solarHour % 1) * 60).toString().padStart(2, '0')} hs
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="20"
            step="0.5"
            value={solarHour}
            onChange={(e) => setSolarHour(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>06:00 (Amanecer)</span>
            <span>13:30 (Cénit)</span>
            <span>20:00 (Ocaso)</span>
          </div>
        </div>

        {/* Altitud sobre el nivel del mar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              Altitud Geográfica
            </span>
            <span className="font-mono font-bold text-sky-600">{altitudeMeters} msnm</span>
          </div>
          <input
            type="range"
            min="0"
            max="4500"
            step="50"
            value={altitudeMeters}
            onChange={(e) => setAltitudeMeters(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
          <div className="flex items-center gap-1.5 mt-2">
            {[
              { label: 'Nivel Mar (0m)', alt: 0 },
              { label: 'Güemes (695m)', alt: 695 },
              { label: 'Salta Capital (1187m)', alt: 1187 },
              { label: 'Puna / S. A. Cobres (3775m)', alt: 3775 },
            ].map((preset) => (
              <button
                key={preset.alt}
                onClick={() => setAltitudeMeters(preset.alt)}
                className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                  altitudeMeters === preset.alt
                    ? 'bg-sky-600 text-white border-sky-600 font-bold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Cobertura Nubosa */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-2">
            Cobertura Nubosa
          </span>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {[
              { id: 'clear', label: 'Despejado (100% UV)' },
              { id: 'cirrus', label: 'Cirros altos (92% UV)' },
              { id: 'scattered', label: 'Cúmulos (78% UV)' },
              { id: 'overcast', label: 'Cubierto (32% UV)' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => setCloudCover(c.id as any)}
                className={`py-1.5 px-2 rounded-lg text-left text-[11px] font-medium border transition-colors ${
                  cloudCover === c.id
                    ? 'border-sky-600 bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Espesor Capa de Ozono */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Shield className="w-4 h-4 text-cyan-500" />
              Capa de Ozono Estratosférico
            </span>
            <span className="font-mono font-bold text-cyan-600">{ozoneDobson} DU</span>
          </div>
          <input
            type="range"
            min="200"
            max="380"
            step="5"
            value={ozoneDobson}
            onChange={(e) => setOzoneDobson(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>200 DU (Capa muy reducida)</span>
            <span>270 DU (Normal NOA)</span>
            <span>350 DU (Espesa)</span>
          </div>
        </div>

        {/* Fototipo de Piel (Fitzpatrick) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <User className="w-4 h-4 text-rose-500" />
              Fototipo Cutáneo (Fitzpatrick)
            </span>
            <span className="font-mono font-bold text-rose-600">Tipo {skinType}</span>
          </div>
          <select
            value={skinType}
            onChange={(e) => setSkinType(Number(e.target.value))}
            className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
          >
            {fitzpatrickTypes.map((f) => (
              <option key={f.type} value={f.type}>
                {f.name}: {f.desc}
              </option>
            ))}
          </select>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 italic">
            {simulation.selectedSkin.burn}
          </div>
        </div>

        {/* Factor de Protección Solar (FPS / SPF) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
              <Shield className="w-4 h-4 text-emerald-500" />
              Protección Solar Aplicada (FPS)
            </span>
            <span className="font-mono font-bold text-emerald-600">
              {spfFactor === 0 ? 'Sin protector' : `FPS ${spfFactor}`}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-1.5 mt-2">
            {[0, 15, 30, 50].map((spf) => (
              <button
                key={spf}
                onClick={() => setSpfFactor(spf)}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  spfFactor === spf
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {spf === 0 ? '0 (Ninguno)' : `FPS ${spf}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTADOS DEL MODELO FOTOBIOLÓGICO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tacómetro / Visualizador de Índice UV */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col items-center justify-center text-center">
          <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2">
            Índice UV Resultante (UVI)
          </div>

          <div className="text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white my-2">
            {simulation.finalUVI}
          </div>

          <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold border ${simulation.categoryColor}`}>
            Nivel: {simulation.whoCategory}
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full mt-6 overflow-hidden flex">
            <div className="bg-emerald-500 h-full w-[18%]" title="Bajo (0-2)" />
            <div className="bg-yellow-400 h-full w-[20%]" title="Moderado (3-5)" />
            <div className="bg-amber-500 h-full w-[17%]" title="Alto (6-7)" />
            <div className="bg-rose-500 h-full w-[22%]" title="Muy Alto (8-10)" />
            <div className="bg-purple-600 h-full w-[23%]" title="Extremo (11+)" />
          </div>

          <div className="flex justify-between w-full text-[10px] text-slate-400 mt-1 font-mono">
            <span>0</span>
            <span>3</span>
            <span>6</span>
            <span>8</span>
            <span>11+</span>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Elevación solar calculada: <strong className="text-slate-700 dark:text-slate-300 font-mono">{simulation.solarElevationDeg}°</strong>
          </div>
        </div>

        {/* Panel Biológico y Tiempos de Exposición */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tiempo máximo seguro sin quemadura */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Tiempo Máx. sin Quemadura (Eritema)</span>
              </div>
              <div className="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">
                {simulation.timeToBurnMin}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Para {simulation.selectedSkin.name} ({simulation.selectedSkin.desc})
              </p>
            </div>

            {/* Tiempo para Síntesis de Vitamina D */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <HeartPulse className="w-4 h-4 text-emerald-500" />
                <span>Tiempo Óptimo Síntesis Vitamina D</span>
              </div>
              <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                {simulation.timeForVitDMin}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Exponiendo cara, brazos y manos (sin llegar al eritema)
              </p>
            </div>
          </div>

          {/* Recomendación sanitaria y fotoprotección OMS */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-sky-600" />
              <span>Protocolo de Protección Recomendado (OMS / Sociedad Argentina de Dermatología):</span>
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {simulation.protectionAdvice}
            </p>
          </div>

          {/* Guía Pedagógica Interdisciplinaria */}
          <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-600" />
              <span>Consignas para Alumnos de Secundaria:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
              <li><strong>Física:</strong> Mueve el slider de altitud de 0m a 3775m (Puna). ¿Qué porcentaje aumentó el UVI y por qué la menor densidad del aire disuelve menos radiación por dispersión de Rayleigh?</li>
              <li><strong>Biología:</strong> Compara el tiempo hasta quemadura entre Fototipo I y Fototipo V. ¿Qué rol protector cumple el polímero de eumelanina en el núcleo de los queratinocitos frente a los dímeros de timina?</li>
              <li><strong>Salud Pública:</strong> ¿Por qué el factor de protección FPS 30 multiplica el tiempo de exposición segura por aproximadamente 25 a 30 veces si se aplica correctamente?</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
