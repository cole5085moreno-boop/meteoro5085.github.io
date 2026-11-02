-- =========================================================================
-- Proyecto Estación Meteorológica Colegio 5085
-- Colegio Secundario N.º 5085 «Dr. Mariano Moreno» - General Güemes, Salta
-- Migración 001: Esquema Relacional de Base de Datos (PostgreSQL / Supabase)
-- =========================================================================

-- Extensión para generación de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: stations
CREATE TABLE IF NOT EXISTS stations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    institution VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address VARCHAR(255) NOT NULL,
    latitude DECIMAL(9, 6) NOT NULL,
    longitude DECIMAL(9, 6) NOT NULL,
    altitude_m INTEGER NOT NULL DEFAULT 695,
    ecowitt_station_id VARCHAR(50) NOT NULL UNIQUE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'America/Argentina/Salta',
    primary_source_url TEXT NOT NULL,
    github_repo_url TEXT NOT NULL,
    sync_interval_minutes INTEGER NOT NULL DEFAULT 15,
    auto_sync_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insertar estación oficial Colegio 5085
INSERT INTO stations (
    id, name, institution, location, address, latitude, longitude, altitude_m,
    ecowitt_station_id, timezone, primary_source_url, github_repo_url
) VALUES (
    'ema_5085',
    'Proyecto Estación Meteorológica Colegio 5085',
    'Colegio Secundario N.º 5085 «Dr. Mariano Moreno»',
    'General Güemes, provincia de Salta, Argentina',
    'Sarmiento 351, General Güemes, Salta',
    -24.670773,
    -65.049790,
    695,
    '364053',
    'America/Argentina/Salta',
    'https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv',
    'https://github.com/intasalta/daza'
) ON CONFLICT (ecowitt_station_id) DO NOTHING;

-- 2. TABLA: weather_observations
CREATE TABLE IF NOT EXISTS weather_observations (
    id VARCHAR(100) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL DEFAULT 'automatic_ecowitt',
    source_record_id VARCHAR(100),
    observed_at TIMESTAMPTZ NOT NULL,
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ,
    
    -- Variables atmosféricas
    temperature_c DECIMAL(5, 2),
    feels_like_c DECIMAL(5, 2),
    dew_point_c DECIMAL(5, 2),
    relative_humidity_pct DECIMAL(5, 2),
    vapor_pressure_deficit_kpa DECIMAL(6, 3),
    solar_radiation_wm2 DECIMAL(6, 2),
    uv_index INTEGER,
    
    -- Precipitaciones
    precipitation_rate_mmh DECIMAL(6, 2),
    precipitation_daily_mm DECIMAL(6, 2),
    precipitation_event_mm DECIMAL(6, 2),
    precipitation_hourly_mm DECIMAL(6, 2),
    precipitation_24h_mm DECIMAL(6, 2),
    precipitation_weekly_mm DECIMAL(6, 2),
    precipitation_monthly_mm DECIMAL(6, 2),
    precipitation_yearly_mm DECIMAL(6, 2),
    
    -- Viento
    wind_speed_kmh DECIMAL(5, 2),
    wind_gust_kmh DECIMAL(5, 2),
    wind_direction_deg INTEGER,
    wind_direction_10min_deg INTEGER,
    
    -- Presión
    pressure_relative_hpa DECIMAL(6, 2),
    pressure_absolute_hpa DECIMAL(6, 2),
    
    -- Estado del cielo
    sky_condition VARCHAR(50) NOT NULL DEFAULT 'Sin datos',
    sky_condition_source VARCHAR(50) NOT NULL DEFAULT 'unavailable',
    
    -- Control de calidad y notas
    validation_status VARCHAR(50) NOT NULL DEFAULT 'valido',
    validation_notes TEXT,
    notes TEXT,
    deleted_at TIMESTAMPTZ
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_obs_station_time ON weather_observations (station_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_obs_observed_at ON weather_observations (observed_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_obs_unique_station_time ON weather_observations (station_id, observed_at);

-- 3. TABLA: sync_runs
CREATE TABLE IF NOT EXISTS sync_runs (
    id VARCHAR(100) PRIMARY KEY,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL DEFAULT 'success',
    source_url TEXT NOT NULL,
    records_found INTEGER NOT NULL DEFAULT 0,
    records_inserted INTEGER NOT NULL DEFAULT 0,
    records_updated INTEGER NOT NULL DEFAULT 0,
    records_skipped INTEGER NOT NULL DEFAULT 0,
    records_rejected INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    content_hash VARCHAR(128)
);

CREATE INDEX IF NOT EXISTS idx_sync_started_at ON sync_runs (started_at DESC);

-- 4. TABLA: profiles (usuarios y roles)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'visitor', -- 'visitor' | 'operator' | 'admin'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: manual_observations
CREATE TABLE IF NOT EXISTS manual_observations (
    id VARCHAR(100) PRIMARY KEY,
    station_id VARCHAR(50) NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    observed_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operator_user VARCHAR(255) NOT NULL,
    temperature_c DECIMAL(5, 2),
    relative_humidity_pct DECIMAL(5, 2),
    pressure_hpa DECIMAL(6, 2),
    wind_speed_kmh DECIMAL(5, 2),
    wind_direction_deg INTEGER,
    sky_condition VARCHAR(50),
    notes TEXT,
    validation_status VARCHAR(50) NOT NULL DEFAULT 'valido'
);

-- 6. TABLA: data_corrections
CREATE TABLE IF NOT EXISTS data_corrections (
    id VARCHAR(100) PRIMARY KEY,
    observation_id VARCHAR(100) NOT NULL REFERENCES weather_observations(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    original_value TEXT,
    corrected_value TEXT,
    reason TEXT NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    corrected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TABLA: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(100) PRIMARY KEY,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    action VARCHAR(100) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    ip VARCHAR(50)
);

CREATE INDEX IF NOT EXISTS idx_audit_time ON audit_logs (timestamp DESC);
