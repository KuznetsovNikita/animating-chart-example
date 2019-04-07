import { Column, Dict, TimeColumn } from 'src/data/models';
import { drawConvas } from '../data/const';
import { DataService } from '../data/service';
import { drawLens } from './lens';
import { pl, Polyline } from './polyline';

export function toMiniMap(
    container: HTMLDivElement,
    settings: DataService,
) {
    const element = document.createElement('div');
    container.appendChild(element);
    element.classList.add('mini-map');

    toMiniMapSvg(element, settings);
    drawLens(element, settings);

}

function toMiniMapSvg(
    element: HTMLDivElement,
    settings: DataService,
) {
    let currentMax: number;
    let targetMax: number;

    let deltaMax: number;

    let lastUpdateCall: number;

    const polylines: Dict<Polyline> = {};

    const {
        jsonData: { columns, colors },
        miniMap: { viewport, indexRange, timeRange }, min,
    } = settings;

    const canvas = drawConvas(element, viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    currentMax = settings.toMaxVisibleValue(indexRange);

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            key, currentMax, columns[i],
            columns[0], colors[key],
        );
    }


    settings.onVisibilityChange((key, value) => {
        polylines[key].set(value);
        drawCharts();
    });

    function drawCharts() {

        if (lastUpdateCall) cancelAnimationFrame(lastUpdateCall);

        const max = settings.toMaxVisibleValue(indexRange);

        targetMax = max;
        deltaMax = (targetMax - currentMax) / 10;

        scale(0);
    }

    function scale(index: number) {
        lastUpdateCall = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 1; i < columns.length; i++) {
                polylines[columns[i][0]].sc(
                    context, min, currentMax, columns[i], columns[0],
                    indexRange, timeRange, viewport,
                );
            }

            if (index === 10) return;
            currentMax += deltaMax;
            return scale(index + 1);
        });
    }

    function drawPolyline(
        key: string, max: number, values: Column,
        times: TimeColumn, color: string,
    ) {
        polylines[key] = pl(color, 1);
        polylines[key].drw(context, min, max, values, times, indexRange, timeRange, viewport);
    }
}
