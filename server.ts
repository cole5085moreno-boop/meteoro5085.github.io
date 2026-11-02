/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Servidor Principal Full-Stack Express con Vite Middleware
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as XLSX from 'xlsx';
import { db } from './server/db.ts';
import {
  fetchLiveStationData,
  fetchHistoricalCommitsData,
} from './server/weather-source.ts';
import {
  computePeriodStatsBundle,
  computePearsonCorrelation,
} from './server/statistics.ts';
import { runAutomatedTests } from './server/test-runner.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const SYNC_SECRET = process.env.WEATHER_SYNC_SECRET || 'secret5085';

app.use(express.json({ limit: '10mb' }));

// Middleware simple de autenticación por cabecera de autorización o sesión
function authenticateRequest(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
      (req as any).user = decoded;
    } catch (e) {
      // Token inválido, continuar como anónimo
    }
  }
  next();
}

app.use(authenticateRequest);

// =========================================================================
// RUTAS API
// =========================================================================

// 1. Estado y configuración de la estación
app.get('/api/station', (req, res) => {
  const station = db.getStation();
  const latestObs = db.getLatestObservation();
  const lastSync = db.getLastSuccessfulSync();
  const allObs = db.getObservations();

  let connectionStatus: 'Actualizado' | 'Actualización pendiente' | 'Datos desactualizados' | 'Fuente no disponible' =
    'Actualizado';

  let ageMinutes = 0;
  if (latestObs) {
    const obsTime = new Date(latestObs.observed_at).getTime();
    const now = Date.now();
    ageMinutes = Math.max(0, Math.round((now - obsTime) / (1000 * 60)));

    if (ageMinutes > 180) {
      connectionStatus = 'Datos desactualizados';
    } else if (ageMinutes > 45) {
      connectionStatus = 'Actualización pendiente';
    }
  } else {
    connectionStatus = 'Fuente no disponible';
  }

  res.json({
    station,
    latest_observation: latestObs,
    last_sync: lastSync,
    connection_status: connectionStatus,
    data_age_minutes: ageMinutes,
    total_records: allObs.length,
    first_record_date: allObs[0]?.observed_at || null,
    last_record_date: allObs[allObs.length - 1]?.observed_at || null,
  });
});

app.put('/api/station', (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: se requieren privilegios de Administrador' });
    return;
  }
  const updated = db.updateStation(req.body, user.email || user.username);
  res.json({ success: true, station: updated });
});

// 2. Consulta de observaciones con filtrado por rango
app.get('/api/observations', (req, res) => {
  const { range, start, end, limit } = req.query;

  let startDate: string | undefined = typeof start === 'string' ? start : undefined;
  let endDate: string | undefined = typeof end === 'string' ? end : undefined;

  const now = new Date();

  if (range && typeof range === 'string') {
    if (range === '24h') {
      startDate = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
    } else if (range === '48h') {
      startDate = new Date(now.getTime() - 48 * 3600 * 1000).toISOString();
    } else if (range === '7d') {
      startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
    } else if (range === '30d') {
      startDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000).toISOString();
    } else if (range === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    } else if (range === 'prev_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();
    } else if (range === 'current_year') {
      startDate = new Date(now.getFullYear(), 0, 1).toISOString();
    }
  }

  const parsedLimit = limit ? parseInt(limit as string, 10) : undefined;

  const observations = db.getObservations({
    startDate,
    endDate,
    limit: parsedLimit,
  });

  res.json({
    count: observations.length,
    observations,
  });
});

// 3. Paquete estadístico precalculado
app.get('/api/stats', (req, res) => {
  const { range, start, end } = req.query;
  const observations = db.getObservations({
    startDate: typeof start === 'string' ? start : undefined,
    endDate: typeof end === 'string' ? end : undefined,
  });

  const periodLabel = typeof range === 'string' ? `Rango: ${range}` : 'Período seleccionado';
  const stats = computePeriodStatsBundle(observations, periodLabel);

  // Correlaciones clave para el laboratorio
  const corrTempHumidity = computePearsonCorrelation(
    observations,
    (o) => o.temperature_c,
    (o) => o.relative_humidity_pct
  );

  const corrTempVpd = computePearsonCorrelation(
    observations,
    (o) => o.temperature_c,
    (o) => o.vapor_pressure_deficit_kpa
  );

  const corrSolarTemp = computePearsonCorrelation(
    observations,
    (o) => o.solar_radiation_wm2,
    (o) => o.temperature_c
  );

  res.json({
    stats,
    correlations: {
      temp_humidity: corrTempHumidity,
      temp_vpd: corrTempVpd,
      solar_temp: corrSolarTemp,
    },
  });
});

