/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Motor de Detección de Alertas y Umbrales Meteorológicos
 * Ubicación: General Güemes, Salta, Argentina (Lat -24.6708, Long -65.0498 · 695 msnm)
 */

import type { WeatherObservation } from '../types/weather.ts';

export type AlertSeverity = 'warning' | 'alert' | 'danger';

export interface WeatherAlert {
  id: string;
  type: 'wind' | 'heat' | 'frost' | 'rain' | 'uv' | 'zonda_fire';
  severity: AlertSeverity;
  title: string;
  badgeLabel: string;
  valueDisplay: string;
  thresholdDisplay: string;
  description: string;
  recommendations: string[];
  textColor: string;
  bgColor: string;
  borderColor: string;
  pulseColor: string;
}

export interface ThresholdDefinition {
  type: string;
  category: string;
  metric: string;
  unit: string;
  warningThreshold: number;
  dangerThreshold: number;
  description: string;
}

export const WEATHER_THRESHOLDS: ThresholdDefinition[] = [
  {
    type: 'wind',
    category: 'Vientos y Ráfagas',
    metric: 'Ráfaga de Viento',
    unit: 'km/h',
    warningThreshold: 40,
    dangerThreshold: 60,
    description: 'Ráfagas que comprometen estructuras livianas, arbolado y tránsito en la RN 34.',
  },
  {
    type: 'heat',
    category: 'Temperatura Extrema (Calor)',
    metric: 'Temperatura Exterior',
    unit: '°C',
    warningThreshold: 34,
    dangerThreshold: 38,
    description: 'Olas de calor subtropical con riesgo de estrés térmico y golpe de calor en la población.',
  },
  {
    type: 'frost',
    category: 'Bajas Temperaturas / Heladas',
    metric: 'Temperatura Mínima',
    unit: '°C',
    warningThreshold: 3,
    dangerThreshold: 0,
    description: 'Temperaturas bajo cero que provocan heladas radiativas perjudiciales para caña y tabaco.',
  },
  {
    type: 'rain',
    category: 'Precipitaciones Torrenciales',
    metric: 'Tasa de Precipitación',
    unit: 'mm/h',
    warningThreshold: 12,
    dangerThreshold: 30,
    description: 'Lluvias convectivas intensas con anegamientos rápidos en el casco urbano de Güemes.',
  },
  {
    type: 'uv',
    category: 'Radiación Ultravioleta',
    metric: 'Índice UV Solar',
    unit: 'UVI',
    warningThreshold: 8,
    dangerThreshold: 11,
    description: 'Niveles de irradiancia UV muy altos a extremos según la escala de la OMS.',
  },
  {
    type: 'zonda_fire',
    category: 'Riesgo de Incendios / Viento Zonda',
    metric: 'Humedad Relativa Crítica',
    unit: '%',
    warningThreshold: 20,
    dangerThreshold: 15,
    description: 'Desecación extrema por efecto Föhn con peligro explosivo de incendios de pastizales.',
  },
];

/**
 * Evalúa una observación meteorológica y retorna la lista de alertas activas
 */
