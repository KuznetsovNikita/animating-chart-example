import { recountAndUsePercentChartOver } from '../data/adapters';
import { drawConvas, map2MaxMin, mapMaxMin, toDiv, toggleClass, toScales } from '../data/common';
import { MaxMin } from '../data/models';
import { DataService } from '../models/service';
import { toScalableFactory } from './factories/scalable-factory';
import { toPoligonItemOver } from './items/poligon-item';
import { drawLens } from './lens';

export function toMiniMap(
    container: HTMLDivElement,
    settings: DataService,
) {
    const element = toDiv(container, 'mini-map');

    toMiniMapCanvas(element, settings);
    drawLens(element, settings);

    settings.onChangeFactory(shouldRender => {
        toggleClass(element, shouldRender, 'fade');
    });
}

function toMiniMapCanvas(
    element: HTMLDivElement,
    settings: DataService,
) {
    let currentMax: MaxMin[];
    let targetMax: MaxMin[];

    let deltaMax: MaxMin[];

    let lastUpdateCall: number;

    const { miniMap } = settings;

    const canvas = drawConvas(element, miniMap.viewport.width, miniMap.viewport.height);
    const context = canvas.getContext('2d');

    currentMax = settings.toMaxVisibleValue(miniMap.indexRange);

    function toCurrentMax(index: number) {
        return currentMax.length > 1 ? currentMax[index - 1] : currentMax[0];
    }

    function initChartFactory() {
        const factory = settings.itemsFactory(settings.jsonData, 1, 1);
        factory.draw(settings.useMin, context, settings.indexRange, toCurrentMax, miniMap.viewport);
        return factory;
    }
    let chartFactory = initChartFactory();

    function zooimng() {
        currentMax = settings.toMaxVisibleValue(settings.miniMap.indexRange);
        context.clearRect(0, 0, canvas.width, canvas.height);
        chartFactory.draw(
            settings.useMin, context, settings.indexRange,
            toCurrentMax, miniMap.viewport,
        );
    }

    settings.onZoom(zooimng);
    settings.onPieZoom(zooimng);

    settings.onVisibilityChange(visible => {
        chartFactory.setVisible(visible);
        drawCharts();
    });

    function drawCharts() {
        if (lastUpdateCall) {
            cancelAnimationFrame(lastUpdateCall);
            currentMax = mapMaxMin(currentMax, val => Math.floor(val / 10) * 10); // round current max, if animation wasn't finished
        }
        targetMax = settings.toMaxVisibleValue(miniMap.indexRange);
        deltaMax = map2MaxMin(
            targetMax, currentMax,
            (target, current) => Math.round((target - current) / 10),
        );

        scale(0);
    }

    function scale(index: number) {
        lastUpdateCall = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            chartFactory.scale(
                settings.useMin, context, settings.indexRange,
                toCurrentMax, miniMap.viewport,
            );

            if (index === 10) return;

            currentMax = map2MaxMin(
                currentMax, deltaMax,
                (current, delta) => current + delta,
            );

            return scale(index + 1);
        });
    }


    settings.onDrawPie(() => {
        settings.adapter.use = recountAndUsePercentChartOver(false);
        chartFactory = toScalableFactory(settings.jsonData, toPoligonItemOver, toScales(settings.visibility));
        chartFactory.draw(settings.useMin, context, settings.indexRange, toCurrentMax, miniMap.viewport);
    });

    settings.onDrawPersent(() => {
        settings.adapter.use = recountAndUsePercentChartOver(true);
        chartFactory = initChartFactory();
    });
}
