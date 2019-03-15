import { Column, Dict, Range, Times, Viewport } from 'src/data/models';
import { DataService } from '../data/service';
import { Line } from './line';
import { Polyline } from './polyline';

export default class Chart {

    currentMax: number;
    targetMax: number;

    deltaMax: number;

    lastUpdateChart: number;

    lines: Line[] = [];
    linesStock: Line[] = [];
    polylines: Dict<Polyline> = {};

    constructor(
        element: HTMLDivElement,
        private settings: DataService,
        private svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
        private gLines = document.createElementNS("http://www.w3.org/2000/svg", "g"),
    ) {
        element.appendChild(this.svg);
        this.svg.appendChild(this.gLines);

        const {
            jsonData: { columns, colors },
            viewport: { width, height },
            indexRange, timeRange, viewport
        } = this.settings;

        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());

        this.currentMax = this.settings.toMaxVisibleValue(indexRange);

        new Line(this.gLines, 0, height, width, '');
        this.lines = this.drawLine(this.currentMax);

        for (let i = 1; i < columns.length; i++) {
            const key = columns[i][0];
            this.drawPolyline(
                key, this.currentMax, columns[i],
                columns[0], colors[key],
                indexRange, timeRange, viewport,
            );
        }

        settings.onTimeRangeChange(() => {
            this.drawCharts();
        });

        settings.onVisibilityChange((key) => {
            this.polylines[key].polyline.classList.toggle('transparent');
            this.drawCharts();
        });
    }


    drawCharts() {
        if (this.lastUpdateChart) cancelAnimationFrame(this.lastUpdateChart);

        const max = this.settings.toMaxVisibleValue(
            this.settings.indexRange,
        );

        if (max === 0) return;

        this.targetMax = max;
        this.deltaMax = this.targetMax - this.currentMax;

        this.redrawLines(this.deltaMax);
        this.scale();
    }

    scale() {
        this.lastUpdateChart = requestAnimationFrame(() => {

            this.scaleLines();

            const {
                jsonData: { columns },
                indexRange, timeRange, viewport,
            } = this.settings;
            for (let i = 1; i < columns.length; i++) {
                this.polylines[columns[i][0]].setPoints(
                    this.currentMax, columns[i], columns[0],
                    indexRange, timeRange, viewport,
                );
            }

            if (this.currentMax === this.targetMax) return;

            const absMax = Math.abs(this.deltaMax);
            for (let i = 0; i < absMax * this.settings.animationSpeed; i++) {
                this.currentMax += this.deltaMax / absMax;
                if (this.currentMax === this.targetMax) break;

            }
            return this.scale();
        });
    }

    drawPolyline(
        key: string, max: number, values: Column,
        times: Times, color: string, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) {
        const poliline = new Polyline(color, 'main-chart');

        this.svg.appendChild(poliline.polyline);
        poliline.setPoints(
            max, values, times, indexRange, timeRange, viewport,
        );

        this.polylines[key] = poliline;
    }

    drawLine(max: number, className: string = ''): Line[] {
        const { height, width } = this.settings.viewport;
        const dx = height / max;

        const lastLine = Math.floor((max - 26 / dx) / 10) * 10;
        const dOneLine = lastLine / this.settings.lines;

        const lines = [];
        for (let label = dOneLine; label <= lastLine; label += dOneLine) {
            const x = height - label * dx;

            lines.push(new Line(this.gLines, label, x, width, className));
        }
        return lines;
    }


    redrawLines(deltaMax: number) {
        if (deltaMax != 0) {

            this.lines.forEach(line => {
                line.g.classList.add('transparent');
                this.linesStock.push(line);
                setTimeout(() => {
                    this.linesStock = this.linesStock
                        .filter(item => item !== line);
                    line.destroy();
                }, 400);
            })

            const lines = this.drawLine(this.targetMax, 'transparent');
            this.lines = lines;

            requestAnimationFrame(() => {
                lines.forEach(line => line.g.classList.remove('transparent'));
            });
        }
    }

    scaleLines() {
        const { height } = this.settings.viewport;
        const dx = height / this.currentMax;

        this.lines.forEach(line => line.setHeight(height - dx * line.value));
        this.linesStock.forEach(line => line.setHeight(height - dx * line.value));
    }
}

