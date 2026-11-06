/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Trayecto de Aprendizaje Interactivo: Variables y Fenómenos Climatológicos
 * Incluye infografías animadas, marcador de progreso y evaluaciones parciales con devolución
 * Ubicación: General Güemes, Salta, Argentina (Lat -24.6708, Long -65.0498 · 695 msnm)
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Sun,
  Layers,
  Mountain,
  Flame,
  Snowflake,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  GraduationCap,
  Activity,
} from 'lucide-react';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface LearningModule {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  variablesCovered: string[];
  phenomenaCovered: string[];
  summary: string;
  detailedContent: {
    sectionTitle: string;
    text: string;
    formula?: string;
    localExample: string;
  }[];
  infographicType: 'thermal_cycle' | 'vpd_stomata' | 'pressure_wind' | 'convection_hail';
  quiz: QuizQuestion[];
}

export const LearningPathView: React.FC = () => {
  // Módulos del Trayecto Formativo
  const modules: LearningModule[] = [
    {
      id: 'mod_thermal',
      number: 1,
      title: 'Régimen Térmico, Sensación y Radiación Solar',
      subtitle: 'La energía que motoriza la atmósfera en General Güemes',
      icon: Thermometer,
      tag: 'Termodinámica & Radiación',
      variablesCovered: [
        'Temperatura Exterior (°C)',
        'Sensación Térmica (°C)',
        'Radiación Solar (W/m²)',
        'Índice UV (UVI)',
      ],
      phenomenaCovered: ['Inercia Térmica Diaria', 'Olas de Calor', 'Eritema por Radiación UV'],
      summary:
        'La temperatura cuantifica la energía cinética media de las moléculas de aire. La radiación solar de onda corta entrante calienta la superficie del suelo de Güemes, el cual re-emite calor a la atmósfera, provocando el conocido desfase térmico vespertino.',
      detailedContent: [
        {
          sectionTitle: '1. Temperatura Real vs. Sensación Térmica (Heat Index / Wind Chill)',
          text: 'El termómetro de la estación mide la temperatura termodinámica del aire en sombra con ventilación forzada. La sensación térmica, en cambio, modela el intercambio de calor entre el cuerpo humano y el ambiente: cuando la temperatura supera los 27°C y la humedad es alta, el sudor no se evapora fácilmente y la sensación corporal es muy superior al valor del termómetro.',
          formula: 'ST = f(T, HR, Viento) · A 34°C con 70% HR, la Sensación Térmica roza los 42°C.',
          localExample:
            'En las tardes de verano en Güemes, el efecto bochorno eleva la sensación térmica 4°C a 7°C por encima de la temperatura medida.',
        },
        {
          sectionTitle: '2. Desfase Térmico (Inercia Radiativa)',
          text: 'Aunque el mediodía solar astronómico en Salta ocurre cerca de las 13:30 (por longitud geográfica -65° y huso UTC-3), el pico diario de temperatura no se registra a esa hora sino entre las 15:30 y 16:30. Esto se debe a que la atmósfera sigue acumulando energía neta mientras la irradiancia solar entrante sea mayor que las pérdidas por radiación infrarroja.',
          formula: 'Balance Neto = Radiación Solar Absorbida - Radiación Infrarroja Saliente',
          localExample:
            'Comprueba en la estación: a las 13:30 la radiación solar llega a su máximo de ~1050 W/m², pero el termómetro sigue subiendo hasta las 16:00.',
        },
        {
          sectionTitle: '3. Radiación Solar Global e Índice Ultravioleta (UVI)',
          text: 'La radiación solar se mide en vatios por metro cuadrado (W/m²). La fracción ultravioleta (UV) no produce calor sensible pero posee fotones de alta energía capaces de romper enlaces de ADN celular. Debido a la altitud de 695 msnm y la cercanía al Trópico de Capricornio, Güemes registra con frecuencia índices UV de 11 a 13 (categoría Extrema de la OMS).',
          formula: '1 UVI = 25 mW/m² de radiación con ponderación eritematosa de McKinley-Diffey.',
          localExample:
            'En el recreo de las 11:30 a 14:00, la exposición sin protección solar puede causar eritema cutáneo en menos de 15 minutos en fototipos I y II.',
        },
      ],
      infographicType: 'thermal_cycle',
      quiz: [
        {
          id: 'q1_1',
          question:
            '¿Por qué en General Güemes la temperatura máxima del día suele ocurrir entre las 15:30 y 16:30 y no al mediodía solar?',
          options: [
            'Porque el viento cambia de dirección a esa hora exclusivamente.',
            'Por la inercia térmica: el suelo continúa transfiriendo calor acumulado mientras la radiación solar entrante supere la emisión infrarroja.',
            'Porque los sensores de la estación tienen un retraso electrónico deliberado de 3 horas.',
            'Porque la capa de ozono desaparece durante la siesta.',
          ],
          correctIndex: 1,
          explanation:
            '¡Correcto! Es el principio de inercia térmica. La atmósfera continúa calentándose mientras exista un balance neto positivo de energía entre la absorción solar y la pérdida infrarroja terrestre.',
        },
        {
          id: 'q1_2',
          question:
            'Si el termómetro marca 33°C pero la humedad relativa es del 75%, ¿por qué sentimos mucho más calor?',
          options: [
            'Porque el aire húmedo tiene menor densidad que el aire seco.',
            'Porque el vapor de agua en el aire impide que el sudor corporal se evapore eficientemente, bloqueando la disipación de calor.',
            'Porque la presión barométrica comprime las células epidérmicas.',
            'Porque la radiación infrarroja se multiplica por diez.',
          ],
          correctIndex: 1,
          explanation:
            '¡Exacto! El mecanismo fisiológico primario del ser humano para enfriarse es la evaporación del sudor (calor latente de vaporización). Con alta humedad, el gradiente de presión de vapor disminuye y el sudor no se evapora.',
        },
        {
          id: 'q1_3',
          question:
            '¿Qué factor geográfico de General Güemes (695 msnm) acentúa los valores extremos de Índice UV respecto al nivel del mar?',
          options: [
            'La mayor distancia al Ecuador.',
            'La menor columna atmosférica interpuesta, lo que reduce la dispersión de Rayleigh de los fotones UV.',
            'La proximidad a la cuenca del Río Mojotoro.',
            'La ausencia total de nitrógeno en el aire salteño.',
          ],
          correctIndex: 1,
          explanation:
            '¡Excelente! A mayor altitud, la masa óptica del aire es menor y hay menos moléculas para dispersar la radiación ultravioleta (+8% a +10% de UV por cada 1000m de elevación).',
        },
      ],
    },
    {
      id: 'mod_humidity',
      number: 2,
      title: 'Humedad, Punto de Rocío y Déficit de Presión de Vapor (VPD)',
      subtitle: 'El balance hídrico del aire y los cultivos en el Valle de Siancas',
      icon: Droplets,
      tag: 'Psicrometría & Biología Vegetal',
      variablesCovered: [
        'Humedad Relativa (%)',
        'Punto de Rocío (°C)',
        'Déficit de Presión de Vapor - VPD (kPa)',
      ],
      phenomenaCovered: ['Condensación y Rocío', 'Estrés Hídrico en Plantas', 'Apertura Estomática'],
      summary:
        'La humedad relativa indica el porcentaje de saturación del aire a su temperatura actual. El punto de rocío señala la temperatura exacta a la que debe enfriarse para condensar. El VPD cuantifica la fuerza secante que absorbe agua de los cultivos de caña de azúcar y tabaco.',
      detailedContent: [
        {
          sectionTitle: '1. Humedad Relativa vs. Punto de Rocío (Dew Point)',
          text: 'La humedad relativa (HR) es engañosa porque depende de la temperatura: un aire a 15°C con 80% de HR contiene menos gramos de agua por metro cúbico que un aire a 35°C con 50% de HR. En cambio, el punto de rocío ($T_d$) mide la cantidad absoluta de vapor en la masa de aire. Cuando la temperatura nocturna desciende hasta igualar al punto de rocío ($T = T_d$), la HR llega al 100% y se forman gotas de rocío o niebla.',
          formula: 'HR = (Presión de vapor real / Presión de vapor de saturación) × 100%',
          localExample:
            'En las madrugadas de invierno en Güemes, el enfriamiento por radiación hace que T baje a 4°C igualando al punto de rocío, cubriendo los campos de escarcha o rocío denso.',
        },
        {
          sectionTitle: '2. Déficit de Presión de Vapor (VPD): Parámetro Agronómico Clave',
          text: 'El VPD representa la diferencia entre la presión de vapor que hay dentro de la hoja saturada al 100% y la presión de vapor del aire exterior. Si el VPD es muy bajo (< 0.4 kPa), la planta no puede transpirar ni transportar nutrientes minerales desde las raíces. Si el VPD es muy alto (> 1.6 kPa), el aire reseca la hoja y la planta cierra sus estomas, deteniendo la fotosíntesis para no deshidratarse.',
          formula: 'VPD = Vp_sat(T_hoja) - Vp_aire_real (expresado en kPa)',
          localExample:
            'En las plantaciones de tabaco y hortalizas de Güemes, un VPD de 0.8 a 1.2 kPa permite máxima fotosíntesis y translocación de azúcares.',
        },
      ],
      infographicType: 'vpd_stomata',
      quiz: [
        {
          id: 'q2_1',
          question:
            '¿Por qué la humedad relativa aumenta durante la madrugada en Güemes aunque no haya llovido ni ingresado una masa de aire nueva?',
          options: [
            'Porque las plantas liberan todo su oxígeno a la atmósfera.',
            'Porque al descender la temperatura del aire nocturno, su capacidad de retener vapor disminuye según la ley de Clausius-Clapeyron.',
            'Porque la gravedad atrae las nubes hacia el suelo durante la noche.',
            'Porque la presión barométrica se duplica en la oscuridad.',
          ],
          correctIndex: 1,
          explanation:
            '¡Correcto! El aire frío admite menos vapor de agua antes de saturarse. Al enfriarse sin cambiar la cantidad de vapor, la humedad relativa porcentual sube automáticamente.',
        },
        {
          id: 'q2_2',
          question:
            '¿Qué ocurre en una planta de caña de azúcar o tabaco cuando el VPD supera los 1.8 kPa en una tarde calurosa y seca?',
          options: [
            'La planta absorbe vapor de agua directamente del aire.',
            'Las células oclusivas cierran los estomas para evitar la cavitación del xilema, frenando la fotosíntesis neta.',
            'La planta duplica su crecimiento vegetativo.',
            'Las raíces dejan de necesitar agua del suelo.',
          ],
          correctIndex: 1,
          explanation:
            '¡Exacto! Ante un aire excesivamente desecante (alto VPD), los estomas se cierran para evitar la pérdida letal de turgencia, lo que interrumpe la absorción de CO₂ y detiene el crecimiento.',
        },
        {
          id: 'q2_3',
          question:
            'Si la temperatura ambiental es de 22°C y el punto de rocío calculado es de 21.5°C, ¿qué condición atmosférica está ocurriendo?',
          options: [
            'Aire extremadamente seco con riesgo de incendios.',
            'El aire está prácticamente saturado (HR ~97%) y se condensará rocío o niebla al menor enfriamiento.',
            'Ocurrirá una ola de calor instantánea.',
            'La presión atmosférica ha caído a cero.',
          ],
          correctIndex: 1,
          explanation:
            '¡Muy bien! Cuando la temperatura se acerca a décimas del punto de rocío, la humedad relativa roza el 100% y el vapor comienza la transición de fase hacia microgotas líquidas.',
        },
      ],
    },
    {
      id: 'mod_pressure_wind',
      number: 3,
      title: 'Presión Barométrica, Dinámica de Vientos y Efecto Föhn',
      subtitle: 'Fuerzas aerodinámicas y el impacto del Viento Zonda en Salta',
      icon: Wind,
      tag: 'Dinámica de Fluidos & Orospía',
      variablesCovered: [
        'Presión Relativa y Absoluta (hPa)',
        'Velocidad y Ráfagas de Viento (km/h)',
        'Rumbo Vectorial Circular (°)',
      ],
      phenomenaCovered: ['Viento Zonda en el NOA', 'Centros de Alta y Baja Presión', 'Estadística Circular'],
      summary:
        'El viento es aire en movimiento impulsado por diferencias de presión barométrica. En Salta, el relieve de los Andes produce el temido Viento Zonda: una masa que se deshidrata al subir la cordillera y desciende a sotavento comprimiéndose a razón de 9.8 °C por cada 1000 metros.',
      detailedContent: [
        {
          sectionTitle: '1. Presión Atmosférica: Absoluta vs. Relativa',
          text: 'La presión atmosférica es el peso de la columna de aire por unidad de superficie. A mayor altitud, menor es la columna de aire por encima. Por ello, en General Güemes (695 msnm) la presión absoluta real ronda los 940 hPa. Para comparar con el resto del mundo y los mapas sinópticos del SMN, se normaliza matemáticamente al nivel del mar (Presión Relativa ~1013 hPa).',
          formula: 'Reducción Barométrica Internacional: P_rel = P_abs × [1 + (h / 44330)]^5.255',
          localExample:
            'Cuando una borrasca o baja presión profunda se aproxima desde el Chaco, la presión barométrica cae abruptamente anticipando tormentas convectivas.',
        },
        {
          sectionTitle: '2. Termodinámica del Efecto Föhn (Viento Zonda)',
          text: 'El Zonda ocurre cuando aire húmedo del Pacífico asciende por los Andes chilenos enfriándose a 5.5°C/km (gradiente húmedo) y dejando toda su lluvia en la montaña. Al cruzar la cumbre y descender hacia los valles de Salta, el aire baja seco calentándose a 9.8°C/km (gradiente adiabático seco). Llega a Güemes como un viento sofocante, con ráfagas violentas y humedades menores al 15%.',
          formula: 'Calentamiento Föhn: ΔT = (Gradiente Seco - Gradiente Húmedo) × Altura condensada',
          localExample:
            'Entre agosto y noviembre, episodios de Zonda en Güemes pueden elevar el termómetro a 38°C con 11% de humedad, disparando el riesgo de incendios.',
        },
      ],
      infographicType: 'pressure_wind',
      quiz: [
        {
          id: 'q3_1',
          question:
            '¿Por qué el Viento Zonda llega a los valles de Salta mucho más cálido y seco que cuando inició su ascenso en el Pacífico?',
          options: [
            'Porque pasa por un volcán activo que calienta el aire.',
            'Porque al subir condensó su vapor liberando calor latente, y al descender por sotavento se comprimió adiabáticamente a razón de +9.8°C cada 1000m.',
            'Porque la fricción con las rocas de la Puna enciende chispas térmicas.',
            'Porque el viento viaja a la velocidad del sonido.',
          ],
          correctIndex: 1,
          explanation:
            '¡Correcto! Es la termodinámica del efecto Föhn: la liberación de calor latente de condensación en barlovento sumada al calentamiento por compresión adiabática seca en sotavento.',
        },
        {
          id: 'q3_2',
          question:
            '¿Cuál es la diferencia entre la presión barométrica absoluta y la presión relativa que muestra la estación?',
          options: [
            'La absoluta se mide en invierno y la relativa en verano.',
            'La absoluta es el peso real del aire a los 695 msnm de Güemes; la relativa está corregida al nivel del mar para permitir comparación sinóptica.',
            'La relativa incluye la velocidad del viento y la absoluta no.',
            'No hay ninguna diferencia física.',
          ],
          correctIndex: 1,
          explanation:
            '¡Exacto! La corrección al nivel del mar elimina el efecto de la topografía, permitiendo comparar estaciones meteorológicas en distintas altitudes.',
        },
        {
          id: 'q3_3',
          question:
            '¿Por qué el rumbo del viento no se puede promediar con una media aritmética simple cuando oscila entre 350° (NNO) y 10° (NNE)?',
          options: [
            'Porque el sensor Ecowitt se apaga al llegar a 360°.',
            'Porque la media aritmética simple de 350° y 10° daría 180° (Sur), un error de 180° opuesto al viento real del Norte. Se requiere estadística circular vectorial.',
            'Porque los vientos del Norte están prohibidos en el hemisferio sur.',
            'Porque el viento no tiene masa.',
          ],
          correctIndex: 1,
          explanation:
            '¡Brillante! El círculo es una variable angular continua periódica. Promediar aritméticamente 350° y 10° da (350+10)/2 = 180° (Sur). La descomposición en componentes sen(θ) y cos(θ) resuelve este error.',
        },
      ],
    },
    {
      id: 'mod_rain_convection',
      number: 4,
      title: 'Pluviometría, Tormentas Convectivas, Granizo y Heladas',
      subtitle: 'Eventos extremos y comportamiento hidrometeorológico',
      icon: CloudRain,
      tag: 'Convección Profunda & Agroclima',
      variablesCovered: [
        'Precipitación Acumulada (mm)',
        'Intensidad / Tasa de Lluvia (mm/h)',
        'Estado del Cielo',
      ],
      phenomenaCovered: ['Formación de Granizo', 'Inversión Térmica Nocturna', 'Heladas Blancas vs Negras'],
      summary:
        'En Güemes, las tormentas estivales son de origen convectivo: corrientes ascendentes de más de 120 km/h sostienen piedras de hielo que crecen por acreción. En invierno ocurre lo contrario: la inversión térmica acumula aire denso helado en el fondo del valle.',
      detailedContent: [
        {
          sectionTitle: '1. Medición de Lluvia: Acumulado (mm) vs. Tasa (mm/h)',
          text: 'Un milímetro de lluvia (1 mm) equivale a 1 litro de agua distribuido homogéneamente en un metro cuadrado de suelo ($1\text{ mm} = 1\text{ L/m}^2$). La tasa de lluvia (Rain Rate en mm/h) mide la velocidad instantánea de precipitación mediante el intervalo entre basculamientos del balancín pluviométrico. Una tasa superior a 30 mm/h satura rápidamente los canales de desagüe.',
          formula: '1 mm de lámina de agua = 1 L / m² = 10 m³ por hectárea agrícola.',
          localExample:
            'Una tormenta de 50 mm en Güemes aporta 500.000 litros de agua por hectárea a los cañaverales del Ingenio San Isidro.',
        },
        {
          sectionTitle: '2. Física del Granizo y Convección en el Valle de Siancas',
          text: 'Las nubes Cumulonimbus alcanzan más de 14.000 metros de altura en Salta. La energía potencial convectiva disponible (CAPE) genera corrientes ascendentes que superan los 30 m/s. En la zona de crecimiento (-10°C a -30°C), las gotas de agua sobreenfriada chocan y se congelan sobre embriones de hielo, formando capas concéntricas hasta que su peso supera la fuerza de sustentación del aire.',
          formula: 'Velocidad de corriente ascendente: w_max = √(2 × CAPE) en m/s.',
          localExample:
            'Con un CAPE de 2500 J/kg en enero, el updraft alcanza 70 m/s (252 km/h), capaz de sostener piedras de granizo del tamaño de pelotas de golf.',
        },
        {
          sectionTitle: '3. Inversión Térmica: Heladas Blancas vs. Negras',
          text: 'En noches despejadas de invierno, el suelo irradia calor velozmente y enfría la capa de aire en contacto con él. Al ser más denso, el aire frío se escurre por gravedad hacia el fondo del Valle de Siancas, quedando atrapado bajo una capa de aire más cálido (inversión térmica). Si hay humedad, se forma helada blanca con escarcha; si el aire es polar extremadamente seco, ocurre helada negra, congelando los vasos internos de la planta sin escarcha visible.',
          formula: 'Helada Blanca: Escarcha superficial (libera 80 cal/g) | Helada Negra: Muerte celular directa.',
          localExample:
            'Las heladas negras de julio son las más temidas por los productores de hortalizas y caña en Campo Santo y Güemes.',
        },
      ],
      infographicType: 'convection_hail',
      quiz: [
        {
          id: 'q4_1',
          question:
            '¿Qué significa físicamente que la estación meteorológica registre un acumulado de 25 mm de precipitación?',
          options: [
            'Que el agua subió 25 metros de altura.',
            'Que cayeron exactamente 25 litros de agua por cada metro cuadrado de superficie.',
            'Que el pluviómetro se llenó un 25% de su capacidad total.',
            'Que llovió durante 25 minutos seguidos.',
          ],
          correctIndex: 1,
          explanation:
            '¡Correcto! Por definición geométrica, 1 mm de lámina de agua sobre una base de 1 m² (1000 cm × 1000 cm × 0.1 cm = 1000 cm³) equivale exactamente a 1 litro de agua.',
        },
        {
          id: 'q4_2',
          question:
            '¿Por qué las piedras de granizo presentan capas concéntricas alternadas de hielo opaco y transparente?',
          options: [
            'Porque se congelan con diferentes colores de luz solar.',
            'Porque recirculan múltiples veces dentro de la nube: el hielo transparente se forma por congelamiento lento en capas húmedas y el opaco por congelamiento instantáneo con aire atrapado a temperaturas más bajas.',
            'Porque el granizo se forma en el espacio exterior y entra como meteorito.',
            'Porque absorben polvo de la tierra en cada giro.',
          ],
          correctIndex: 1,
          explanation:
            '¡Exacto! El crecimiento por acreción en ciclos sucesivos de ascenso y descenso térmico genera anillos de hielo cristalino (congelamiento húmedo lento) y lechoso (congelamiento seco con burbujas de aire).',
        },
        {
          id: 'q4_3',
          question:
            '¿Por qué la helada negra es agronómicamente mucho más destructiva que la helada blanca con la misma temperatura de -2°C?',
          options: [
            'Porque la helada negra contiene ceniza volcánica.',
            'Porque ocurre con aire muy seco sin formación de escarcha, congelando directamente los jugos intracelulares sin la liberación de calor latente de fusión (80 cal/g) que otorga el agua al escarcharse.',
            'Porque la helada blanca no moja las hojas.',
            'Porque la helada negra dura 24 horas continuas.',
          ],
          correctIndex: 1,
          explanation:
            '¡Brillante! Al no haber condensación ni congelamiento de vapor exterior, no se liberan las 80 calorías por gramo de calor latente, y el hielo intracelular rompe las membranas plasmáticas provocando necrosis inmediata (color negro).',
        },
      ],
    },
  ];

  // Estado del progreso persistente en localStorage
  const [completedTopicIds, setCompletedTopicIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('colegio5085_learning_completed_topics');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [quizScores, setQuizScores] = useState<Record<string, { score: number; total: number; passed: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('colegio5085_learning_quiz_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Módulo seleccionado actualmente
  const [selectedModId, setSelectedModId] = useState<string>('mod_thermal');
  const activeModule = modules.find((m) => m.id === selectedModId) || modules[0];

  // Respuestas del cuestionario activo
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('colegio5085_learning_completed_topics', JSON.stringify(completedTopicIds));
    } catch (e) {
      console.error(e);
    }
  }, [completedTopicIds]);

  useEffect(() => {
    try {
      localStorage.setItem('colegio5085_learning_quiz_scores', JSON.stringify(quizScores));
    } catch (e) {
      console.error(e);
    }
  }, [quizScores]);

  // Al cambiar de módulo, restablecer el formulario de preguntas si no fue respondido
  useEffect(() => {
    setUserAnswers({});
    setQuizSubmitted(false);
  }, [selectedModId]);

  // Cálculos de Progreso General
  const totalTopics = modules.length;
  const completedTopicsCount = completedTopicIds.length;
  const totalQuizzes = modules.length;
  const passedQuizzesCount = Object.values(quizScores).filter((q) => q.passed).length;

  // Ponderación: 50% lectura de módulos + 50% evaluaciones aprobadas
  const overallProgressPct = Math.round(
    (completedTopicsCount / totalTopics) * 50 + (passedQuizzesCount / totalQuizzes) * 50
  );

  // Insignia según avance
  const studentBadge =
    overallProgressPct === 100
      ? { title: 'Especialista Meteorológico Certificado', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-300' }
      : overallProgressPct >= 65
      ? { title: 'Analista Climático del Valle de Siancas', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' }
      : overallProgressPct >= 30
      ? { title: 'Explorador Atmosférico Escolar', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-300' }
      : { title: 'Iniciando Trayecto Meteorológico', color: 'text-slate-600 bg-slate-100 dark:bg-slate-800 border-slate-300' };

  // Marcar módulo actual como leído/completado
  const markCurrentAsCompleted = () => {
    if (!completedTopicIds.includes(activeModule.id)) {
      setCompletedTopicIds((prev) => [...prev, activeModule.id]);
    }
  };

  // Enviar evaluación parcial
  const handleSubmitQuiz = () => {
    const questions = activeModule.quiz;
    let correctCount = 0;
    questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount++;
      }
    });

    const passed = correctCount >= Math.ceil(questions.length * 0.65); // 65% para aprobar
    setQuizScores((prev) => ({
      ...prev,
      [activeModule.id]: {
        score: correctCount,
        total: questions.length,
        passed,
      },
    }));

    // Si aprueba, también marcamos el módulo como completado
    if (!completedTopicIds.includes(activeModule.id)) {
      setCompletedTopicIds((prev) => [...prev, activeModule.id]);
    }

    setQuizSubmitted(true);
  };

  const handleResetProgress = () => {
    if (confirm('¿Deseas reiniciar tu progreso de aprendizaje y evaluaciones?')) {
      setCompletedTopicIds([]);
      setQuizScores({});
      setUserAnswers({});
      setQuizSubmitted(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PANEL SUPERIOR: Encabezado del Trayecto y Marcador de Progreso General */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Formación Científica Escolar · Colegio 5085
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${studentBadge.color}`}>
                  {studentBadge.title}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Trayecto de Aprendizaje: Variables y Fenómenos Climatológicos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Domina los fundamentos de física, biología y geografía detrás de cada sensor de la estación en General Güemes
              </p>
            </div>
          </div>

          <button
            onClick={handleResetProgress}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 self-start lg:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reiniciar Avance</span>
          </button>
        </div>

        {/* BARRA Y MÉTRICAS DEL MARCADOR DE PROGRESO */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>Progreso Formativo Acumulado:</span>
              </span>
              <span className="font-mono font-bold text-sky-600 dark:text-sky-400 text-sm">
                {overallProgressPct}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className="bg-linear-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${overallProgressPct}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Módulos Estudiados</span>
              <strong className="text-slate-900 dark:text-white font-mono text-sm">
                {completedTopicsCount} de {totalTopics}
              </strong>
            </div>
            <BookOpen className="w-4 h-4 text-sky-500" />
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 text-[11px] block">Evaluaciones Aprobadas</span>
              <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                {passedQuizzesCount} de {totalQuizzes}
              </strong>
            </div>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* SELECTOR DE MÓDULOS DE APRENDIZAJE */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {modules.map((m) => {
          const Icon = m.icon;
          const isSelected = selectedModId === m.id;
          const isCompleted = completedTopicIds.includes(m.id);
          const quizResult = quizScores[m.id];

          return (
            <button
              key={m.id}
              onClick={() => setSelectedModId(m.id)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'border-sky-600 bg-sky-50/60 dark:bg-sky-950/40 shadow-xs ring-1 ring-sky-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                  Módulo {m.number}
                </span>

                <div className="flex items-center gap-1">
                  {isCompleted && (
                    <span title="Módulo completado">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    </span>
                  )}
                  {quizResult?.passed && (
                    <span title={`Evaluación aprobada (${quizResult.score}/${quizResult.total})`}>
                      <Award className="w-4 h-4 text-amber-500 shrink-0" />
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-sky-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                  {m.title}
                </h3>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                {m.subtitle}
              </p>
            </button>
          );
        })}
      </div>

      {/* CONTENIDO DEL MÓDULO ACTIVO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda (2/3): Explicaciones Teóricas e Infografía Animada */}
        <div className="lg:col-span-2 space-y-6">
          {/* Encabezado del Módulo */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
                Módulo {activeModule.number} · {activeModule.tag}
              </span>

              {completedTopicIds.includes(activeModule.id) ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Completado</span>
                </span>
              ) : (
                <button
                  onClick={markCurrentAsCompleted}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-sky-600 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Marcar como Leído</span>
                </button>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeModule.title}
            </h2>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-800">
              {activeModule.summary}
            </p>

            {/* Badges de variables cubiertas en la estación */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Variables de la Estación en este Módulo:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {activeModule.variablesCovered.map((v) => (
                  <span
                    key={v}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200 text-xs font-semibold"
                  >
                    {v}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* INFOGRAFÍA ANIMADA E INTERACTIVA DEL FENÓMENO */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 text-white">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Infografía Científica Animada: Mecanismo Físico</span>
              </span>
              <span className="text-slate-400 text-[11px] font-mono">
                Modelado Pedagógico Colegio 5085
              </span>
            </div>

            {/* INFOGRAFÍA 1: Desfase Térmico y Balance Radiativo */}
            {activeModule.infographicType === 'thermal_cycle' && (
              <div className="w-full h-64 bg-linear-to-b from-sky-950/80 via-slate-900 to-slate-950 rounded-lg p-2 border border-slate-800 relative overflow-hidden">
                <svg viewBox="0 0 520 220" className="w-full h-full">
                  {/* Suelo */}
                  <rect x="0" y="195" width="520" height="25" fill="#1e293b" />
                  <text x="15" y="210" fill="#94a3b8" fontSize="10">
                    Suelo de General Güemes (Calentamiento por conducción y radiación infrarroja)
                  </text>

                  {/* Sol a las 13:30 hs (Cénit) */}
                  <circle cx="160" cy="50" r="18" fill="#f59e0b" className="animate-pulse" />
                  <text x="140" y="85" fill="#fbbf24" fontSize="10" fontWeight="bold">
                    Pico Solar (13:30 hs)
                  </text>
                  <text x="140" y="98" fill="#cbd5e1" fontSize="9">
                    1050 W/m² (UV Máx)
                  </text>
                  <line x1="160" y1="70" x2="160" y2="185" stroke="#fbbf24" strokeWidth="3" strokeDasharray="4 2" />

                  {/* Termómetro con Pico a las 16:00 hs */}
                  <rect x="360" y="45" width="24" height="140" rx="12" fill="#334155" stroke="#f43f5e" strokeWidth="2" />
                  <rect x="366" y="70" width="12" height="110" rx="6" fill="#f43f5e" />
                  <circle cx="372" cy="175" r="14" fill="#f43f5e" />
                  <text x="320" y="35" fill="#f87171" fontSize="11" fontWeight="bold">
                    Pico de Calor (16:00 hs)
                  </text>
                  <text x="320" y="48" fill="#fca5a5" fontSize="9">
                    T. Máx: ~35°C (Desfase de 2.5 hs)
                  </text>

                  {/* Flecha de Calor Acumulado */}
                  <path d="M 180 160 Q 260 120 340 140" fill="none" stroke="#f43f5e" strokeWidth="3" strokeDasharray="5 3" />
                  <polygon points="345,142 332,135 336,148" fill="#f43f5e" />
                  <text x="210" y="115" fill="#fbcfe8" fontSize="9" fontWeight="bold">
                    Acumulación Neta de Energía
                  </text>
                  <text x="210" y="128" fill="#cbd5e1" fontSize="8">
                    Inercia Térmica del Suelo
                  </text>
                </svg>
              </div>
            )}

            {/* INFOGRAFÍA 2: VPD y Apertura Estomática */}
            {activeModule.infographicType === 'vpd_stomata' && (
              <div className="w-full h-64 bg-linear-to-b from-emerald-950/70 via-slate-900 to-slate-950 rounded-lg p-2 border border-slate-800 relative">
                <svg viewBox="0 0 520 220" className="w-full h-full">
                  {/* Estoma Óptimo (Izquierda) */}
                  <rect x="30" y="20" width="210" height="180" rx="8" fill="#064e3b" fillOpacity="0.4" stroke="#10b981" strokeWidth="1.5" />
                  <text x="45" y="40" fill="#34d399" fontSize="11" fontWeight="bold">
                    VPD Óptimo (0.8 - 1.2 kPa)
                  </text>
                  <text x="45" y="55" fill="#a7f3d0" fontSize="9">
                    Estoma Abierto · Fotosíntesis Activa
                  </text>

                  {/* Células oclusivas abiertas */}
                  <ellipse cx="110" cy="120" rx="20" ry="40" fill="#059669" stroke="#34d399" strokeWidth="2" />
                  <ellipse cx="150" cy="120" rx="20" ry="40" fill="#059669" stroke="#34d399" strokeWidth="2" />
                  <ellipse cx="130" cy="120" rx="10" ry="25" fill="#022c22" />
                  <text x="75" y="175" fill="#6ee7b7" fontSize="9">
                    Ingreso fluido de CO₂ y transpiración
                  </text>

                  {/* Estoma Estresado (Derecha) */}
                  <rect x="280" y="20" width="210" height="180" rx="8" fill="#7f1d1d" fillOpacity="0.3" stroke="#f43f5e" strokeWidth="1.5" />
                  <text x="295" y="40" fill="#f87171" fontSize="11" fontWeight="bold">
                    VPD Excesivo (&gt; 1.8 kPa)
                  </text>
                  <text x="295" y="55" fill="#fca5a5" fontSize="9">
                    Aire Secante · Estoma Cerrado
                  </text>

                  {/* Células oclusivas cerradas */}
                  <ellipse cx="370" cy="120" rx="25" ry="40" fill="#991b1b" stroke="#f87171" strokeWidth="2" />
                  <ellipse cx="400" cy="120" rx="25" ry="40" fill="#991b1b" stroke="#f87171" strokeWidth="2" />
                  <line x1="385" y1="85" x2="385" y2="155" stroke="#fca5a5" strokeWidth="2" />
                  <text x="310" y="175" fill="#fca5a5" fontSize="9">
                    Bloqueo de pérdida de agua y de fotosíntesis
                  </text>
                </svg>
              </div>
            )}

            {/* INFOGRAFÍA 3: Viento Zonda y Föhn */}
            {activeModule.infographicType === 'pressure_wind' && (
              <div className="w-full h-64 bg-linear-to-b from-sky-950/70 via-slate-900 to-slate-950 rounded-lg p-2 border border-slate-800 relative">
                <svg viewBox="0 0 520 220" className="w-full h-full">
                  <polygon points="0,210 200,60 520,210" fill="#1e293b" stroke="#475569" strokeWidth="2" />

                  {/* Barlovento */}
                  <text x="20" y="195" fill="#93c5fd" fontSize="10" fontWeight="bold">
                    Barlovento (Océano)
                  </text>
                  <text x="20" y="208" fill="#cbd5e1" fontSize="8">
                    Aire húmedo: -5.5°C/km (Lluvia)
                  </text>
                  <path d="M 30 180 Q 110 130 160 90" fill="none" stroke="#38bdf8" strokeWidth="3" strokeDasharray="4 2" />

                  {/* Cumbre Andes */}
                  <circle cx="200" cy="60" r="4" fill="#ef4444" />
                  <text x="170" y="45" fill="#fca5a5" fontSize="10" fontWeight="bold">
                    Cumbre (4000m)
                  </text>

                  {/* Sotavento Zonda */}
                  <path d="M 220 75 Q 340 140 430 190" fill="none" stroke="#f43f5e" strokeWidth="4" />
                  <polygon points="435,193 420,185 428,180" fill="#f43f5e" />
                  <text x="310" y="125" fill="#fb7185" fontSize="10" fontWeight="bold">
                    Descenso Zonda (+9.8°C/km)
                  </text>
                  <text x="310" y="140" fill="#fda4af" fontSize="9">
                    Compresión adiabática sin humedad
                  </text>

                  {/* Llegada a Güemes */}
                  <rect x="400" y="185" width="110" height="25" rx="4" fill="#0f172a" stroke="#e11d48" />
                  <text x="410" y="202" fill="#f87171" fontSize="10" fontWeight="bold">
                    Güemes: T ≥ 38°C · HR ≤ 12%
                  </text>
                </svg>
              </div>
            )}

            {/* INFOGRAFÍA 4: Convección y Granizo */}
            {activeModule.infographicType === 'convection_hail' && (
              <div className="w-full h-64 bg-linear-to-b from-indigo-950 via-slate-900 to-slate-950 rounded-lg p-2 border border-slate-800 relative">
                <svg viewBox="0 0 520 220" className="w-full h-full">
                  <rect x="0" y="200" width="520" height="20" fill="#1e293b" />
                  <text x="15" y="214" fill="#94a3b8" fontSize="9">
                    Suelo Calentado en Güemes (T: 32°C · HR: 75% · CAPE: 2800 J/kg)
                  </text>

                  {/* Cumulonimbus */}
                  <path
                    d="M 120 200 Q 100 140 130 110 Q 110 60 180 30 Q 300 20 400 35 Q 430 80 390 140 Q 410 180 370 200 Z"
                    fill="#334155"
                    fillOpacity="0.4"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />

                  {/* Línea de 0°C */}
                  <line x1="80" y1="120" x2="450" y2="120" stroke="#06b6d4" strokeDasharray="4 4" strokeWidth="1.2" />
                  <text x="90" y="115" fill="#06b6d4" fontSize="9" fontWeight="bold">
                    Isoterma 0°C (~3500m)
                  </text>

                  {/* Zona de congelamiento de granizo */}
                  <text x="210" y="55" fill="#d8b4fe" fontSize="10" fontWeight="bold">
                    Zona de Acreción (-10°C a -30°C)
                  </text>

                  {/* Updraft ascendente */}
                  <path d="M 220 190 Q 230 130 260 70" fill="none" stroke="#f43f5e" strokeWidth="6" strokeDasharray="6 3" />
                  <polygon points="260,65 253,78 267,76" fill="#f43f5e" />
                  <text x="275" y="90" fill="#f43f5e" fontSize="10" fontWeight="bold">
                    Updraft: 75 m/s (270 km/h)
                  </text>

                  {/* Piedra de granizo */}
                  <circle cx="330" cy="160" r="10" fill="#ffffff" stroke="#38bdf8" strokeWidth="2" />
                  <text x="348" y="165" fill="#e0f2fe" fontSize="9" fontWeight="bold">
                    Granizo Ø 30mm
                  </text>
                </svg>
              </div>
            )}
          </div>

          {/* Secciones de Contenido Detallado con Casos Prácticos de Güemes */}
          <div className="space-y-4">
            {activeModule.detailedContent.map((sec, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs"
              >
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                  {sec.sectionTitle}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {sec.text}
                </p>

                {sec.formula && (
                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-sky-700 dark:text-sky-300">
                    <strong className="text-slate-700 dark:text-slate-300 font-sans">Fórmula o Principio: </strong>
                    {sec.formula}
                  </div>
                )}

                <div className="mt-3 p-3 rounded-lg bg-sky-50/60 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-[11px] uppercase tracking-wide text-sky-700 dark:text-sky-300">
                      Caso Real en General Güemes:
                    </strong>
                    <span className="text-[11px] text-sky-800 dark:text-sky-200">{sec.localExample}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Columna Derecha (1/3): Evaluación Parcial con Devolución Inmediata */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Evaluación Parcial: Módulo {activeModule.number}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
              Responde las siguientes consignas basadas en los datos de la estación y recibe la devolución científica explicativa inmediata:
            </p>

            {/* Resultado previo si ya rindió */}
            {quizScores[activeModule.id] && (
              <div
                className={`p-3.5 rounded-xl border mb-5 text-xs ${
                  quizScores[activeModule.id].passed
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>
                    {quizScores[activeModule.id].passed ? '¡Evaluación Aprobada!' : 'Evaluación a Reforzar'}
                  </span>
                  <span className="font-mono text-sm">
                    {quizScores[activeModule.id].score} / {quizScores[activeModule.id].total} aciertos
                  </span>
                </div>
                <p className="text-[11px] opacity-90">
                  {quizScores[activeModule.id].passed
                    ? 'Has demostrado dominio conceptual de las variables y fenómenos de este módulo.'
                    : 'Revisa las justificaciones teóricas abajo y reintenta el cuestionario para afianzar tus conocimientos.'}
                </p>
              </div>
            )}

            {/* Preguntas de la evaluación */}
            <div className="space-y-5">
              {activeModule.quiz.map((q, qIndex) => {
                const selectedOption = userAnswers[q.id];
                const isAnswered = selectedOption !== undefined;
                const isCorrect = selectedOption === q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-white mb-2 leading-relaxed">
                      {qIndex + 1}. {q.question}
                    </div>

                    <div className="space-y-1.5 mb-3">
                      {q.options.map((opt, optIndex) => {
                        const isChosen = selectedOption === optIndex;
                        let optStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300';

                        if (quizSubmitted) {
                          if (optIndex === q.correctIndex) {
                            optStyle = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 font-bold';
                          } else if (isChosen && !isCorrect) {
                            optStyle = 'border-rose-400 bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200';
                          }
                        } else if (isChosen) {
                          optStyle = 'border-sky-600 bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-200 font-semibold ring-1 ring-sky-500/30';
                        }

                        return (
                          <button
                            key={optIndex}
                            disabled={quizSubmitted}
                            onClick={() => setUserAnswers((prev) => ({ ...prev, [q.id]: optIndex }))}
                            className={`w-full p-2.5 rounded-lg border text-left text-[11px] transition-all cursor-pointer disabled:cursor-default flex items-start gap-2 ${optStyle}`}
                          >
                            <span className="font-bold font-mono shrink-0">
                              {String.fromCharCode(65 + optIndex)}.
                            </span>
                            <span className="leading-relaxed">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* DEVOLUCIÓN DE RESULTADOS CIENTÍFICA INMEDIATA */}
                    {quizSubmitted && (
                      <div
                        className={`mt-2.5 p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-200'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 text-amber-800 dark:text-amber-200'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="block mb-0.5">
                            {isCorrect ? '¡Respuesta Correcta!' : 'Devolución Pedagógica:'}
                          </strong>
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Botones de Envío / Reintento */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {!quizSubmitted ? (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={Object.keys(userAnswers).length < activeModule.quiz.length}
                  className="w-full py-2.5 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Enviar Respuestas y Ver Devolución ({Object.keys(userAnswers).length}/{activeModule.quiz.length})
                </button>
              ) : (
                <button
                  onClick={() => {
                    setUserAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="w-full py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reintentar Evaluación del Módulo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
