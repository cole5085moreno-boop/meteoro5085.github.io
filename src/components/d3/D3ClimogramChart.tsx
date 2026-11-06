/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Climograma Interactivo de Walter-Lieth con D3.js
 * Visualiza la relación bioclimática P = 2T para General Güemes (Salta)
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { MonthlyClimatologySummary } from '../../lib/historical-climatology-data.ts';

interface D3ClimogramChartProps {
  monthlyData: MonthlyClimatologySummary[];
}

export const D3ClimogramChart: React.FC<D3ClimogramChartProps> = ({ monthlyData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredMonth, setHoveredMonth] = useState<MonthlyClimatologySummary | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || monthlyData.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 720;
    const height = 360;
    const margin = { top: 30, right: 55, bottom: 45, left: 55 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escala X (12 Meses)
    const xScale = d3
      .scaleBand()
      .domain(monthlyData.map((d) => d.monthName.slice(0, 3)))
      .range([0, innerWidth])
      .padding(0.28);

    // Escalas Bioclimáticas de Walter-Lieth (P = 2T):
    // Máxima precipitación histórica mensual en Güemes alcanza ~180-220 mm.
    // 200 mm de lluvia equivale a 100°C en escala 2:1, pero para visualización ajustamos con escala dual proporcional:
    const maxPrecip = Math.max(180, d3.max(monthlyData, (d) => d.precipitation_sum) || 180);
    const yPrecipScale = d3.scaleLinear().domain([0, maxPrecip]).nice().range([innerHeight, 0]);

    // Escala de Temperatura (°C) en el eje derecho: 0 a 40°C
    const yTempScale = d3.scaleLinear().domain([0, 40]).range([innerHeight, 0]);

    // Cuadrícula sutil
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3.axisLeft(yPrecipScale)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', 'currentColor')
      .attr('stroke-opacity', 0.08)
      .attr('stroke-dasharray', '2,2');

    g.select('.grid .domain').remove();

    // 1. Eje X
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('font-size', '11px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .attr('font-weight', '600')
      .selectAll('text')
      .attr('fill', 'currentColor');

    // 2. Eje Izquierdo: Precipitación (Azul)
    const yAxisLeft = d3.axisLeft(yPrecipScale).ticks(6);
    g.append('g')
      .call(yAxisLeft)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '11px')
      .selectAll('text')
      .attr('fill', '#0284c7');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -42)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#0284c7')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Precipitación (mm)');

    // 3. Eje Derecho: Temperatura (Rojo/Ámbar)
    const yAxisRight = d3.axisRight(yTempScale).ticks(5);
    g.append('g')
      .attr('transform', `translate(${innerWidth},0)`)
      .call(yAxisRight)
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '11px')
      .selectAll('text')
      .attr('fill', '#f97316');

    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -45)
      .attr('x', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#f97316')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Temperatura Media (°C)');

    // 4. Barras de Precipitación Normal (azul claro traslúcido de referencia)
    g.selectAll('.bar-normal')
      .data(monthlyData)
      .enter()
      .append('rect')
      .attr('class', 'bar-normal')
      .attr('x', (d) => (xScale(d.monthName.slice(0, 3)) || 0) + xScale.bandwidth() * 0.1)
      .attr('y', (d) => yPrecipScale(d.precipitation_normal))
      .attr('width', xScale.bandwidth() * 0.8)
      .attr('height', (d) => innerHeight - yPrecipScale(d.precipitation_normal))
      .attr('fill', '#38bdf8')
      .attr('fill-opacity', 0.3)
      .attr('rx', 2);

    // 5. Barras de Precipitación Observada (azul sólido)
    g.selectAll('.bar-observed')
      .data(monthlyData)
      .enter()
      .append('rect')
      .attr('class', 'bar-observed cursor-pointer transition-opacity')
      .attr('x', (d) => (xScale(d.monthName.slice(0, 3)) || 0) + xScale.bandwidth() * 0.2)
      .attr('y', (d) => yPrecipScale(d.precipitation_sum))
      .attr('width', xScale.bandwidth() * 0.6)
      .attr('height', (d) => innerHeight - yPrecipScale(d.precipitation_sum))
      .attr('fill', '#0284c7')
      .attr('rx', 3)
      .on('mouseenter', (event, d) => setHoveredMonth(d))
      .on('mouseleave', () => setHoveredMonth(null));

    // 6. Curva de Temperatura Media
    const tempLine = d3
      .line<MonthlyClimatologySummary>()
      .x((d) => (xScale(d.monthName.slice(0, 3)) || 0) + xScale.bandwidth() / 2)
      .y((d) => yTempScale(d.temp_mean))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(monthlyData)
      .attr('fill', 'none')
      .attr('stroke', '#ea580c')
      .attr('stroke-width', 3)
      .attr('d', tempLine);

    // Puntos sobre la curva de temperatura
    g.selectAll('.temp-dot')
      .data(monthlyData)
      .enter()
      .append('circle')
      .attr('class', 'temp-dot cursor-pointer')
      .attr('cx', (d) => (xScale(d.monthName.slice(0, 3)) || 0) + xScale.bandwidth() / 2)
      .attr('cy', (d) => yTempScale(d.temp_mean))
      .attr('r', 4.5)
      .attr('fill', '#ea580c')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .on('mouseenter', (event, d) => setHoveredMonth(d))
      .on('mouseleave', () => setHoveredMonth(null));
  }, [monthlyData]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Tooltip interactivo sobre el climograma */}
      {hoveredMonth && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-slate-900/95 text-white border border-slate-700 rounded-xl p-3 text-xs font-mono shadow-2xl pointer-events-none min-w-[240px]">
          <div className="font-bold text-sky-400 font-sans border-b border-slate-700 pb-1 flex justify-between">
            <span>Mes: {hoveredMonth.monthName}</span>
            <span className="text-[11px] text-slate-400 font-normal">Güemes, Salta</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2 text-[11px]">
            <div>
              <div className="text-sky-300 font-bold">Precipitación:</div>
              <div>Observada: <strong>{hoveredMonth.precipitation_sum} mm</strong></div>
              <div className="text-slate-400 text-[10px]">Normal: {hoveredMonth.precipitation_normal} mm</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">Temperatura:</div>
              <div>Media: <strong>{hoveredMonth.temp_mean} °C</strong></div>
              <div className="text-slate-400 text-[10px]">Normal: {hoveredMonth.temp_normal} °C</div>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-800 text-[10px] text-slate-300 flex justify-between">
            <span>Anomalía térmica: <strong className={hoveredMonth.anomaly_temp >= 0 ? 'text-rose-400' : 'text-cyan-400'}>{hoveredMonth.anomaly_temp > 0 ? `+${hoveredMonth.anomaly_temp}` : hoveredMonth.anomaly_temp}°C</strong></span>
            <span>Heladas: <strong>{hoveredMonth.frost_days_count} d</strong></span>
          </div>
        </div>
      )}

      {/* SVG D3 */}
      <svg ref={svgRef} className="w-full text-slate-800 dark:text-slate-200 overflow-visible" />
    </div>
  );
};