// 4. Sincronización manual o por Cron Job
app.post('/api/sync', async (req, res) => {
  const secretHeader = req.headers['x-sync-secret'];
  const user = (req as any).user;

  const isAuthorized =
    (user && (user.role === 'admin' || user.role === 'operator')) ||
    secretHeader === SYNC_SECRET ||
    req.body.secret === SYNC_SECRET;

  if (!isAuthorized) {
    res.status(403).json({ error: 'No autorizado para sincronizar datos' });
    return;
  }

  const station = db.getStation();
  const lastSync = db.getLastSuccessfulSync();

  const syncResult = await fetchLiveStationData(
    station.ecowitt_station_id,
    station.primary_source_url,
    lastSync?.content_hash
  );

  if (syncResult.run.status === 'success' && syncResult.observations.length > 0) {
    const upsertRes = db.upsertObservations(syncResult.observations);
    syncResult.run.records_inserted = upsertRes.inserted;
    syncResult.run.records_updated = upsertRes.updated;
    syncResult.run.records_skipped = upsertRes.skipped;
  }

  db.addSyncRun(syncResult.run);
  db.addAuditLog(
    'SYNC_STATION_DATA',
    user?.username || 'cron_service',
    `Sincronización ${syncResult.run.status}: ${syncResult.run.records_inserted} insertados, ${syncResult.run.records_updated} actualizados`
  );

  res.json({
    success: syncResult.run.status === 'success',
    run: syncResult.run,
    total_records: db.getObservations().length,
  });
});

// 5. Sincronización de commits históricos de GitHub (ampliación de historial real)
app.post('/api/sync/historical', async (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso denegado: se requieren privilegios de Administrador' });
    return;
  }

  const station = db.getStation();
  const historicalObs = await fetchHistoricalCommitsData(10, station.ecowitt_station_id);

  if (historicalObs.length > 0) {
    const upsertRes = db.upsertObservations(historicalObs);
    db.addAuditLog(
      'IMPORT_HISTORICAL_DATA',
      user.username,
      `Importación histórica de commits: ${upsertRes.inserted} nuevos registros agregados`
    );
    res.json({
      success: true,
      found: historicalObs.length,
      inserted: upsertRes.inserted,
      skipped: upsertRes.skipped,
      total_now: db.getObservations().length,
    });
  } else {
    res.json({ success: false, message: 'No se encontraron commits históricos adicionales' });
  }
});

// 6. Historial de sincronizaciones
app.get('/api/sync/history', (req, res) => {
  res.json({ runs: db.getSyncRuns(30) });
});

// 7. Autenticación
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Contraseña requerida' });
    return;
  }

  const result = db.authenticate(password);
  if (!result.success || !result.user) {
    db.addAuditLog('LOGIN_FAILED', 'anonymous', 'Intento de acceso fallido');
    res.status(401).json({ error: 'Credenciales inválidas' });
    return;
  }

  const token = Buffer.from(JSON.stringify(result.user)).toString('base64');
  db.addAuditLog('LOGIN_SUCCESS', result.user.username, `Acceso exitoso como ${result.user.role}`);

  res.json({
    success: true,
    user: result.user,
    token,
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = (req as any).user;
  res.json({ user: user || null });
});

// 8. Observaciones manuales complementarias
app.post('/api/manual-observations', (req, res) => {
  const user = (req as any).user;
  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    res.status(403).json({ error: 'Se requiere rol de Operador o Administrador' });
    return;
  }

  const {
    observed_at,
    temperature_c,
    relative_humidity_pct,
    pressure_hpa,
    wind_speed_kmh,
    wind_direction_deg,
    sky_condition,
    notes,
  } = req.body;

  if (!observed_at) {
    res.status(400).json({ error: 'Fecha y hora de observación requeridas' });
    return;
  }

  const created = db.addManualObservation(
    {
      station_id: db.getStation().ecowitt_station_id,
      observed_at,
      operator_user: user.name || user.username,
      temperature_c: temperature_c ? Number(temperature_c) : null,
      relative_humidity_pct: relative_humidity_pct ? Number(relative_humidity_pct) : null,
      pressure_hpa: pressure_hpa ? Number(pressure_hpa) : null,
      wind_speed_kmh: wind_speed_kmh ? Number(wind_speed_kmh) : null,
      wind_direction_deg: wind_direction_deg ? Number(wind_direction_deg) : null,
      sky_condition,
      notes: notes || '',
    },
    user.username
  );

  res.json({ success: true, observation: created });
});

app.get('/api/manual-observations', (req, res) => {
  res.json({ manual_observations: db.getManualObservations() });
});

