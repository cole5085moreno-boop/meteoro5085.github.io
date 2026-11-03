/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Componente de Visualización Geográfica Satelital (Leaflet)
 * Ubicación Oficial Exacta: General Güemes, Salta, Argentina
 * Coordenadas: Latitud -24.6708, Longitud -65.0498 · Altitud 695 msnm
 * Modo exclusivamente Satelital de alta resolución con capas de transporte
 * y telemetría en vivo (Temperatura, Humedad, Presión, Viento y Precipitaciones).
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Crosshair,
  Thermometer,
  Droplets,
  Gauge,
  Wind,
  CloudRain,
  Sun,
  Navigation,
  Globe2,
  ExternalLink,
  Plus,
  Minus,
  Maximize2,
} from 'lucide-react';
import type { WeatherObservation, StationConfig } from '../types/weather.ts';
import { degreesToCardinal, ECOWITT_SHARE_URL } from '../lib/weather-engine.ts';

// Constantes geográficas oficiales e inmutables para General Güemes, Salta
export const OFFICIAL_GUEMES_COORDS = {
  lat: -24.6708,
  lng: -65.0498,
  zoom: 17,
  altitude_m: 695,
  location_name: 'General Güemes, Salta, Argentina',
  institution: 'Colegio Secundario N.º 5085 «Dr. Mariano Moreno»',
  address: 'Sarmiento 351, General Güemes, Salta (CP 4432)',
  ecowitt_id: '364053',
};

interface StationGeoMapProps {
  station: StationConfig | null;
  observation: WeatherObservation | null;
  theme?: 'light' | 'dark';
}