export function evaluateWeatherAlerts(obs: WeatherObservation | null): WeatherAlert[] {
  if (!obs) return [];

  const alerts: WeatherAlert[] = [];

  const temp = obs.temperature_c ?? null;
  const feelsLike = obs.feels_like_c ?? null;
  const gust = obs.wind_gust_kmh ?? null;
  const windSpeed = obs.wind_speed_kmh ?? null;
  const humidity = obs.relative_humidity_pct ?? null;
  const rainRate = obs.precipitation_rate_mmh ?? null;
  const rainDaily = obs.precipitation_daily_mm ?? null;
  const uv = obs.uv_index ?? null;

  // 1. VIENTO FUERTE Y RÁFAGAS
  const maxWindParam = Math.max(gust || 0, windSpeed || 0);
  if (maxWindParam >= 60) {
    alerts.push({
      id: 'alert_wind_danger',
      type: 'wind',
      severity: 'danger',
      title: 'Alerta Roja: Viento Muy Fuerte y Ráfagas Severas',
      badgeLabel: `Viento ${maxWindParam} km/h`,
      valueDisplay: `${maxWindParam} km/h`,
      thresholdDisplay: '≥ 60 km/h',
      description: `Se registran ráfagas violentas de ${maxWindParam} km/h en la estación del Colegio 5085. Peligro de voladura de chapas y ramas caídas.`,
      recommendations: [
        'Evitar circular bajo árboles añosos y postes de tendido eléctrico.',
        'Asegurar elementos sueltos en patios, tinglados y terrazas.',
        'Precaución extrema en el patio escolar y en el tránsito sobre RN 34.',
      ],
      textColor: 'text-rose-700 dark:text-rose-300',
      bgColor: 'bg-rose-50 dark:bg-rose-950/60',
      borderColor: 'border-rose-300 dark:border-rose-800',
      pulseColor: 'bg-rose-500',
    });
  } else if (maxWindParam >= 40) {
    alerts.push({
      id: 'alert_wind_warning',
      type: 'wind',
      severity: 'warning',
      title: 'Advertencia Amarilla: Viento Fuerte con Ráfagas',
      badgeLabel: `Ráfagas ${maxWindParam} km/h`,
      valueDisplay: `${maxWindParam} km/h`,
      thresholdDisplay: '≥ 40 km/h',
      description: `Ráfagas de viento considerables de ${maxWindParam} km/h registradas en General Güemes.`,
      recommendations: [
        'Cerrar ventanas y asegurar cortinas en las aulas.',
        'Extremar precauciones en actividades deportivas al aire libre.',
      ],
      textColor: 'text-amber-800 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-300 dark:border-amber-700',
      pulseColor: 'bg-amber-500',
    });
  }

  // 2. TEMPERATURAS EXTREMAS: CALOR
  if (temp !== null && (temp >= 38 || (feelsLike !== null && feelsLike >= 41))) {
    alerts.push({
      id: 'alert_heat_danger',
      type: 'heat',
      severity: 'danger',
      title: 'Alerta Roja: Ola de Calor Extremo',
      badgeLabel: `Calor ${temp}°C (ST ${feelsLike ?? temp}°C)`,
      valueDisplay: `${temp} °C (Sensación: ${feelsLike ?? temp} °C)`,
      thresholdDisplay: '≥ 38 °C / ST ≥ 41 °C',
      description: `Temperatura extrema de ${temp} °C con sensación térmica de ${feelsLike ?? temp} °C en Güemes. Alto riesgo fisiológico de golpe de calor.`,
      recommendations: [
        'Hidratación continua con agua fresca; evitar bebidas azucaradas o alcohol.',
        'Suspender actividad física intensa bajo el sol directo en horario pico.',
        'Mantener aulas y espacios ventilados o refrigerados.',
      ],
      textColor: 'text-rose-700 dark:text-rose-300',
      bgColor: 'bg-rose-50 dark:bg-rose-950/60',
      borderColor: 'border-rose-300 dark:border-rose-800',
      pulseColor: 'bg-rose-500',
    });
  } else if (temp !== null && (temp >= 34 || (feelsLike !== null && feelsLike >= 37))) {
    alerts.push({
      id: 'alert_heat_warning',
      type: 'heat',
      severity: 'warning',
      title: 'Advertencia: Temperatura Muy Elevada',
      badgeLabel: `Calor ${temp}°C`,
      valueDisplay: `${temp} °C (Sensación: ${feelsLike ?? temp} °C)`,
      thresholdDisplay: '≥ 34 °C / ST ≥ 37 °C',
      description: `Ambiente muy caluroso de ${temp} °C en General Güemes. Se recomienda precaución frente al estrés térmico.`,
      recommendations: [
        'Beber agua con regularidad y vestir ropa clara y liviana.',
        'Proteger especialmente a niños, adultos mayores y mascotas.',
      ],
      textColor: 'text-amber-800 dark:text-amber-300',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-300 dark:border-amber-700',
      pulseColor: 'bg-amber-500',
    });
  }

  // 3. TEMPERATURAS EXTREMAS: HELADAS Y FRÍO
  if (temp !== null && temp <= 0) {
    alerts.push({
      id: 'alert_frost_danger',
      type: 'frost',
      severity: 'danger',
      title: 'Alerta de Helada Activa (T ≤ 0 °C)',
      badgeLabel: `Helada ${temp}°C`,
      valueDisplay: `${temp} °C`,
      thresholdDisplay: '≤ 0.0 °C',
      description: `Temperatura bajo cero (${temp} °C). Riesgo crítico de helada meteorológica y daño foliar en cultivos del Valle de Siancas.`,
      recommendations: [
        'Activar sistemas de riego antihelada en fincas de tabaco, caña y hortalizas.',
        'Abrigarse adecuadamente para prevenir afecciones respiratorias agudas.',
        'Resguardar plantas sensibles y animales domésticos del frío nocturno.',
      ],
      textColor: 'text-cyan-800 dark:text-cyan-200',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/60',
      borderColor: 'border-cyan-300 dark:border-cyan-800',
      pulseColor: 'bg-cyan-500',
    });
  } else if (temp !== null && temp > 0 && temp <= 3.0) {
    alerts.push({
      id: 'alert_frost_warning',
      type: 'frost',
      severity: 'warning',
      title: 'Advertencia: Riesgo de Helada Agronómica',
      badgeLabel: `Frío ${temp}°C`,
      valueDisplay: `${temp} °C`,
      thresholdDisplay: '≤ 3.0 °C',
      description: `Temperatura de ${temp} °C muy próxima al punto de congelación en superficie.`,
      recommendations: [
        'Monitorear la temperatura del suelo y la tendencia del termómetro en la madrugada.',
      ],
      textColor: 'text-sky-800 dark:text-sky-200',
      bgColor: 'bg-sky-50 dark:bg-sky-950/50',
      borderColor: 'border-sky-300 dark:border-sky-700',
      pulseColor: 'bg-sky-500',
    });
  }

  // 4. PRECIPITACIONES INTENSAS / TORMENTA
  if (rainRate !== null && rainRate >= 25) {
    alerts.push({
      id: 'alert_rain_danger',
      type: 'rain',
      severity: 'danger',
      title: 'Alerta: Precipitación Torrencial Activa',
      badgeLabel: `Lluvia ${rainRate} mm/h`,
      valueDisplay: `${rainRate} mm/h (Acumulado: ${rainDaily ?? 0} mm)`,
      thresholdDisplay: '≥ 25 mm/h',
      description: `Lluvia torrencial con tasa instantánea de ${rainRate} mm/h. Alto riesgo de anegamiento de calzadas y acequias.`,
      recommendations: [
        'Evitar cruzar calles o badenes con agua acumulada.',
        'Revisar y mantener despejados desagües pluviales y canaletas.',
        'Manejar con precaución extrema por visibilidad reducida y calzada mojada.',
      ],
      textColor: 'text-blue-800 dark:text-blue-200',
      bgColor: 'bg-blue-50 dark:bg-blue-950/60',
      borderColor: 'border-blue-300 dark:border-blue-800',
      pulseColor: 'bg-blue-500',
    });
  } else if (rainRate !== null && rainRate >= 10) {
    alerts.push({
      id: 'alert_rain_warning',
      type: 'rain',
      severity: 'warning',
      title: 'Aviso: Lluvia Fuerte en Curso',
      badgeLabel: `Lluvia ${rainRate} mm/h`,
      valueDisplay: `${rainRate} mm/h`,
      thresholdDisplay: '≥ 10 mm/h',
      description: `Precipitación activa de intensidad fuerte (${rainRate} mm/h) sobre el casco urbano.`,
      recommendations: [
        'Circular con precaución y luces bajas encendidas.',
      ],
      textColor: 'text-sky-800 dark:text-sky-200',
      bgColor: 'bg-sky-50 dark:bg-sky-950/50',
      borderColor: 'border-sky-300 dark:border-sky-700',
      pulseColor: 'bg-sky-500',
    });
  }

  // 5. RADIACIÓN ULTRAVIOLETA EXTREMA
  if (uv !== null && uv >= 11) {
    alerts.push({
      id: 'alert_uv_danger',
      type: 'uv',
      severity: 'danger',
      title: 'Alerta Púrpura: Radiación UV Extrema',
      badgeLabel: `UV Extremo ${uv}`,
      valueDisplay: `UVI ${uv}`,
      thresholdDisplay: '≥ 11 UVI',
      description: `Índice UV de ${uv} (Nivel Extremo OMS). La piel sin protección puede sufrir eritema y quemaduras en menos de 10 minutos.`,
      recommendations: [
        'Permanecer bajo sombra indispensable entre las 10:30 y 16:30 hs.',
        'Utilizar camisa de manga larga, sombrero de ala ancha y lentes con filtro UV400.',
        'Aplicar protector solar de amplio espectro FPS 30+ o FPS 50+.',
      ],
      textColor: 'text-purple-800 dark:text-purple-200',
      bgColor: 'bg-purple-50 dark:bg-purple-950/60',
      borderColor: 'border-purple-300 dark:border-purple-800',
      pulseColor: 'bg-purple-500',
    });
  } else if (uv !== null && uv >= 8) {
    alerts.push({
      id: 'alert_uv_warning',
      type: 'uv',
      severity: 'warning',
      title: 'Aviso: Radiación UV Muy Alta',
      badgeLabel: `UV Muy Alto ${uv}`,
      valueDisplay: `UVI ${uv}`,
      thresholdDisplay: '≥ 8 UVI',
      description: `Índice UV de ${uv} (Muy Alto). Se requiere protección cutánea y ocular activa.`,
      recommendations: [
        'Usar protector solar FPS 30+ y buscar sombra en horario del mediodía.',
      ],
      textColor: 'text-amber-800 dark:text-amber-200',
      bgColor: 'bg-amber-50 dark:bg-amber-950/50',
      borderColor: 'border-amber-300 dark:border-amber-700',
      pulseColor: 'bg-amber-500',
    });
  }

  // 6. VIENTO ZONDA / RIESGO EXTREMO DE INCENDIOS FORESTALES
  if (humidity !== null && humidity <= 15 && temp !== null && temp >= 28) {
    alerts.push({
      id: 'alert_zonda_danger',
      type: 'zonda_fire',
      severity: 'danger',
      title: 'Alerta Roja: Riesgo Extremo de Incendios (Viento Zonda)',
      badgeLabel: `Riesgo Incendio (HR ${humidity}%)`,
      valueDisplay: `Humedad: ${humidity} % | Temp: ${temp} °C`,
      thresholdDisplay: 'HR ≤ 15% con T ≥ 28°C',
      description: `Desecación ambiental extrema por probable efecto Föhn / Viento Zonda (${humidity}% de humedad con ${temp}°C). Peligro explosivo de propagación de fuego.`,
      recommendations: [
        'Prohibición absoluta de encendido de fuego o quema de pastizales y hojas.',
        'No arrojar colillas de cigarrillos en banquinas de rutas y caminos vecinales.',
        'Avisar inmediatamente a Bomberos Voluntarios de Güemes ante columnas de humo.',
      ],
      textColor: 'text-orange-800 dark:text-orange-200',
      bgColor: 'bg-orange-50 dark:bg-orange-950/60',
      borderColor: 'border-orange-300 dark:border-orange-800',
      pulseColor: 'bg-orange-500',
    });
  }

  // Ordenar alertas por severidad: primero 'danger', luego 'warning'
  const severityOrder: Record<AlertSeverity, number> = {
    danger: 3,
    alert: 2,
    warning: 1,
  };

  alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

  return alerts;
}
