/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Gráfico D3.js Interactivo de Series Temporales y Tendencias Climáticas
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { DailyClimatologyRecord } from '../../lib/historical-climatology-data.ts';

interface D3TimeSeriesChartProps {
  data: DailyClimatologyRecord[];
  variable: 'temp' | 'precip' | 'humidity' | 'solar';
  showMovingAverage?: boolean;
}

export const D3TimeSeriesChart: React.FC<D3TimeSeriesChartProps> = ({
  data,
  variable,
  showMovingAverage = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DailyClimatologyRecord | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || data.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 800;
    const height = 360;
    const margin = { top: 25, right: 35, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Parsear fechas
    const parseTime = d3.timeParse('%Y-%m-%d');
    const parsedData = data.map((d) => ({
      ...d,
      parsedDate: parseTime(d.date) || new Date(d.year, d.month - 1, d.day),
    }));

    // Escalas X e Y
    const xExtent = d3.extent(parsedData, (d) => d.parsedDate) as [Date, Date];
    const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);

    let yDomain: [number, number];
    let unitLabel = '';

    if (variable === 'temp') {
      const minVal = d3.min(parsedData, (d) => d.temp_min) ?? 0;
      const maxVal = d3.max(parsedData, (d) => d.temp_max) ?? 40;
      yDomain = [Math.floor(minVal - 2), Math.ceil(maxVal + 2)];
      unitLabel = 'Temperatura (°C)';
    } else if (variable === 'precip') {
      const maxVal = d3.max(parsedData, (d) => d.precipitation_mm) ?? 50;
      yDomain = [0, Math.ceil(maxVal * 1.15)];
      unitLabel = 'Precipitación Diaria (mm)';
    } else if (variable === 'humidity') {
      yDomain = [0, 100];
      unitLabel = 'Humedad Relativa (%)';
    } else {
      const maxVal = d3.max(parsedData, (d) => d.solar_radiation) ?? 800;
      yDomain = [0, Math.ceil(maxVal * 1.1)];
      unitLabel = 'Radiación Solar (W/m²)';
    }

    const yScale = d3.scaleLinear().domain(yDomain).nice().range([innerHeight, 0]);

    // Cuadrícula horizontal (Grid)
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.1)
      .attr('stroke-dasharray', '2,2');

    g.select('.grid .domain').remove();

    // Eje X
    const xAxis = d3
      .axisBottom<Date>(xScale)
      .ticks(Math.max(5, Math.floor(width / 110)))
      .tickFormat((d) => d3.timeFormat(parsedData.length > 365 ? '%b %Y' : '%d %b')(d as Date));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .attr('opacity', 0.7);

    // Eje Y
    const yAxis = d3.axisLeft(yScale).ticks(6);

    g.append('g')
      .call(yAxis)
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .selectAll('text')
      .attr('fill', 'currentColor')
      .attr('opacity', 0.7);

    // Etiqueta Eje Y
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -42)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .text(unitLabel);

    // Generador de gradiente para el área
    const defs = svg.append('defs');

    // Renderizado según variable
    if (variable === 'temp') {
      // 1. Área de envolvente térmica (entre Mínima y Máxima)
      const areaGenerator = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0((d) => yScale(d.temp_min))
        .y1((d) => yScale(d.temp_max))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', '#0284c7')
        .attr('fill-opacity', 0.15)
        .attr('d', areaGenerator);

      // 2. Línea de Temperatura Máxima (rojo/ámbar)
      const lineMax = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScale(d.temp_max))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#f97316')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8)
        .attr('d', lineMax);

      // 3. Línea de Temperatura Mínima (azul)
      const lineMin = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScale(d.temp_min))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#38bdf8')
        .attr('stroke-width', 1.5)
        .attr('stroke-opacity', 0.8)
        .attr('d', lineMin);

      // 4. Línea de Temperatura Media (destacada)
      const lineMean = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScale(d.temp_mean))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 2.2)
        .attr('d', lineMean);

      // 5. Media Móvil de 30 días para apreciar la tendencia anual
      if (showMovingAverage && parsedData.length >= 14) {
        const windowSize = parsedData.length > 365 ? 30 : 7;
        const movingAvgData = parsedData.map((d, i, arr) => {
          const startIdx = Math.max(0, i - windowSize + 1);
          const slice = arr.slice(startIdx, i + 1);
          const avg = d3.mean(slice, (s) => s.temp_mean) || d.temp_mean;
          return { parsedDate: d.parsedDate, avg };
        });

        const lineTrend = d3
          .line<any>()
          .x((d) => xScale(d.parsedDate))
          .y((d) => yScale(d.avg))
          .curve(d3.curveBasis);

        g.append('path')
          .datum(movingAvgData)
          .attr('fill', 'none')
          .attr('stroke', '#e11d48')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4,3')
          .attr('d', lineTrend);
      }
    } else if (variable === 'precip') {
      // Barras de precipitación
      const barWidth = Math.max(2, Math.min(10, innerWidth / parsedData.length - 1));

      g.selectAll('.precip-bar')
        .data(parsedData.filter((d) => d.precipitation_mm > 0))
        .enter()
        .append('rect')
        .attr('class', 'precip-bar')
        .attr('x', (d) => xScale(d.parsedDate) - barWidth / 2)
        .attr('y', (d) => yScale(d.precipitation_mm))
        .attr('width', barWidth)
        .attr('height', (d) => innerHeight - yScale(d.precipitation_mm))
        .attr('fill', '#0284c7')
        .attr('rx', 1.5)
        .attr('opacity', 0.85);
    } else if (variable === 'humidity') {
      const lineHum = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScale(d.relative_humidity))
        .curve(d3.curveMonotoneX);

      const areaHum = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0(innerHeight)
        .y1((d) => yScale(d.relative_humidity))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', '#0ea5e9')
        .attr('fill-opacity', 0.18)
        .attr('d', areaHum);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#0284c7')
        .attr('stroke-width', 2)
        .attr('d', lineHum);
    } else {
      // Radiación Solar
      const lineSol = d3
        .line<any>()
        .x((d) => xScale(d.parsedDate))
        .y((d) => yScale(d.solar_radiation))
        .curve(d3.curveMonotoneX);

      const areaSol = d3
        .area<any>()
        .x((d) => xScale(d.parsedDate))
        .y0(innerHeight)
        .y1((d) => yScale(d.solar_radiation))
        .curve(d3.curveMonotoneX);

      g.append('path')
        .datum(parsedData)
        .attr('fill', '#f59e0b')
        .attr('fill-opacity', 0.2)
        .attr('d', areaSol);

      g.append('path')
        .datum(parsedData)
        .attr('fill', 'none')
        .attr('stroke', '#d97706')
        .attr('stroke-width', 2)
        .attr('d', lineSol);
    }

    // Capa invisible de interacción del mouse (Overlay)
    const bisectDate = d3.bisector<any, Date>((d) => d.parsedDate).left;

    const crosshair = g
      .append('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .attr('opacity', 0)
      .attr('y1', 0)
      .attr('y2', innerHeight);

    const focusPoint = g
      .append('circle')
      .attr('r', 4.5)
      .attr('fill', '#0284c7')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .attr('opacity', 0);

    g.append('rect')
      .attr('class', 'overlay')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .on('mousemove', function (event) {
        const [mouseX] = d3.pointer(event);
        const x0 = xScale.invert(mouseX);
        const index = bisectDate(parsedData, x0, 1);
        const d0 = parsedData[index - 1];
        const d1 = parsedData[index];
        let d = d0;
        if (d1 && x0) {
          d = x0.getTime() - d0.parsedDate.getTime() > d1.parsedDate.getTime() - x0.getTime() ? d1 : d0;
        }

        if (d) {
          const cx = xScale(d.parsedDate);
          let cy = yScale(d.temp_mean);
          if (variable === 'precip') cy = yScale(d.precipitation_mm);
          else if (variable === 'humidity') cy = yScale(d.relative_humidity);
          else if (variable === 'solar') cy = yScale(d.solar_radiation);

          crosshair.attr('x1', cx).attr('x2', cx).attr('opacity', 0.6);
          focusPoint.attr('cx', cx).attr('cy', cy).attr('opacity', 1);
          setHoveredPoint(d);
        }
      })
      .on('mouseleave', function () {
        crosshair.attr('opacity', 0);
        focusPoint.attr('opacity', 0);
        setHoveredPoint(null);
      });
  }, [data, variable, showMovingAverage]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Tooltip dinámico sobre el gráfico */}
      {hoveredPoint && (
        <div className="absolute top-2 right-4 z-10 bg-slate-900/90 backdrop-blur-xs text-white border border-slate-700 rounded-lg p-2.5 text-xs font-mono shadow-xl pointer-events-none space-y-1">
          <div className="font-bold text-sky-400 font-sans border-b border-slate-700 pb-1">
            {hoveredPoint.date} (General Güemes)
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-400">Temp. Media:</span>
            <span className="font-bold">{hoveredPoint.temp_mean} °C</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-amber-400">Máx: {hoveredPoint.temp_max}°C</span>
            <span className="text-sky-300">Mín: {hoveredPoint.temp_min}°C</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px] pt-1 border-t border-slate-800">
            <span className="text-slate-400">Lluvia:</span>
            <span className="text-teal-300">{hoveredPoint.precipitation_mm} mm</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Humedad:</span>
            <span>{hoveredPoint.relative_humidity}%</span>
          </div>
          <div className="flex justify-between gap-4 text-[11px]">
            <span className="text-slate-400">Radiación:</span>
            <span>{hoveredPoint.solar_radiation} W/m²</span>
          </div>
        </div>
      )}

      {/* SVG D3 renderizado */}
      <svg ref={svgRef} className="w-full text-slate-800 dark:text-slate-200 overflow-visible" />
    </div>
  );
};
