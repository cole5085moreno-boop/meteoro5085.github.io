/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Generador de Reporte Consolidado en Formato PDF con jsPDF
 * Ubicación: General Güemes, Salta, Argentina (Lat -24.6708, Long -65.0498 · 695 msnm)
 */

import { jsPDF } from 'jspdf';
import type { PeriodStatsBundle, WeatherObservation, StationConfig } from '../types/weather.ts';

export interface ReportOptions {
  title: string;
  applicant: string;
  notes: string;
  includeExecutiveSummary: boolean;
  includeStatsTable: boolean;
  includeThermal: boolean;
  includeHumidityPressure: boolean;
  includeWind: boolean;
  includePrecipitation: boolean;
  includeRadiationUV: boolean;
  includeObservationsSample: boolean;
}

export function generateConsolidatedPDF(
  stats: PeriodStatsBundle,
  station: StationConfig | null,
  observations: WeatherObservation[],
  options: ReportOptions
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  // Helper para verificar y agregar nueva página si nos acercamos al final
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 20) {
      doc.addPage();
      y = 20;
      drawPageHeader();
    }
  };

  // Dibujar encabezado en páginas secundarias
  const drawPageHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Colegio Secundario N.º 5085 «Dr. Mariano Moreno» · Reporte Meteorológico Consolidado', margin, 12);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, 14, pageWidth - margin, 14);
  };

  // ==========================================
  // PÁGINA 1: ENCABEZADO INSTITUCIONAL FORMAL
  // ==========================================

  // Barra de acento superior azul institucional
  doc.setFillColor(2, 132, 199); // Sky-600
  doc.rect(margin, y, contentWidth, 3, 'F');
  y += 7;

  // Membrete Superior
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('COLEGIO SECUNDARIO N.º 5085 «DR. MARIANO MORENO»', margin, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('Sarmiento 351, General Güemes, Salta, Argentina · Lat: -24.6708 | Long: -65.0498 · Alt: 695 msnm', margin, y);
  y += 4;
  doc.text(
    `Estación Automática Ecowitt ID: ${station?.ecowitt_station_id || '364053'} · Red Oficial INTA / EMA 5085`,
    margin,
    y
  );
  y += 6;

  // Caja de Título y Metadatos del Reporte
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.4);
  doc.roundedRect(margin, y, contentWidth, 23, 1.5, 1.5, 'FD');

  const reportId = `REP-5085-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text(options.title.toUpperCase(), margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Identificador: ${reportId}   |   Fecha de Emisión: ${new Date().toLocaleString('es-AR')}`, margin + 4, y + 11);
  doc.text(
    `Período Analizado: Desde ${stats.first_observation || '—'}  Hasta ${stats.last_observation || '—'} (${stats.total_observations} registros)`,
    margin + 4,
    y + 16
  );
  doc.text(
    `Responsable / Solicitante: ${options.applicant || 'Departamento de Ciencias Naturales y Exactas'}`,
    margin + 4,
    y + 21
  );

  y += 28;

  // ==========================================
  // SECCIÓN 1: RESUMEN EJECUTIVO (KPI CARDS)
  // ==========================================
  if (options.includeExecutiveSummary) {
    checkPageBreak(32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('1. RESUMEN EJECUTIVO CONSOLIDADO DEL PERÍODO', margin, y);
    y += 4;

    const cardWidth = (contentWidth - 6) / 4;
    const cardHeight = 16;

    // Tarjeta 1: Temp Media
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, y, cardWidth, cardHeight, 1, 1, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('TEMPERATURA MEDIA', margin + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`${stats.temperature.mean ?? '—'} °C`, margin + 3, y + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Normal: ~20.6 °C`, margin + 3, y + 14);

    // Tarjeta 2: Extremos Térmicos
    const col2X = margin + cardWidth + 2;
    doc.roundedRect(col2X, y, cardWidth, cardHeight, 1, 1, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('EXTREMOS TÉRMICOS', col2X + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(14, 165, 233);
    doc.text(`Mín: ${stats.temperature.min?.value ?? '—'}°`, col2X + 3, y + 9.5);
    doc.setTextColor(244, 63, 94);
    doc.text(`Máx: ${stats.temperature.max?.value ?? '—'}°`, col2X + 23, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Amplitud: ${stats.temperature.range ?? '—'} °C`, col2X + 3, y + 14);

    // Tarjeta 3: Lluvia Total
    const col3X = col2X + cardWidth + 2;
    doc.roundedRect(col3X, y, cardWidth, cardHeight, 1, 1, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('PRECIPITACIÓN TOTAL', col3X + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(2, 132, 199);
    doc.text(`${stats.precipitation.daily_accumulation_mm ?? 0} mm`, col3X + 3, y + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Máx tasa: ${stats.precipitation.max_rate_mmh ?? 0} mm/h`, col3X + 3, y + 14);

    // Tarjeta 4: Viento Máximo y UVI
    const col4X = col3X + cardWidth + 2;
    doc.roundedRect(col4X, y, cardWidth, cardHeight, 1, 1, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('RÁFAGA / UV MÁXIMO', col4X + 3, y + 4.5);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(217, 119, 6);
    doc.text(`${stats.wind.max_gust_kmh ?? '—'} km/h`, col4X + 3, y + 9.5);
    doc.setTextColor(147, 51, 234);
    doc.text(`UV ${stats.uv_index.max?.value ?? '—'}`, col4X + 26, y + 9.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Rumbo: ${stats.wind.cardinal_mean}`, col4X + 3, y + 14);

    y += cardHeight + 6;
  }

  // ==========================================
  // SECCIÓN 2: TABLA DE RESÚMENES ESTADÍSTICOS
  // ==========================================
  if (options.includeStatsTable) {
    checkPageBreak(65);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('2. TABLA CONSOLIDADA DE ESTADÍSTICAS DESCRIPTIVAS', margin, y);
    y += 4;

    const tableHeaders = ['Variable Meteorológica', 'Obs.', 'Media', 'Mediana', 'Mínimo', 'Máximo', 'Rango', 'Desv. Std'];
    const colWidths = [44, 12, 18, 18, 28, 28, 16, 18];

    // Encabezado de la tabla
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(margin, y, contentWidth, 5.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);

    let curX = margin + 1.5;
    tableHeaders.forEach((th, idx) => {
      doc.text(th, curX, y + 3.8);
      curX += colWidths[idx];
    });

    y += 5.5;

    const tableRows = [
      {
        name: 'Temperatura Exterior (°C)',
        v: stats.temperature,
        unit: '°C',
      },
      {
        name: 'Sensación Térmica (°C)',
        v: stats.feels_like,
        unit: '°C',
      },
      {
        name: 'Punto de Rocío (°C)',
        v: stats.dew_point,
        unit: '°C',
      },
      {
        name: 'Humedad Relativa (%)',
        v: stats.humidity,
        unit: '%',
      },
      {
        name: 'Déficit Presión Vapor (kPa)',
        v: stats.vpd,
        unit: 'kPa',
      },
      {
        name: 'Presión Relativa (hPa)',
        v: stats.pressure_relative,
        unit: 'hPa',
      },
      {
        name: 'Velocidad del Viento (km/h)',
        v: stats.wind_speed,
        unit: 'km/h',
      },
      {
        name: 'Radiación Solar (W/m²)',
        v: stats.solar_radiation,
        unit: 'W/m²',
      },
      {
        name: 'Índice Ultravioleta (UVI)',
        v: stats.uv_index,
        unit: '',
      },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);

    tableRows.forEach((row, rIdx) => {
      checkPageBreak(5.5);

      // Fondo alternado
      if (rIdx % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, contentWidth, 5, 'F');
      }

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(margin, y + 5, margin + contentWidth, y + 5);

      doc.setTextColor(15, 23, 42);
      let rowX = margin + 1.5;

      // Nombre variable
      doc.text(row.name, rowX, y + 3.5);
      rowX += colWidths[0];

      // Obs count
      doc.text(String(row.v.count), rowX, y + 3.5);
      rowX += colWidths[1];

      // Media
      doc.setFont('helvetica', 'bold');
      doc.text(row.v.mean !== null ? `${row.v.mean} ${row.unit}` : '—', rowX, y + 3.5);
      doc.setFont('helvetica', 'normal');
      rowX += colWidths[2];

      // Mediana
      doc.text(row.v.median !== null ? `${row.v.median}` : '—', rowX, y + 3.5);
      rowX += colWidths[3];

      // Mínimo con fecha
      const minStr = row.v.min ? `${row.v.min.value} (${row.v.min.observed_at.split(' ')[1] || ''})` : '—';
      doc.setTextColor(2, 132, 199);
      doc.text(minStr, rowX, y + 3.5);
      doc.setTextColor(15, 23, 42);
      rowX += colWidths[4];

      // Máximo con fecha
      const maxStr = row.v.max ? `${row.v.max.value} (${row.v.max.observed_at.split(' ')[1] || ''})` : '—';
      doc.setTextColor(225, 29, 72);
      doc.text(maxStr, rowX, y + 3.5);
      doc.setTextColor(15, 23, 42);
      rowX += colWidths[5];

      // Rango
      doc.text(row.v.range !== null ? `${row.v.range}` : '—', rowX, y + 3.5);
      rowX += colWidths[6];

      // Desv Std
      doc.text(row.v.std_dev !== null ? `±${row.v.std_dev}` : '—', rowX, y + 3.5);

      y += 5;
    });

    y += 5;
  }

  // ==========================================
  // SECCIÓN 3: DETALLE POR SECTORES CLIMÁTICOS
  // ==========================================

  // Térmico
  if (options.includeThermal) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('3. COMPORTAMIENTO TÉRMICO Y SENSACIÓN', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const textThermal = [
      `• Temperatura Media: ${stats.temperature.mean ?? 'N/A'} °C | Mínima Registrada: ${stats.temperature.min?.value ?? 'N/A'} °C (${stats.temperature.min?.observed_at ?? ''}) | Máxima Registrada: ${stats.temperature.max?.value ?? 'N/A'} °C (${stats.temperature.max?.observed_at ?? ''})`,
      `• Amplitud Térmica Diaria: ${stats.temperature.range ?? 'N/A'} °C | Desviación Estándar de la Serie: ±${stats.temperature.std_dev ?? 'N/A'} °C`,
      `• Sensación Térmica Media: ${stats.feels_like.mean ?? 'N/A'} °C (Extremos registrados: ${stats.feels_like.min?.value ?? 'N/A'} a ${stats.feels_like.max?.value ?? 'N/A'} °C)`,
      `• Punto de Rocío Medio: ${stats.dew_point.mean ?? 'N/A'} °C (Condensación superficial nocturna activa cuando T aproxima a Td)`,
    ];
    textThermal.forEach((t) => {
      doc.text(t, margin + 2, y);
      y += 3.8;
    });
    y += 3;
  }

  // Humedad, VPD y Presión
  if (options.includeHumidityPressure) {
    checkPageBreak(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('4. RÉGIMEN DE HUMEDAD, VPD Y PRESIÓN BAROMÉTRICA', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const textHum = [
      `• Humedad Relativa Media: ${stats.humidity.mean ?? 'N/A'} % (Mínima: ${stats.humidity.min?.value ?? 'N/A'} % | Máxima: ${stats.humidity.max?.value ?? 'N/A'} %)`,
      `• Déficit de Presión de Vapor (VPD) Medio: ${stats.vpd.mean ?? 'N/A'} kPa (Mín: ${stats.vpd.min?.value ?? 'N/A'} kPa | Máx: ${stats.vpd.max?.value ?? 'N/A'} kPa)`,
      `• Estado del Cultivo / Transpiración: ${Number(stats.vpd.mean || 0) > 1.6 ? 'VPD elevado (aire seco, alta demanda transpiratoria)' : 'VPD óptimo para la fotosíntesis en el Valle de Siancas'}`,
      `• Presión Barométrica Relativa Media: ${stats.pressure_relative.mean ?? 'N/A'} hPa (Rango barométrico: ${stats.pressure_relative.min?.value ?? 'N/A'} a ${stats.pressure_relative.max?.value ?? 'N/A'} hPa)`,
    ];
    textHum.forEach((t) => {
      doc.text(t, margin + 2, y);
      y += 3.8;
    });
    y += 3;
  }

  // Dinámica del Viento
  if (options.includeWind) {
    checkPageBreak(28);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('5. DINÁMICA CIRCULAR DEL VIENTO', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const textWind = [
      `• Rumbo Medio Circular Vectorial: ${stats.wind.cardinal_mean} (${stats.wind.circular_mean_deg !== null ? `${stats.wind.circular_mean_deg}°` : 'N/A'})`,
      `• Velocidad Media: ${stats.wind_speed.mean ?? 'N/A'} km/h | Velocidad Sostenida Máxima: ${stats.wind.max_speed_kmh ?? 'N/A'} km/h`,
      `• Ráfaga Máxima Registrada: ${stats.wind.max_gust_kmh ?? 'N/A'} km/h | Porcentaje de Calma (0 km/h): ${stats.wind.calm_pct ?? 0} %`,
    ];
    textWind.forEach((t) => {
      doc.text(t, margin + 2, y);
      y += 3.8;
    });
    y += 3;
  }

  // Precipitaciones
  if (options.includePrecipitation) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('6. COMPORTAMIENTO DE PRECIPITACIONES Y CIELO', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const textPrecip = [
      `• Precipitación Acumulada: ${stats.precipitation.daily_accumulation_mm ?? 0} mm | Tasa Máxima Instantánea: ${stats.precipitation.max_rate_mmh ?? 0} mm/h`,
      `• Intervalos con Lluvia Activa: ${stats.precipitation.rain_intervals_count ?? 0} intervalos`,
      `• Distribución del Cielo: Soleado: ${stats.sky_distribution.soleado} | Seminublado: ${stats.sky_distribution.seminublado} | Nublado: ${stats.sky_distribution.nublado}`,
    ];
    textPrecip.forEach((t) => {
      doc.text(t, margin + 2, y);
      y += 3.8;
    });
    y += 3;
  }

  // Radiación Solar y UV
  if (options.includeRadiationUV) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('7. RADIACIÓN SOLAR E ÍNDICE ULTRAVIOLETA', margin, y);
    y += 4;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const textRad = [
      `• Radiación Solar Máxima: ${stats.solar_radiation.max?.value ?? 'N/A'} W/m² (registrada a las ${stats.solar_radiation.max?.observed_at ?? ''})`,
      `• Índice Ultravioleta Máximo: ${stats.uv_index.max?.value ?? 'N/A'} UVI | Riesgo OMS: ${Number(stats.uv_index.max?.value || 0) >= 11 ? 'Extremo' : Number(stats.uv_index.max?.value || 0) >= 8 ? 'Muy Alto' : 'Moderado'}`,
    ];
    textRad.forEach((t) => {
      doc.text(t, margin + 2, y);
      y += 3.8;
    });
    y += 3;
  }

  // Muestra de Observaciones
  if (options.includeObservationsSample && observations.length > 0) {
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('8. MUESTRA CRONOLÓGICA DE REGISTROS METEOROLÓGICOS (ÚLTIMAS OBSERVACIONES)', margin, y);
    y += 4;

    const sampleObs = observations.slice(-12).reverse();
    const obsHeaders = ['Fecha / Hora', 'Temp (°C)', 'Sens (°C)', 'HR (%)', 'VPD (kPa)', 'Viento (km/h)', 'Lluvia (mm)', 'Cielo'];
    const obsWidths = [36, 18, 18, 16, 20, 24, 20, 28];

    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y, contentWidth, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);

    let ox = margin + 1;
    obsHeaders.forEach((h, i) => {
      doc.text(h, ox, y + 3.5);
      ox += obsWidths[i];
    });
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(15, 23, 42);

    sampleObs.forEach((o, idx) => {
      checkPageBreak(4.5);
      if (idx % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y, contentWidth, 4.2, 'F');
      }

      let rx = margin + 1;
      doc.text(o.observed_at, rx, y + 3);
      rx += obsWidths[0];

      doc.text(`${o.temperature_c ?? '—'}`, rx, y + 3);
      rx += obsWidths[1];

      doc.text(`${o.feels_like_c ?? '—'}`, rx, y + 3);
      rx += obsWidths[2];

      doc.text(`${o.relative_humidity_pct ?? '—'}%`, rx, y + 3);
      rx += obsWidths[3];

      doc.text(`${o.vapor_pressure_deficit_kpa ?? '—'}`, rx, y + 3);
      rx += obsWidths[4];

      doc.text(`${o.wind_speed_kmh ?? '0'} (${o.wind_gust_kmh ?? '0'})`, rx, y + 3);
      rx += obsWidths[5];

      doc.text(`${o.precipitation_daily_mm ?? '0'}`, rx, y + 3);
      rx += obsWidths[6];

      doc.text(`${o.sky_condition || 'Despejado'}`, rx, y + 3);

      y += 4.2;
    });

    y += 4;
  }

  // Notas y Conclusiones Institucionales
  if (options.notes.trim()) {
    checkPageBreak(25);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('9. DICTAMEN / NOTAS Y OBSERVACIONES DEL DOCENTE / OPERADOR', margin, y);
    y += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, y, contentWidth, 16, 1, 1, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const splitNotes = doc.splitTextToSize(options.notes, contentWidth - 6);
    doc.text(splitNotes, margin + 3, y + 4.5);

    y += 20;
  }

  // ==========================================
  // PIE DE PÁGINA EN TODAS LAS HOJAS
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Documento oficial generado por la Plataforma Meteorológica del Colegio 5085 · INTA Salta / EMA 5085',
      margin,
      pageHeight - 8
    );
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  // Guardar archivo PDF con fecha y nombre estándar
  const safeTitle = options.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const filename = `${safeTitle}_colegio5085_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
