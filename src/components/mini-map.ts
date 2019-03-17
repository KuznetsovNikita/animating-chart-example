import { Column, Dict, TimeColumn } from 'src/data/models';
import { DataService } from '../data/service';
import { drawLens } from './lens';
import { Polyline } from './polyline';


export class MiniMap {
    constructor(
        container: HTMLDivElement,
        settings: DataService,
        public element = document.createElement('div'),
        public miniMap = new MiniMapSvg(element, settings)
    ) {
        container.appendChild(element);
        element.id = 'mini-map';

        drawLens(element, settings);
    }
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

        const { width, height } = this.settings.miniMap.viewport;
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());

        this.currentMax = this.settings.toMaxVisibleValue(
            this.settings.miniMap.indexRange,
        );

        const { jsonData: { columns, colors } } = this.settings;
        for (let i = 1; i < columns.length; i++) {
            const key = columns[i][0];
            this.drawPolyline(
                key, this.currentMax, columns[i],
                columns[0], colors[key],
            );
        }


        settings.onVisibilityChange((key, value) => {
            if (value) {
                this.drawCharts(
                    () => this.polylines[key].polyline.classList.remove('invisible'),
                );
            }
            else {
                this.polylines[key].polyline.classList.add('invisible')
                this.drawCharts();
            }
        });
    }

    drawCharts(callback?: () => void) {

        if (this.lastUpdateCall) cancelAnimationFrame(this.lastUpdateCall);

        const max = this.settings.toMaxVisibleValue(
            this.settings.miniMap.indexRange,
        );

        if (max === 0) return;

        this.targetMax = max;
        this.deltaMax = this.targetMax - this.currentMax;

        this.scale(callback);
    }

    scale(callback?: () => void) {
        this.lastUpdateCall = requestAnimationFrame(() => {

            const {
                jsonData: { columns },
                miniMap: { viewport, indexRange, timeRange },
                visibility,
            } = this.settings;
            for (let i = 1; i < columns.length; i++) {
                const key = columns[i][0];
                if (visibility[key]) {
                    this.polylines[key].setPoints(
                        this.currentMax, columns[i], columns[0],
                        indexRange, timeRange, viewport,
                    );
                }
            }

            if (this.currentMax === this.targetMax) return callback && callback();

            const absMax = Math.abs(this.deltaMax);
            for (let i = 0; i < absMax * this.settings.animationSpeed; i++) {
                this.currentMax += this.deltaMax / absMax;
                if (this.currentMax === this.targetMax) {
                    break;
                }
            }
            return this.scale(callback);
        });
    }


    drawPolyline(
        key: string, max: number, values: Column,
        times: TimeColumn, color: string,
    ) {
        const { viewport, indexRange, timeRange } = this.settings.miniMap;
        const poliline = new Polyline(color, 'mini-map-chart');

        this.svg.appendChild(poliline.polyline);
        poliline.setPoints(
            max, values, times,
            indexRange, timeRange, viewport,
        );

        this.polylines[key] = poliline;
    }
}

