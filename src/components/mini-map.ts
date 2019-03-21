import { Column, Dict, TimeColumn } from 'src/data/models';
import { nsu } from '../data/const';
import { DataService } from '../data/service';
import { drawLens } from './lens';
import { Polyline, toPolyline } from './polyline';

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

    const svg = document.createElementNS(nsu, "svg");

    element.appendChild(svg);


    const {
        jsonData: { columns, colors },
        miniMap: { viewport, viewport: { width, height }, indexRange, timeRange },
        visibility, min,
    } = settings;

    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', height.toString());

    currentMax = settings.toMaxVisibleValue(
        settings.miniMap.indexRange,
    );

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            key, currentMax, columns[i],
            columns[0], colors[key],
        );
    }


    settings.onVisibilityChange((key, value) => {
        if (value) {
            drawCharts(
                () => polylines[key].polyline.classList.remove('invisible'),
            );
        }
        else {
            polylines[key].polyline.classList.add('invisible')
            drawCharts();
        }
    });

    settings.onDestroy(() => {
        element.removeChild(svg);
    });

    function drawCharts(callback?: () => void) {

        if (lastUpdateCall) cancelAnimationFrame(lastUpdateCall);

        const max = settings.toMaxVisibleValue(
            settings.miniMap.indexRange,
        );

        if (max === 0) return;

        targetMax = max;
        deltaMax = targetMax - currentMax;

        scale(callback);
    }

    function scale(callback?: () => void) {
        lastUpdateCall = requestAnimationFrame(() => {

            for (let i = 1; i < columns.length; i++) {
                const key = columns[i][0];
                if (visibility[key]) {
                    polylines[key].setPoints(
                        min, currentMax, columns[i], columns[0],
                        indexRange, timeRange, viewport,
                    );
                }
            }

            if (currentMax === targetMax) return callback && callback();

            const absMax = Math.abs(deltaMax);
            for (let i = 0; i < absMax * settings.animationSpeed; i++) {
                currentMax += deltaMax / absMax;
                if (currentMax === targetMax) {
                    break;
                }
            }
            return scale(callback);
        });
    }

    function drawPolyline(
        key: string, max: number, values: Column,
        times: TimeColumn, color: string,
    ) {
        const poliline = toPolyline(color, 'mini-map-chart');

        svg.appendChild(poliline.polyline);
        poliline.setPoints(
            min, max, values, times,
            indexRange, timeRange, viewport,
        );

        polylines[key] = poliline;
    }
}
