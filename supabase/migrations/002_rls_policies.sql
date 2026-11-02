-- =========================================================================
-- Proyecto Estación Meteorológica Colegio 5085
-- Migración 002: Políticas de Seguridad a Nivel de Fila (RLS)
-- =========================================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. Stations: Lectura pública, modificación solo administradores
CREATE POLICY "stations_public_read" ON stations
    FOR SELECT TO public USING (true);

CREATE POLICY "stations_admin_all" ON stations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 2. Weather Observations: Lectura pública, inserción y modificación restringida
CREATE POLICY "observations_public_read" ON weather_observations
    FOR SELECT TO public USING (deleted_at IS NULL);

CREATE POLICY "observations_operator_insert" ON weather_observations
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('operator', 'admin')
        )
    );

CREATE POLICY "observations_admin_all" ON weather_observations
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 3. Manual Observations: Lectura pública, inserción para operadores y administradores
CREATE POLICY "manual_obs_public_read" ON manual_observations
    FOR SELECT TO public USING (true);

CREATE POLICY "manual_obs_operator_insert" ON manual_observations
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('operator', 'admin')
        )
    );

-- 4. Data Corrections: Lectura pública de auditoría, inserción solo administrador
CREATE POLICY "corrections_public_read" ON data_corrections
    FOR SELECT TO public USING (true);

CREATE POLICY "corrections_admin_insert" ON data_corrections
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 5. Audit logs: Solo lectura para administradores
CREATE POLICY "audit_admin_read" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );

-- 6. Sync runs: Lectura pública para supervisar estado de la estación, inserción por servicio
CREATE POLICY "sync_runs_public_read" ON sync_runs
    FOR SELECT TO public USING (true);
