/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Proyecto Estación Meteorológica Colegio 5085
 * Gráfico D3.js de Anomalías Climáticas Divergentes
 */

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { MonthlyClimatologySummary } from '../../lib/historical-climatology-data.ts';

interface D3AnomalyChartProps {
  monthlyData: MonthlyClimatologySummary[];
}

export const D3AnomalyChart: React.FC<D3AnomalyChartProps> = ({ monthlyData }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState<MonthlyClimatologySummary | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || monthlyData.length === 0) return;

    const container = containerRef.current;
    const width = container.clientWidth || 720;
    const height = 260;
    const margin = { top: 25, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Escala X (Meses)
    const xScale = d3
      .scaleBand()
      .domain(monthlyData.map((d) => d.monthName.slice(0, 3)))
      .range([0, innerWidth])
      .padding(0.3);

    // Escala Y simétrica para anomalías térmicas (°C)
    const maxAnomaly = Math.max(
      2.5,
      d3.max(monthlyData, (d) => Math.abs(d.anomaly_temp)) || 2.5
    );
    const yScale = d3.scaleLinear().domain([-maxAnomaly, maxAnomaly]).nice().range([innerHeight, 0]);

    // Línea base cero
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', 'currentColor')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // Eje X
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale))
      .attr('font-size', '11px')
      .attr('font-family', 'Plus Jakarta Sans, sans-serif')
      .selectAll('text')
      .attr('fill', 'currentColor');

    // Eje Y
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat((d) => `${Number(d) > 0 ? '+' : ''}${d}°C`);

    g.append('g')
      .call(yAxis)
      .attr('font-size', '11px')
      .attr('font-family', 'JetBrains Mono, monospace')
      .selectAll('text')
      .attr('fill', 'currentColor');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -38)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', 'currentColor')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text('Anomalía Térmica (°C)');

    // Barras divergentes (+ rojo/naranja, - azul/celeste)
    g.selectAll('.anomaly-bar')
      .data(monthlyData)
      .enter()
      .append('rect')
      .attr('class', 'anomaly-bar cursor-pointer transition-all')
      .attr('x', (d) => xScale(d.monthName.slice(0, 3)) || 0)
      .attr('y', (d) => (d.anomaly_temp >= 0 ? yScale(d.anomaly_temp) : yScale(0)))
      .attr('width', xScale.bandwidth())
      .attr('height', (d) => Math.abs(yScale(d.anomaly_temp) - yScale(0)))
      .attr('fill', (d) => (d.anomaly_temp >= 0 ? '#f43f5e' : '#0284c7'))
      .attr('rx', 2.5)
      .on('mouseenter', (event, d) => setHovered(d))
      .on('mouseleave', () => setHovered(null));

    // Etiquetas de valor sobre las barras
    g.selectAll('.anomaly-label')
      .data(monthlyData)
      .enter()
      .append('text')
      .attr('class', 'anomaly-label pointer-events-none')
      .attr('x', (d) => (xScale(d.monthName.slice(0, 3)) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d) =>
        d.anomaly_temp >= 0 ? yScale(d.anomaly_temp) - 5 : yScale(d.anomaly_temp) + 12
      )
      .attr('text-anchor', 'middle')
      .attr('font-family', 'JetBrains Mono, monospace')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', (d) => (d.anomaly_temp >= 0 ? '#f43f5e' : '#0284c7'))
      .text((d) => `${d.anomaly_temp > 0 ? '+' : ''}${d.anomaly_temp}`);
  }, [monthlyData]);

  return (
    <div className="relative w-full" ref={containerRef}>
      {hovered && (
        <div className="absolute top-2 right-4 z-10 bg-slate-900/90 text-white border border-slate-700 rounded-lg p-2 text-xs font-mono shadow-xl pointer-events-none">
          <span className="font-bold text-sky-400">{hovered.monthName}: </span>
          <span>
            {hovered.anomaly_temp > 0 ? `+${hovered.anomaly_temp}` : hovered.anomaly_temp} °C
            respecto a la normal (1991-2020)
          </span>
        </div>
      )}
      <svg ref={svgRef} className="w-full text-slate-800 dark:text-slate-200 overflow-visible" />
    </div>
  );
};
