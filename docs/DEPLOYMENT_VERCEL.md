# Guía de Despliegue en Vercel y Supabase
## Proyecto Estación Meteorológica Colegio 5085
**Colegio Secundario N.º 5085 «Dr. Mariano Moreno» · General Güemes, Salta, Argentina**

---

### 1. Resumen de la Arquitectura

La aplicación está diseñada para operar como una plataforma full-stack moderna:
- **Frontend**: React + TypeScript + Tailwind CSS (diseño responsive, gráficos vectoriales SVG, rosa de los vientos interactiva, exportadores XLSX/PDF).
- **Backend**: Servidor Node / Express con API RESTful para consulta, filtrado, normalización e integración del módulo `weather-source`.
- **Fuente de Datos Principal**: Repositorio y página de la Estación Automática Ecowitt ID 364053 (INTA Salta / Colegio 5085):
  - `https://intasalta.github.io/ema_5085mm/`
  - `https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv`
- **Base de Datos**: PostgreSQL / Supabase para almacenamiento relacional persistente, con fallback y caché atómica local.

---

### 2. Configuración de Base de Datos en Supabase

1. Crear un proyecto nuevo en [Supabase](https://supabase.com).
2. En el panel lateral, ingresar a **SQL Editor**.
3. Ejecutar en orden los scripts de migración ubicados en este repositorio:
   - `supabase/migrations/001_initial_schema.sql` (Crea las tablas `stations`, `weather_observations`, `sync_runs`, `profiles`, `manual_observations`, `data_corrections`, `audit_logs`).
   - `supabase/migrations/002_rls_policies.sql` (Habilita Row Level Security y establece políticas de acceso para visitantes, operadores y administradores).
4. En **Project Settings > API**, copiar:
   - Project URL
   - `anon` `public` key
   - `service_role` key (mantener en secreto)

---

### 3. Configuración de Variables de Entorno en Vercel

En el panel de su proyecto en Vercel (**Settings > Environment Variables**), configure:

| Variable | Valor sugerido | Descripción |
| :--- | :--- | :--- |
| `WEATHER_SYNC_SECRET` | `secret5085` (o un secreto generado) | Protege el endpoint de sincronización programada |
| `WEATHER_SOURCE_URL` | `https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv` | URL pública del CSV de mediciones diarias |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyzcompany.supabase.co` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | Clave pública de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | Clave de servicio para sincronización segura |
| `PORT` | `3000` | Puerto de escucha |

---

### 4. Tarea Programada de Sincronización en Vercel (Cron Jobs)

Para sincronizar automáticamente los datos cada 15 minutos en sincronía con la actualización de la estación en GitHub:

Crear en la raíz el archivo `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

El endpoint `/api/sync` valida automáticamente la cabecera `x-sync-secret` o el token secreto configurado.

---

### 5. Credenciales Iniciales de Acceso

- **Operador Estudiantil / Docente**:
  - Clave de acceso: `alumno5085`
  - Permisos: Ingreso de observaciones manuales complementarias, consulta avanzada y reportes.
- **Administrador del Sistema**:
  - Clave de acceso: `administrador5085`
  - Permisos: Sincronización manual forzada, importación histórica de Git, corrección auditada de datos, modificación de parámetros de estación y bitácora de auditoría.

---

### 6. Ejecución de Pruebas Automatizadas

La aplicación cuenta con una suite de 10 pruebas automatizadas integradas que validan:
- Parser e idempotencia del CSV.
- Tratamiento de datos faltantes (sin sustituir por ceros).
- Estadística circular del viento para la discontinuidad 0°/360°.
- Cifrado de contraseñas mediante PBKDF2/SHA-512.
- No destructividad en las correcciones de auditoría.

Para ejecutarlas desde el navegador, acceda a la pestaña **Administración > Pruebas Automatizadas** y presione **Ejecutar Suite de Pruebas**.
Para ejecutarlas por consola:
```bash
npx tsx -e 'import { runAutomatedTests } from "./server/test-runner.ts"; console.log(runAutomatedTests());'
```