// 9. Corrección auditada de datos
app.post('/api/corrections', (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Solo administradores pueden realizar correcciones de datos' });
    return;
  }

  const { observation_id, field_name, corrected_value, reason } = req.body;
  if (!observation_id || !field_name || reason === undefined) {
    res.status(400).json({ error: 'Faltan parámetros de corrección requeridos' });
    return;
  }

  const correction = db.addDataCorrection(
    observation_id,
    field_name,
    corrected_value,
    reason,
    user.email || user.username
  );

  if (!correction) {
    res.status(404).json({ error: 'Observación no encontrada' });
    return;
  }

  res.json({ success: true, correction });
});

app.get('/api/corrections', (req, res) => {
  res.json({ corrections: db.getDataCorrections() });
});

// 10. Registros de auditoría
app.get('/api/audit-logs', (req, res) => {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Acceso restringido a Administradores' });
    return;
  }
  res.json({ logs: db.getAuditLogs(100) });
});

// 11. Ejecución de suite de pruebas automatizadas
app.get('/api/tests/run', (req, res) => {
  const testSuite = runAutomatedTests();
  res.json(testSuite);
});

// 12. Exportación de datos en XLSX, CSV y JSON
app.get('/api/export', (req, res) => {
  const format = (req.query.format as string) || 'csv';
  const observations = db.getObservations();
  const station = db.getStation();

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=estacion_5085_datos.json`);
    res.send(JSON.stringify({ station, observations }, null, 2));
    return;
  }

  // Aplanar datos para hojas de cálculo
  const exportRows = observations.map((o) => ({
    'Fecha y Hora': o.observed_at,
    'Temperatura (°C)': o.temperature_c ?? '',
    'Sensación Térmica (°C)': o.feels_like_c ?? '',
    'Punto de Rocío (°C)': o.dew_point_c ?? '',
    'Humedad Relativa (%)': o.relative_humidity_pct ?? '',
    'VPD (kPa)': o.vapor_pressure_deficit_kpa ?? '',
    'Radiación Solar (W/m²)': o.solar_radiation_wm2 ?? '',
    'Índice UV': o.uv_index ?? '',
    'Precipitación Int. (mm/h)': o.precipitation_rate_mmh ?? '',
    'Lluvia Diaria (mm)': o.precipitation_daily_mm ?? '',
    'Velocidad Viento (km/h)': o.wind_speed_kmh ?? '',
    'Ráfaga Viento (km/h)': o.wind_gust_kmh ?? '',
    'Dirección Viento (°)': o.wind_direction_deg ?? '',
    'Presión Relativa (hPa)': o.pressure_relative_hpa ?? '',
    'Presión Absoluta (hPa)': o.pressure_absolute_hpa ?? '',
    'Estado del Cielo': o.sky_condition,
    'Origen del Dato': o.source,
    'Estado Validación': o.validation_status,
  }));

  if (format === 'xlsx') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Observaciones');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=estacion_5085_export.xlsx`);
    res.send(buf);
    return;
  }

  // Formato CSV predeterminado
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportRows);
  const csvData = XLSX.utils.sheet_to_csv(ws);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=estacion_5085_export.csv`);
  res.send('\uFEFF' + csvData); // BOM para compatibilidad con Excel
});

// =========================================================================
// INTEGRACIÓN VITE (Dev vs Prod)
// =========================================================================

async function startServer() {
  // Sincronización inicial automática de la estación Colegio 5085
  const currentObs = db.getObservations();
  if (currentObs.length < 50) {
    console.log('[Estación 5085] Inicializando datos desde la fuente de INTA Salta...');
    try {
      const station = db.getStation();
      const liveRes = await fetchLiveStationData(station.ecowitt_station_id);
      if (liveRes.observations.length > 0) {
        db.upsertObservations(liveRes.observations);
        db.addSyncRun(liveRes.run);
        console.log(`[Estación 5085] ${liveRes.observations.length} registros en vivo sincronizados.`);
      }

      // Traer commits históricos de GitHub para enriquecer serie temporal
      const historical = await fetchHistoricalCommitsData(10, station.ecowitt_station_id);
      if (historical.length > 0) {
        const histUpsert = db.upsertObservations(historical);
        console.log(`[Estación 5085] ${histUpsert.inserted} registros históricos de commits agregados.`);
      }
    } catch (e) {
      console.error('[Estación 5085] Error en sincronización inicial:', e);
    }
  }

  // Tarea de sincronización periódica cada 15 minutos (cadencia de Ecowitt en GitHub)
  setInterval(async () => {
    try {
      const station = db.getStation();
      if (!station.auto_sync_enabled) return;
      const lastSync = db.getLastSuccessfulSync();
      const res = await fetchLiveStationData(
        station.ecowitt_station_id,
        station.primary_source_url,
        lastSync?.content_hash
      );
      if (res.observations.length > 0) {
        db.upsertObservations(res.observations);
      }
      db.addSyncRun(res.run);
    } catch (err) {
      console.warn('[Estación 5085] Error en sincronización periódica:', err);
    }
  }, 15 * 60 * 1000);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Estación 5085] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
