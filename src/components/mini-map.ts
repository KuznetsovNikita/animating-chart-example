import { drawConvas, map2 } from '../data/const';
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

    const { miniMap, min } = settings;

    const canvas = drawConvas(element, miniMap.viewport.width, miniMap.viewport.height);
    const context = canvas.getContext('2d');

    currentMax = settings.toMaxVisibleValue(miniMap.indexRange);

    function toCurrentMax(index: number) {
        return currentMax.length > 1 ? currentMax[index - 1] : currentMax[0];
    }

    const chartItems = settings.cr(settings.jsonData, 1);
    chartItems.drw(settings.useMin, context, min, toCurrentMax, miniMap.viewport);

    settings.onZoom(() => {
        const zoomingMax = settings.toMaxVisibleValue(settings.miniMap.indexRange);
        context.clearRect(0, 0, canvas.width, canvas.height);
        chartItems.drw(
            settings.useMin, context, min,
            i => zoomingMax.length > 1 ? zoomingMax[i - 1] : zoomingMax[0],
            miniMap.viewport,
        );
    });

    settings.onVisibilityChange((key, value) => {
        chartItems.set(key, value);
        drawCharts();
    });

    function drawCharts() {
        if (lastUpdateCall) {
            cancelAnimationFrame(lastUpdateCall);
            currentMax = currentMax.map(max => Math.floor(max / 10) * 10); // round current max, if animation wasn't finished
        }
        targetMax = settings.toMaxVisibleValue(miniMap.indexRange);
        deltaMax = map2(
            targetMax, currentMax,
            (t, c) => Math.round((t - c) / 10),
        );

        scale(0);
    }

    function scale(index: number) {
        lastUpdateCall = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            chartItems.sc(settings.useMin, context, min, toCurrentMax, miniMap.viewport);

            if (index === 10) return;
            currentMax = map2(
                currentMax, deltaMax,
                (c, d) => c + d,
            );

            return scale(index + 1);
        });
    }
}
