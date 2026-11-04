/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Tipos de datos para el Pronóstico de General Güemes (MSN El Tiempo / Bing Weather)
 */

export interface HourlyForecastItem {
  timeStr: string;
  hour: string; // e.g. "15:00", "16:00"
  timeIso: string;
  temperature_c: number;
  feels_like_c: number;
  condition_text: string;
  symbol: string;
  rain_probability_pct: number;
  rain_amount_mm: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  wind_gust_kmh?: string;
  relative_humidity_pct: number;
  uv_index: number;
  cloud_cover_pct: string;
  air_pressure_hpa: number;
  daytime: 'd' | 'n';
}

export interface DailyForecastItem {
  dayIndex: number;
  dateStr: string; // e.g. "2026-11-04"
  dayName: string; // e.g. "Hoy", "Jueves", "Viernes"
  fullDateLabel: string; // e.g. "Miércoles 4 de Noviembre"
  condition_text: string;
  symbol: string;
  temp_max_c: number;
  temp_min_c: number;
  feels_max_c: number;
  feels_min_c: number;
  precipitation_probability_pct: number;
  rain_amount_mm: number;
  relative_humidity_pct: number;
  humidity_low_pct: number;
  humidity_high_pct: number;
  wind_speed_kmh: number;
  wind_max_kmh: number;
  wind_max_dir?: string;
  uv_index: number;
  uv_description: string;
  air_pressure_hpa: number;
  day_summary?: string;
  night_summary?: string;
  day_cap?: string;
  night_cap?: string;
  hourly: HourlyForecastItem[];
}

export interface CurrentConditionForecast {
  temperature_c: number;
  feels_like_c: number;
  condition_text: string;
  symbol: string;
  uv_index: number;
  uv_description: string;
  aqi: number;
  aqi_severity: string;
  primary_pollutant?: string;
  relative_humidity_pct: number;
  dew_point_c: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  precipitation_probability_pct: number;
  air_pressure_hpa?: number;
}

export interface AlmanacInfo {
  sunrise: string;
  sunset: string;
  moonrise?: string;
  moonset?: string;
  moon_phase: string;
  day_length_hours?: string;
}

export interface SatelliteImageryMeta {
  timestamp: string;
  satelliteTileTemplate: string;
  sampleTileUrl: string;
  goesSatelliteUrl: string;
  radarUrl: string;
  msnMapsUrl: string;
}

export interface ForecastData {
  source_name: string;
  source_url: string;
  location_name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  fetched_at: string;
  current: CurrentConditionForecast;
  days: DailyForecastItem[];
  almanac: AlmanacInfo;
  satellite: SatelliteImageryMeta;
}
