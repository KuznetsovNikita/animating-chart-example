import { TimeRange, Viewport } from 'src/data/models';
import { ChartData, DataService, Dict } from '../data/service';
import { drawLens } from './lens';
import { createPolyline, Polyline } from './polyline';


export function drawMiniMap(
    settings: DataService,
) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    element.id = 'mini-map';

    new MiniMapSvg(element, settings);
    drawLens(element, settings);
}


class MiniMapSvg {

    currentMax: number;
    targetMax: number;

    deltaMax: number;

    lastUpdateCall: number;

    polylines: Dict<Polyline> = {};

    constructor(
        element: HTMLDivElement,
        private settings: DataService,
        private svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    ) {
        element.appendChild(this.svg);

        const { width, height } = this.settings.miniMap;
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());

        const data = this.settings.toMiniMapData();
        this.currentMax = data.max;

        for (let key in data.columns) {
            this.drawPolyline(
                key, this.currentMax, data.columns[key],
                data.times, data.colors[key],
                data.timeRange, data.viewport,
            );
        }

        settings.onVisibilityChange((key, value) => {
            if (value) {
                this.drawCharts(
                    this.settings.toMiniMapData(),
                    () => this.polylines[key].polyline.classList.remove('invisible'),
                );
            }
            else {
                this.polylines[key].polyline.classList.add('invisible')
                this.drawCharts(this.settings.toMiniMapData());
            }
        });
    }

    drawCharts(data: ChartData, callback?: () => void) {

        if (this.lastUpdateCall) {
            cancelAnimationFrame(this.lastUpdateCall);
        }

        this.targetMax = data.max;
        this.deltaMax = this.targetMax - this.currentMax;

        this.scale(data, callback);
    }

    scale(data: ChartData, callback?: () => void) {
        this.lastUpdateCall = requestAnimationFrame(() => {

            for (let key in data.columns) {
                this.redrawPoliline(
                    key, this.currentMax, data.columns[key], data.times,
                    data.timeRange, data.viewport,
                );
            }

            if (this.currentMax === this.targetMax) return callback && callback();

            const absMax = Math.abs(this.deltaMax);
            for (let i = 0; i < absMax * this.settings.animationSpeed; i++) {
                this.currentMax += this.deltaMax / absMax;
                if (this.currentMax === this.targetMax) break;
            }
            return this.scale(data, callback);
        });
    }


    drawPolyline(
        key: string, max: number, values: number[],
        times: number[], color: string,
        timeRange: TimeRange, viewport: Viewport,
    ) {
        const poliline = createPolyline(color, 'mini-map-chart');

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
}

