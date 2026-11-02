# Guía de Publicación en GitHub Pages
## Proyecto Estación Meteorológica Colegio 5085
**Colegio Secundario N.º 5085 «Dr. Mariano Moreno» · General Güemes, Salta, Argentina**

---

Esta aplicación web ha sido optimizada para desplegarse como un sitio estático de alto rendimiento en **GitHub Pages** sin necesidad de servidores adicionales o costos de infraestructura.

### 1. Optimizaciones Implementadas para GitHub Pages

1. **Rutas Relativas (`base: './'`)**:
   - `vite.config.ts` configurado con `base: './'`, permitiendo que la web funcione tanto en la raíz de un dominio como en cualquier subdirectorio de repositorio (ej: `https://<usuario>.github.io/estacion5085/`).
2. **Conexión Directa con la Fuente Oficial**:
   - La aplicación consulta en tiempo real el archivo CSV público de la estación Ecowitt ID 364053 publicado por INTA Salta:
     `https://raw.githubusercontent.com/intasalta/daza/main/364053_daily_station_data.csv`
   - El motor meteorológico (`weather-engine.ts`) procesa y normaliza los datos directamente en el navegador del visitante, calculando promedios, extremos, estadística circular de viento y correlaciones.
3. **Caché y Persistencia en el Navegador**:
   - Si la fuente se encuentra temporalmente sin conexión, la app preserva las últimas observaciones válidas y configuraciones en `localStorage`.
4. **Archivo `.nojekyll`**:
   - Evita que el compilador Jekyll de GitHub Pages ignore las carpetas de recursos generadas por Vite.
5. **Enrutamiento SPA (`404.html`)**:
   - Redirige cualquier recarga de página al punto de entrada para evitar pantallas de error 404.
6. **Exportación Autónoma en el Cliente**:
   - Las exportaciones a **Excel (.XLSX)**, **CSV** y **PDF** se generan localmente en el dispositivo del usuario sin requerir endpoints de backend.

---

### 2. Pasos para Activar GitHub Pages en tu Repositorio

#### Método Recomendado: Despliegue Automático con GitHub Actions

1. Sube tu código al repositorio en GitHub en la rama principal (`main`).
2. En GitHub, ingresa a tu repositorio y ve a la pestaña **Settings** (Configuración).
3. En el menú lateral izquierdo, haz clic en **Pages**.
4. En la sección **Build and deployment**:
   - En **Source**, selecciona: **GitHub Actions**.
5. ¡Listo! El flujo de trabajo automatizado `.github/workflows/deploy.yml` ya incluido en este proyecto se ejecutará automáticamente en cada `git push` a `main`, compilando y publicando la aplicación en minutos.
6. Tu aplicación estará disponible en:
   `https://<tu-usuario>.github.io/<nombre-del-repo>/`

---

### 3. Compilación Manual para Previsualización

Si deseas compilar la web en tu computadora para verificar el resultado estático antes de publicarlo:

```bash
# 1. Compilar los archivos estáticos de producción
npm run build

# 2. Previsualizar la web compilada localmente
npm run preview
```

Los archivos finales listos para publicar se generarán dentro de la carpeta `dist/`.
