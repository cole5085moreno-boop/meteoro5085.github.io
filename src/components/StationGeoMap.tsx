/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Componente de Visualización Geográfica Satelital (Leaflet)
 * Ubicación: General Güemes, Salta (Lat -24.6708, Long -65.0498)
 * Modo exclusivamente Satelital de alta resolución con telemetría en vivo
 * (Temperatura, Humedad, Presión, Viento y Precipitaciones).
 */

import React, { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import type { WeatherObservation, StationConfig } from '../types/weather.ts';
import { degreesToCardinal, ECOWITT_SHARE_URL } from '../lib/weather-engine.ts';

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

  // Coordenadas oficiales exactas del Colegio Secundario N.º 5085
  const LAT = station?.latitude ?? -24.6708;
  const LNG = station?.longitude ?? -65.0498;

  // Inicialización del Mapa Satelital
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [LAT, LNG],
        zoom: 17,
        zoomControl: false,
      });

      // Capa Satelital Principal (Esri World Imagery de alta resolución)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}',
        {
          attribution: '&copy; Esri &copy; Earthstar Geographics &copy; Maxar',
          maxZoom: 19,
        }
      ).addTo(map);

      // Capa complementaria de referencias y calles sobre la imagen satelital
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{x}/{y}',
        {
          maxZoom: 19,
          opacity: 0.85,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Actualizar marcador con datos en vivo
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const tempText =
      observation?.temperature_c !== null && observation?.temperature_c !== undefined
        ? `${observation.temperature_c.toFixed(1)}°C`
        : 'EMA 5085';

    // Marcador HTML personalizado con animación de radar
    const customIcon = L.divIcon({
      className: 'custom-station-pin',
      html: `
        <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
          <div class="absolute w-14 h-14 bg-sky-400/30 rounded-full animate-ping"></div>
          <div class="absolute w-8 h-8 bg-sky-500/50 rounded-full animate-pulse"></div>
          <div class="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/95 text-white border-2 border-sky-400 shadow-2xl text-xs font-bold font-mono whitespace-nowrap backdrop-blur-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>${tempText}</span>
          </div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    if (markerRef.current) {
      markerRef.current.setIcon(customIcon);
      markerRef.current.setLatLng([LAT, LNG]);
    } else {
      const marker = L.marker([LAT, LNG], { icon: customIcon }).addTo(mapInstanceRef.current);

      // Popup informativo institucional
      const popupContent = `
        <div class="bg-slate-900/95 text-white border border-slate-700 rounded-xl p-4 shadow-2xl text-xs w-64 font-sans backdrop-blur-md">
          <div class="text-[10px] font-bold uppercase tracking-wider text-sky-400 mb-1">
            Estación Meteorológica Automática
          </div>
          <div class="font-bold text-sm text-white">
            Colegio Secundario N.º 5085 «Dr. Mariano Moreno»
          </div>
          <div class="text-[11px] text-slate-300 mt-1">
            Sarmiento 351, General Güemes, Salta
          </div>
          <div class="mt-3 pt-2 border-t border-slate-700/80 space-y-1 font-mono text-[11px]">
            <div class="flex justify-between">
              <span class="text-slate-400">Coordenadas:</span>
              <span>-24.6708, -65.0498</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Altitud:</span>
              <span>695 msnm</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Ecowitt ID:</span>
              <span class="text-sky-400 font-bold">364053</span>
            </div>
            <div class="pt-1 text-center">
              <a href="${station?.primary_source_url || ECOWITT_SHARE_URL}" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline font-sans text-[11px] block text-center">
                Abrir panel Ecowitt.net &rarr;
              </a>
            </div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { offset: [0, -15] });
      markerRef.current = marker;
    }
  }, [observation, LAT, LNG, station]);

  const handleCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([LAT, LNG], 17, { duration: 1 });
    }
  };

  const windCardinal = degreesToCardinal(observation?.wind_direction_deg ?? null);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs mb-8 transition-colors">
      {/* Barra superior del Mapa Satelital */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-sky-600" />
            <span>Vista Satelital y Telemetría en Vivo</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            General Güemes, Salta (Lat -24.6708, Long -65.0498 · 695 msnm) · Estación Ecowitt 364053
          </p>
        </div>

        {/* Controles del Mapa Satelital */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-sky-300 border border-slate-700 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
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
            onClick={handleCenter}
            title="Centrar en la Estación"
            className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Crosshair className="w-4 h-4 text-sky-600" />
          </button>
        </div>
      </div>

      {/* Contenedor del Mapa Satelital con Superposiciones */}
      <div className="relative w-full h-96 sm:h-[460px] bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* SUPERPOSICIÓN DE DATOS EN VIVO SOBRE EL MAPA SATELITAL */}
        {showDataOverlay && observation && (
          <div className="absolute top-4 left-4 z-10 max-w-sm sm:max-w-md w-[calc(100%-2rem)] sm:w-auto bg-slate-900/90 backdrop-blur-md border border-slate-700/80 rounded-xl p-3.5 shadow-2xl text-white transition-all">
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
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70">
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
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70">
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
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70">
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
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70">
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
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70">
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
              <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/70">
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
        <div className="absolute bottom-3 right-3 z-10 bg-slate-900/90 backdrop-blur-xs border border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-mono text-slate-300 shadow-lg flex items-center gap-2">
          <span>Sarmiento 351, General Güemes, Salta</span>
          <span aria-hidden="true">·</span>
          <span>Lat: -24.6708, Lon: -65.0498</span>
        </div>
      </div>
    </div>
  );
};