export const StationGeoMap: React.FC<StationGeoMapProps> = ({
  station,
  observation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [showDataOverlay, setShowDataOverlay] = useState<boolean>(true);
  const [currentZoom, setCurrentZoom] = useState<number>(OFFICIAL_GUEMES_COORDS.zoom);

  // Coordenadas fijas de la estación en General Güemes, Salta
  const TARGET_LAT = OFFICIAL_GUEMES_COORDS.lat;
  const TARGET_LNG = OFFICIAL_GUEMES_COORDS.lng;

  // Función robusta para invalidar tamaño y centrar exactamente en General Güemes
  const centerOnStation = useCallback((animated: boolean = false, targetZoom: number = OFFICIAL_GUEMES_COORDS.zoom) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.invalidateSize({ animate: false });
    if (animated) {
      map.flyTo([TARGET_LAT, TARGET_LNG], targetZoom, {
        duration: 0.8,
        easeLinearity: 0.25,
      });
    } else {
      map.setView([TARGET_LAT, TARGET_LNG], targetZoom, {
        animate: false,
      });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng([TARGET_LAT, TARGET_LNG]);
    }
  }, [TARGET_LAT, TARGET_LNG]);

  // Inicialización y configuración del Mapa Satelital
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Crear instancia de Leaflet centrada estrictamente en General Güemes (-24.6708, -65.0498)
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [TARGET_LAT, TARGET_LNG],
        zoom: OFFICIAL_GUEMES_COORDS.zoom,
        zoomControl: false,
        attributionControl: true,
        maxZoom: 19,
        minZoom: 4,
      });

      // 1. Capa Satelital Principal: Esri World Imagery (imágenes satelitales globales de alta resolución)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
        {
          attribution: '&copy; Esri &copy; Maxar, Earthstar Geographics',
          maxZoom: 19,
          subdomains: ['server', 'services'],
        }
      ).addTo(map);

      // 2. Capa de Red Vial y Calles: Esri World Transportation (calles de General Güemes, Sarmiento, RN34, etc.)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{x}/{y}',
        {
          maxZoom: 19,
          opacity: 0.85,
        }
      ).addTo(map);

      // 3. Capa de Nombres y Límites: Esri World Boundaries and Places
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{x}/{y}',
        {
          maxZoom: 19,
          opacity: 0.9,
        }
      ).addTo(map);

      mapInstanceRef.current = map;

      // Escuchar cambios de zoom para actualizar estado de la interfaz
      map.on('zoomend', () => {
        setCurrentZoom(map.getZoom());
      });
    }

    // Forzar el centrado exacto y la invalidación de dimensiones en múltiples ticks
    // para resolver el problema clásico de Leaflet cuando el contenedor se renderiza dentro del layout
    centerOnStation(false);

    const frameId = requestAnimationFrame(() => {
      centerOnStation(false);
    });

    const t1 = setTimeout(() => centerOnStation(false), 80);
    const t2 = setTimeout(() => centerOnStation(false), 250);
    const t3 = setTimeout(() => centerOnStation(false), 600);
    const t4 = setTimeout(() => centerOnStation(false), 1200);

    // Observador de cambio de dimensiones del contenedor (ResizeObserver)
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize({ animate: false });
        }
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    // Listener para redimensionamiento de ventana
    const handleWindowResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize({ animate: false });
      }
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [TARGET_LAT, TARGET_LNG, centerOnStation]);

  // Actualizar marcador de la estación con datos meteorológicos en tiempo real
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const tempText =
      observation?.temperature_c !== null && observation?.temperature_c !== undefined
        ? `${observation.temperature_c.toFixed(1)}°C`
        : 'EMA 5085';

    // Marcador HTML personalizado con efecto de pulso geográfico y valor de temperatura
    const customIcon = L.divIcon({
      className: 'custom-station-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group select-none">
          <div class="absolute w-16 h-16 bg-sky-400/35 rounded-full animate-ping"></div>
          <div class="absolute w-9 h-9 bg-sky-500/50 rounded-full animate-pulse"></div>
          <div class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/95 text-white border-2 border-sky-400 shadow-2xl text-xs font-bold font-mono whitespace-nowrap backdrop-blur-sm">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>${tempText}</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    const popupContent = `
      <div class="bg-slate-900/98 text-white border border-slate-700 rounded-xl p-4 shadow-2xl text-xs w-72 font-sans backdrop-blur-md">
        <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Estación Meteorológica Automática Oficial</span>
        </div>
        <div class="font-bold text-sm text-white leading-snug">
          Colegio Secundario N.º 5085 «Dr. Mariano Moreno»
        </div>
        <div class="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
          <span>📍 Sarmiento 351, General Güemes, Salta</span>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-700/80 space-y-1.5 font-mono text-[11px]">
          <div class="flex justify-between items-center bg-slate-800/60 px-2 py-1 rounded">
            <span class="text-slate-400">Coordenadas:</span>
            <span class="text-white font-bold">-24.6708, -65.0498</span>
          </div>
          <div class="flex justify-between items-center px-2 py-0.5">
            <span class="text-slate-400">Altitud:</span>
            <span class="text-sky-300 font-bold">695 msnm</span>
          </div>
          <div class="flex justify-between items-center px-2 py-0.5">
            <span class="text-slate-400">ID Ecowitt:</span>
            <span class="text-sky-400 font-bold">364053</span>
          </div>
          <div class="flex justify-between items-center px-2 py-0.5">
            <span class="text-slate-400">Ubicación:</span>
            <span class="text-slate-200">Gral. Güemes, Salta, ARG</span>
          </div>
          <div class="pt-2 text-center">
            <a href="${station?.primary_source_url || ECOWITT_SHARE_URL}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 hover:underline font-sans text-xs font-semibold">
              <span>Abrir telemetría en Ecowitt.net</span>
              <span>&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    `;

    if (markerRef.current) {
      markerRef.current.setIcon(customIcon);
      markerRef.current.setLatLng([TARGET_LAT, TARGET_LNG]);
      markerRef.current.setPopupContent(popupContent);
    } else {
      const marker = L.marker([TARGET_LAT, TARGET_LNG], {
        icon: customIcon,
        title: 'Estación Meteorológica Colegio 5085 · General Güemes, Salta',
      }).addTo(map);

      marker.bindPopup(popupContent, { offset: [0, -15] });
      markerRef.current = marker;
    }
  }, [observation, TARGET_LAT, TARGET_LNG, station]);

  // Controles manuales de Zoom
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  // Centrado asistido con apertura del popup informativo
  const handleCenterClick = () => {
    centerOnStation(true, OFFICIAL_GUEMES_COORDS.zoom);
    if (markerRef.current) {
      setTimeout(() => {
        markerRef.current?.openPopup();
      }, 500);
    }
  };

  const windCardinal = degreesToCardinal(observation?.wind_direction_deg ?? null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs mb-8 transition-colors">
      {/* Barra superior del Mapa Satelital */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>Vista Satelital y Ubicación Exacta de la Estación</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium flex flex-wrap items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0 inline" />
            <span>General Güemes, Salta, Argentina</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">Lat: -24.6708, Long: -65.0498</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">695 msnm</span>
          </p>
        </div>

        {/* Controles del Mapa Satelital */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-sky-300 border border-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Modo Satelital Activo</span>
          </div>

          <a
            href={station?.primary_source_url || ECOWITT_SHARE_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir estación meteorológica oficial en Ecowitt.net"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 transition-colors"
          >
            <span>Ecowitt en Vivo</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={() => setShowDataOverlay(!showDataOverlay)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showDataOverlay
                ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300'
                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {showDataOverlay ? 'Ocultar Datos' : 'Mostrar Datos'}
          </button>

          <button
            onClick={handleCenterClick}
            title="Centrar exactamente en General Güemes (-24.6708, -65.0498)"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Crosshair className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Centrar Estación</span>
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa Satelital con Superposiciones */}
      <div className="relative w-full h-96 sm:h-[480px] bg-slate-950 overflow-hidden">
        {/* Elemento del Mapa Leaflet */}
        <div ref={mapContainerRef} className="w-full h-full z-0" tabIndex={0} />

        {/* Botonera de Zoom Flotante Integrada */}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-lg p-1 shadow-xl">
          <button
            onClick={handleZoomIn}
            title="Acercar mapa (+)"
            aria-label="Acercar mapa"
            className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800 mx-1" />
          <button
            onClick={handleZoomOut}
            title="Alejar mapa (-)"
            aria-label="Alejar mapa"
            className="p-1.5 text-slate-200 hover:text-white hover:bg-slate-800 rounded transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <div className="h-px bg-slate-800 mx-1" />
          <button
            onClick={handleCenterClick}
            title="Centrar en el Colegio 5085 (General Güemes)"
            aria-label="Centrar en el Colegio 5085"
            className="p-1.5 text-sky-400 hover:text-sky-300 hover:bg-slate-800 rounded transition-colors"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>

        {/* SUPERPOSICIÓN DE DATOS EN VIVO SOBRE EL MAPA SATELITAL */}
        {showDataOverlay && observation && (
          <div className="absolute top-4 left-4 z-10 max-w-sm sm:max-w-md w-[calc(100%-4.5rem)] sm:w-auto bg-slate-950/92 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-white transition-all">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2 mb-2.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                <span>Telemetría en Vivo · Colegio 5085</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {observation.observed_at.split(' ')[1] || observation.observed_at}
              </span>
            </div>

            {/* Malla de Variables Principales Sobre el Mapa Satelital */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {/* 1. Temperatura */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Thermometer className="w-3 h-3 text-sky-400" />
                  <span>Temperatura</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {observation.temperature_c !== null ? `${observation.temperature_c.toFixed(1)} °C` : '—'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Sensación: {observation.feels_like_c !== null ? `${observation.feels_like_c}°` : 'N/A'}
                </div>
              </div>

              {/* 2. Humedad */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Droplets className="w-3 h-3 text-blue-400" />
                  <span>Humedad</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {observation.relative_humidity_pct !== null ? `${Math.round(observation.relative_humidity_pct)} %` : '—'}
                </div>
                <div className="text-[10px] text-slate-400">
                  Rocío: {observation.dew_point_c !== null ? `${observation.dew_point_c}°C` : 'N/A'}
                </div>
              </div>

              {/* 3. Presión */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Gauge className="w-3 h-3 text-indigo-400" />
                  <span>Presión</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {observation.pressure_relative_hpa !== null ? `${observation.pressure_relative_hpa.toFixed(1)}` : '—'} <span className="text-[10px] font-normal text-slate-400">hPa</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Abs: {observation.pressure_absolute_hpa !== null ? `${observation.pressure_absolute_hpa.toFixed(0)}` : '—'}
                </div>
              </div>

              {/* 4. Viento */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  <span>Viento</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {observation.wind_speed_kmh !== null ? `${observation.wind_speed_kmh.toFixed(1)}` : '—'} <span className="text-[10px] font-normal text-slate-400">km/h</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Rumbo: <strong className="text-sky-400">{windCardinal}</strong> ({observation.wind_direction_deg !== null ? `${observation.wind_direction_deg}°` : '—'})
                </div>
              </div>

              {/* 5. Precipitaciones */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <CloudRain className="w-3 h-3 text-teal-400" />
                  <span>Precipitación</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {observation.precipitation_rate_mmh !== null ? `${observation.precipitation_rate_mmh.toFixed(1)}` : '0.0'} <span className="text-[10px] font-normal text-slate-400">mm/h</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Día: <strong className="text-teal-300">{observation.precipitation_daily_mm !== null ? `${observation.precipitation_daily_mm} mm` : '0 mm'}</strong>
                </div>
              </div>

              {/* 6. Radiación Solar */}
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <Sun className="w-3 h-3 text-amber-400" />
                  <span>Radiación Solar</span>
                </div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {observation.solar_radiation_wm2 !== null ? `${observation.solar_radiation_wm2.toFixed(0)}` : '—'} <span className="text-[10px] font-normal text-slate-400">W/m²</span>
                </div>
                <div className="text-[10px] text-amber-400 font-medium truncate">
                  UV: {observation.uv_index !== null ? observation.uv_index : '—'} · {observation.sky_condition}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Badge inferior de Referencia Geográfica sobre el mapa satelital */}
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 z-10 bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] font-mono text-slate-300 shadow-xl flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span className="font-sans font-medium">Sarmiento 351, General Güemes, Salta</span>
          </div>
          <span className="hidden sm:inline text-slate-600" aria-hidden="true">·</span>
          <div className="flex items-center gap-2 text-sky-400 font-semibold">
            <span>Lat: -24.6708, Lon: -65.0498</span>
            <span className="text-slate-400 font-normal">(695 msnm)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
