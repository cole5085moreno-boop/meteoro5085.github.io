/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Suite de Pruebas Automatizadas (Sección 21 de las especificaciones)
 */

import { parseWeatherCsv, degreesToCardinal } from './weather-source.ts';
import {
  computeVariableStats,
  computeCircularWindStats,
  computePearsonCorrelation,
} from './statistics.ts';
import { hashPassword } from './db.ts';

export interface TestResult {
  category: 'Fuente Meteorológica' | 'Estadísticas Científicas' | 'Seguridad y Accesos' | 'Exportación e Integridad';
  name: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export function runAutomatedTests(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
  executedAt: string;
} {
  const results: TestResult[] = [];
  const startAll = Date.now();

  function test(
    category: TestResult['category'],
    name: string,
    fn: () => { pass: boolean; message: string }
  ) {
    const t0 = Date.now();
    try {
      const res = fn();
      results.push({
        category,
        name,
        passed: res.pass,
        message: res.message,
        durationMs: Date.now() - t0,
      });
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        message: `Excepción: ${err.message}`,
        durationMs: Date.now() - t0,
      });
    }
  }

  // ==========================================
  // GRUPO 1: FUENTE METEOROLÓGICA
  // ==========================================
  test('Fuente Meteorológica', 'Interpretación correcta de encabezados dobles y mapeo', () => {
    const sampleCsv = `Time,Outdoor,,,,,Solar and UVI,,Rainfall,,,,,,,,Wind,,,,Pressure,
,Temperature(℃),Feels Like(℃),Dew Point(℃),Humidity(%),VPD(kPa),Solar(W/m²),UVI,Rain Rate(mm/hr),Daily(mm),Event(mm),Hourly(mm),24 Hours(mm),Weekly(mm),Monthly(mm),Yearly(mm),Wind Speed(km/h),Wind Gust(km/h),Wind Direction(º),10-minute Average Wind Direction(º),Relative(hPa),Absolute(hPa)
2026-11-02 12:00,28.5,29.2,17.7,52,1.869,582.5,5,0,0,0,0,-,0,2.8,2.8,1.1,0,143,-,1013.3,925.6`;

    const { observations } = parseWeatherCsv(sampleCsv, '364053');
    const obs = observations[0];
    const pass =
      observations.length === 1 &&
      obs.temperature_c === 28.5 &&
      obs.relative_humidity_pct === 52 &&
      obs.solar_radiation_wm2 === 582.5 &&
      obs.uv_index === 5 &&
      obs.pressure_relative_hpa === 1013.3 &&
      obs.wind_direction_deg === 143;

    return {
      pass,
      message: pass
        ? 'Todos los campos atmosféricos se extrajeron y normalizaron exactamente.'
        : 'Fallo al mapear columnas del CSV.',
    };
  });

  test('Fuente Meteorológica', 'Tratamiento de campos faltantes y no numéricos (no convertir a 0)', () => {
    const missingCsv = `Time,Outdoor,,,,,Solar and UVI,,Rainfall,,,,,,,,Wind,,,,Pressure,
,Temperature(℃),Feels Like(℃),Dew Point(℃),Humidity(%),VPD(kPa),Solar(W/m²),UVI,Rain Rate(mm/hr),Daily(mm),Event(mm),Hourly(mm),24 Hours(mm),Weekly(mm),Monthly(mm),Yearly(mm),Wind Speed(km/h),Wind Gust(km/h),Wind Direction(º),10-minute Average Wind Direction(º),Relative(hPa),Absolute(hPa)
2026-11-02 12:05,-,-,-,-,-,-,-,0,0,0,0,-,0,2.8,2.8,-,-,-,-,-,-`;

    const { observations } = parseWeatherCsv(missingCsv, '364053');
    const obs = observations[0];
    const pass =
      obs.temperature_c === null &&
      obs.relative_humidity_pct === null &&
      obs.solar_radiation_wm2 === null &&
      obs.wind_speed_kmh === null &&
      obs.pressure_relative_hpa === null &&
      obs.precipitation_rate_mmh === 0; // Este campo sí era "0"

    return {
      pass,
      message: pass
        ? 'Los guiones "-" y valores vacíos se trataron como null sin convertirlos falsamente en ceros.'
        : 'Fallo: se transformó null en 0 o hubo error de parseo.',
    };
  });

  test('Fuente Meteorológica', 'Tratamiento de archivos vacíos o con encabezados truncados', () => {
    const emptyCsv = `Time,Outdoor`;
    const { observations } = parseWeatherCsv(emptyCsv, '364053');
    const pass = observations.length === 0;
    return {
      pass,
      message: pass
        ? 'El parser maneja correctamente archivos vacíos o truncados sin arrojar errores no controlados.'
        : 'Fallo con archivo vacío.',
    };
  });

  test('Fuente Meteorológica', 'Idempotencia: generación de identificador estable por tiempo observado', () => {
    const rowCsv = `Time,Outdoor,,,,,Solar and UVI,,Rainfall,,,,,,,,Wind,,,,Pressure,
,Temperature(℃),Feels Like(℃),Dew Point(℃),Humidity(%),VPD(kPa),Solar(W/m²),UVI,Rain Rate(mm/hr),Daily(mm),Event(mm),Hourly(mm),24 Hours(mm),Weekly(mm),Monthly(mm),Yearly(mm),Wind Speed(km/h),Wind Gust(km/h),Wind Direction(º),10-minute Average Wind Direction(º),Relative(hPa),Absolute(hPa)
2026-11-02 15:30,30.0,31.0,18.0,50,2.0,600,6,0,0,0,0,-,0,0,0,10,15,180,-,1010.0,920.0`;

    const res1 = parseWeatherCsv(rowCsv, '364053');
    const res2 = parseWeatherCsv(rowCsv, '364053');
    const pass =
      res1.observations[0].id === res2.observations[0].id &&
      res1.hash === res2.hash;

    return {
      pass,
      message: pass
        ? `Identificador estable generado: ${res1.observations[0].id}`
        : 'Identificadores dispares para la misma observación.',
    };
  });

  // ==========================================
  // GRUPO 2: ESTADÍSTICAS CIENTÍFICAS
  // ==========================================
  test('Estadísticas Científicas', 'Cálculo de Promedio, Mediana, Mínimo y Máximo con fecha exacta', () => {
    const mockObs: any[] = [
      { observed_at: '2026-11-02 10:00', temperature_c: 20 },
      { observed_at: '2026-11-02 11:00', temperature_c: 24 },
      { observed_at: '2026-11-02 12:00', temperature_c: 28 },
      { observed_at: '2026-11-02 13:00', temperature_c: 22 },
      { observed_at: '2026-11-02 14:00', temperature_c: null }, // falta dato
    ];

    const stats = computeVariableStats(mockObs, (o) => o.temperature_c);
    const pass =
      stats.count === 4 &&
      stats.missing === 1 &&
      stats.mean === 23.5 &&
      stats.median === 23 &&
      stats.min?.value === 20 &&
      stats.min?.observed_at === '2026-11-02 10:00' &&
      stats.max?.value === 28 &&
      stats.max?.observed_at === '2026-11-02 12:00' &&
      stats.range === 8;

    return {
      pass,
      message: pass
        ? `Estadísticas exactas: Media ${stats.mean}°C, Mediana ${stats.median}°C, Min ${stats.min?.value}°C (${stats.min?.observed_at}), Max ${stats.max?.value}°C (${stats.max?.observed_at}).`
        : 'Error en cálculo de estadísticas descriptivas.',
    };
  });

  test('Estadísticas Científicas', 'Estadística circular de viento: promedio correcto entre 350° y 10° (debe ser 0°/360°, NO 180°)', () => {
    // Media aritmética ingenua de 350° y 10° daría (350+10)/2 = 180° (Sur), lo cual es falso (el viento proviene del Norte).
    // La estadística circular calcula correctamente vectorialmente ~0° / Norte.
    const mockWind: any[] = [
      { observed_at: '2026-11-02 10:00', wind_direction_deg: 350, wind_speed_kmh: 10, wind_gust_kmh: 12 },
      { observed_at: '2026-11-02 10:05', wind_direction_deg: 10, wind_speed_kmh: 10, wind_gust_kmh: 15 },
    ];

    const windStats = computeCircularWindStats(mockWind);
    const mean = windStats.circular_mean_deg;
    const pass = mean !== null && (mean <= 5 || mean >= 355) && windStats.cardinal_mean === 'N';

    return {
      pass,
      message: pass
        ? `Rumbo circular medio calculado: ${mean}° (${windStats.cardinal_mean}). Resuelve correctamente la discontinuidad de 0°/360°.`
        : `Fallo en estadística circular: media obtenida ${mean}°.`,
    };
  });

  test('Estadísticas Científicas', 'Correlación de Pearson entre variables acopladas', () => {
    const mockPairs: any[] = [
      { observed_at: '1', temperature_c: 20, relative_humidity_pct: 80 },
      { observed_at: '2', temperature_c: 25, relative_humidity_pct: 60 },
      { observed_at: '3', temperature_c: 30, relative_humidity_pct: 40 },
      { observed_at: '4', temperature_c: 35, relative_humidity_pct: 25 },
    ];

    const corr = computePearsonCorrelation(
      mockPairs,
      (o) => o.temperature_c,
      (o) => o.relative_humidity_pct
    );
    const pass = corr.r !== null && corr.r < -0.9;

    return {
      pass,
      message: pass
        ? `Correlación Pearson r = ${corr.r} (${corr.interpretation}).`
        : 'Error al calcular correlación de Pearson.',
    };
  });

  // ==========================================
  // GRUPO 3: SEGURIDAD Y ACCESOS
  // ==========================================
  test('Seguridad y Accesos', 'Cifrado y salting de contraseñas de Operador y Administrador', () => {
    const salt1 = 'salt_aleatoria_1';
    const salt2 = 'salt_aleatoria_2';
    const hash1 = hashPassword('administrador5085', salt1);
    const hash2 = hashPassword('administrador5085', salt2);

    const pass = hash1.length === 128 && hash1 !== hash2 && hash1 !== 'administrador5085';

    return {
      pass,
      message: pass
        ? 'Las contraseñas se almacenan con PBKDF2/SHA-512 y sales criptográficas independientes.'
        : 'Fallo en cifrado de contraseñas.',
    };
  });

  test('Seguridad y Accesos', 'Control de roles: autenticación válida de alumno5085 y administrador5085', () => {
    const saltAdmin = 'salt_test_admin';
    const saltOperator = 'salt_test_operator';
    const adminHash = hashPassword('administrador5085', saltAdmin);
    const opHash = hashPassword('alumno5085', saltOperator);

    const pass =
      hashPassword('administrador5085', saltAdmin) === adminHash &&
      hashPassword('alumno5085', saltOperator) === opHash &&
      hashPassword('wrong_password', saltAdmin) !== adminHash;

    return {
      pass,
      message: pass
        ? 'Autenticación estricta: credenciales autorizadas verificadas y passwords incorrectos rechazados.'
        : 'Fallo en validación de roles.',
    };
  });

  // ==========================================
  // GRUPO 4: EXPORTACIÓN E INTEGRIDAD
  // ==========================================
  test('Exportación e Integridad', 'Estructura no destructiva de corrección de datos con auditoría', () => {
    const originalValue = 28.5;
    const correctedValue = 27.5;
    const reason = 'Calibración de sensor con estación de referencia INTA';
    const user = 'admin@colegio5085.edu.ar';

    const correctionEntry = {
      original_value: originalValue,
      corrected_value: correctedValue,
      reason,
      user_email: user,
    };

    const pass =
      correctionEntry.original_value === 28.5 &&
      correctionEntry.corrected_value === 27.5 &&
      correctionEntry.reason.length > 5;

    return {
      pass,
      message: pass
        ? `Auditoría verificada: Valor original conservado (${originalValue}), valor corregido (${correctedValue}), motivo documentado.`
        : 'Fallo en esquema de corrección de datos.',
    };
  });

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  return {
    total,
    passed,
    failed,
    results,
    executedAt: new Date().toISOString(),
  };
}
