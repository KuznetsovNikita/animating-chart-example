import { TimeRange, Viewport } from 'src/data/models';
import { ChartData, DataService, Dict } from '../data/service';
import { Line } from './line';
import { createPolyline, Polyline } from './polyline';

export default class Chart {

    currentMax: number;
    targetMax: number;

    deltaMax: number;

    lastUpdateChart: number;

    lines: Line[] = [];
    polylines: Dict<Polyline> = {};

    constructor(
        element: HTMLDivElement,
        private settings: DataService,
        private svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
        private gLines = document.createElementNS("http://www.w3.org/2000/svg", "g"),
    ) {
        element.appendChild(this.svg);
        this.svg.appendChild(this.gLines);

        const { width, height } = this.settings.viewport;
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());


        const data = this.settings.toChartData();
        this.currentMax = data.max;


        new Line(this.gLines, 0, height, width, '');
        this.lines = this.drawLine(this.currentMax);

        for (let key in data.columns) {
            this.drawPolyline(
                key, this.currentMax, data.columns[key],
                data.times, data.colors[key],
                data.timeRange, data.viewport,
            );
        }

        settings.onTimeRangeChange(() => {
            this.drawCharts(this.settings.toChartData());
        });

        settings.onVisibilityChange((key) => {
            this.polylines[key].polyline.classList.toggle('transparent');
            this.drawCharts(this.settings.toChartData());
        });
    }


    drawCharts(data: ChartData) {

        if (this.lastUpdateChart) cancelAnimationFrame(this.lastUpdateChart);
        if (data.max === 0) return;

        this.targetMax = data.max;
        this.deltaMax = this.targetMax - this.currentMax;

        this.redrawLines(this.deltaMax);
        this.scale(data);
    }

    scale(data: ChartData) {
        this.lastUpdateChart = requestAnimationFrame(() => {

            this.lines.forEach(line => line.setHeight(
                data.viewport.height - data.viewport.height / this.currentMax * line.value,
            ));

            for (let key in data.columns) {
                this.polylines[key].setPoints(
                    this.currentMax, data.columns[key], data.times,
                    data.timeRange, data.viewport,
                );
            }

            if (this.currentMax === this.targetMax) return;

            const absMax = Math.abs(this.deltaMax);
            for (let i = 0; i < absMax * this.settings.animationSpeed; i++) {
                this.currentMax += this.deltaMax / absMax;
                if (this.currentMax === this.targetMax) break;

            }
            return this.scale(data);
        });
    }

    drawPolyline(
        key: string, max: number, values: number[],
        times: number[], color: string,
        timeRange: TimeRange, viewport: Viewport,
    ) {
        const poliline = createPolyline(color, 'main-chart');

        this.svg.appendChild(poliline.polyline);
        poliline.setPoints(
            max, values, times, timeRange, viewport,
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
                setTimeout(() => {
                    this.lines = this.lines.filter(item => item !== line);
                    line.destroy();
                }, 400);
            });

            const lines = this.drawLine(this.targetMax, 'transparent');
            this.lines.push(...lines);

            requestAnimationFrame(() => {
                lines.forEach(line => line.g.classList.remove('transparent'));
            });
        }
    }
}

