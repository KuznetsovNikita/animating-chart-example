import { drawConvas, map2 } from '../data/const';
import { ChartItem, Dict } from '../data/models';
import { DataService } from '../data/service';
import { drawLens } from './lens';

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
    let currentMax: number[];
    let targetMax: number[];

    let deltaMax: number[];

    let lastUpdateCall: number;

    const polylines: Dict<ChartItem> = {};

    const {
        jsonData: { columns, colors },
        miniMap: { viewport, indexRange }, min,
    } = settings;

    const canvas = drawConvas(element, viewport.width, viewport.height);
    const context = canvas.getContext('2d');

    currentMax = settings.toMaxVisibleValue(indexRange);

    function toCurrentMax(index: number) {
        return currentMax.length > 1 ? currentMax[index - 1] : currentMax[0];
    }

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            i, key, toCurrentMax(i), colors[key],
        );
    }


    settings.onVisibilityChange((key, value) => {
        polylines[key].set(value);
        drawCharts();
    });

    function drawCharts() {
        if (lastUpdateCall) {
            cancelAnimationFrame(lastUpdateCall);
            currentMax = currentMax.map(max => Math.floor(max / 10) * 10); // round current max, if animation wasn't finished
        }
        targetMax = settings.toMaxVisibleValue(indexRange);
        deltaMax = map2(
            targetMax, currentMax,
            (t, c) => Math.round((t - c) / 10),
        );

        scale(0);
    }

    function scale(index: number) {
        lastUpdateCall = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 1; i < columns.length; i++) {
                polylines[columns[i][0]].sc(
                    settings.useMin, context, i, min, toCurrentMax(i), viewport,
                );
            }

            if (index === 10) return;
            currentMax = map2(
                currentMax, deltaMax,
                (c, d) => c + d,
            );

            return scale(index + 1);
        });
    }

    function drawPolyline(
        index: number,
        key: string, max: number, color: string,
    ) {
        polylines[key] = settings.cr(color, 1);
        polylines[key].drw(settings.useMin, context, index, min, max, viewport);
    }
}
