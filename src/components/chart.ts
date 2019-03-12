import { TimeRange, Viewport } from 'src/data/models';
import { ChartData, DataService, Dict } from '../data/service';
import { createLine, Line } from './line';
import { createPolyline, Polyline } from './polyline';

export default class Chart {

    currentMax: number;
    targetMax: number;

    deltaMax: number;

    lastUpdateCall: number;

    lines: Line[] = [];
    polylines: Dict<Polyline> = {};

    constructor(
        private settings: DataService,
        private svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    ) {
        document.body.appendChild(this.svg);

        const { width, height } = this.settings.viewport;
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());

        const data = this.settings.toChartData();
        this.currentMax = data.max;
        this.drawLine(this.currentMax);

        for (let key in data.columns) {
            this.drawPolyline(
                key, this.currentMax, data.columns[key],
                data.times, data.colors[key],
                data.timeRange, data.viewport,
            );
        }

        settings.onTimeRangeChange(this.redraw);
        settings.onVisibilityChange(key => {
            this.polylines[key].polyline.classList.toggle('invisible');
            this.redraw()
        });
    }

    redraw = () => {
        const data = this.settings.toChartData();
        this.drawCharts(data);
    }

    drawCharts(data: ChartData) {

        if (this.lastUpdateCall) {
            cancelAnimationFrame(this.lastUpdateCall);
        }
        // if (Object.keys(data.columns).length === 0) {
        //     return this.clean();
        // }

        this.targetMax = data.max;

        this.deltaMax = this.targetMax - this.currentMax;

        this.scale(data);
    }

    scale(data: ChartData) {
        this.lastUpdateCall = requestAnimationFrame(() => {

            this.redrawLine(this.currentMax);

            for (let key in data.columns) {
                this.redrawPoliline(
                    key, this.currentMax, data.columns[key], data.times,
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

    redrawPoliline(
        key: string, max: number, values: number[], times: number[],
        timeRange: TimeRange, viewport: Viewport,
    ) {
        this.polylines[key].setPoints(
            max, values, times,
            timeRange, viewport,
        );
    }


    drawLine(max: number) {
        this.settings.useLines(max, (value, height, width) => {
            const line = createLine(value, height, width);
            this.lines.push(line);
            this.svg.appendChild(line.line);
            this.svg.appendChild(line.text);
        });
    }

    redrawLine(max: number) {
        this.settings.useLines(max, (value, height, _, i) => {
            this.lines[i].setValue(value, height)
        });
    }
}
