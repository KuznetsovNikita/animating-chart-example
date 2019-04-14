import { MaxMin } from 'src/data/models';
import { devicePixelRatio, drawConvas, map2MaxMin, mapMaxMin } from '../data/common';
import { ChangeKind, DataService } from '../models/service';
import { toPieFactory } from './factories/pie-factory';
import { Line, LineValue, ln } from './line';
import { pieAnimator } from './pie-animator';
import { toPopUp } from './pop-up';
import { toTimes } from './times';


export function toChart(
    element: HTMLDivElement,
    settings: DataService,
) {
    let currentMax: MaxMin[];
    let targetMax: MaxMin[];

    let deltaMax: MaxMin[];

    let lastUpdateChart: number;
    let lastUpdateLine: number;

    let lines: Line[] = [];
    let linesStock: Line[] = [];

    const {
        jsonData: { columns, colors }, viewport,
    } = settings;

    const canvas = drawConvas(element, viewport.width, viewport.height + 2);
    const context = canvas.getContext('2d');

    let disabled = false;
    context.textAlign = "center";
    context.lineJoin = 'bevel';
    context.lineCap = 'butt';

    const times = toTimes(element, settings);

    const lineCanvas = drawConvas(element, viewport.width - 10, viewport.height + 11, 'lines');
    const lineContext = lineCanvas.getContext('2d');
    lineContext.font = (10 * devicePixelRatio) + 'px Arial';

    lineContext.fillStyle = settings.style.text;
    lineContext.strokeStyle = settings.style.line;

    settings.onChangeStyle(() => {
        lineContext.fillStyle = settings.style.text;
        lineContext.strokeStyle = settings.style.line;
        if (disabled) return;
        redrawLinesForse();
    });

    lineContext.lineWidth = devicePixelRatio;
    lineCanvas.style.zIndex = settings.zIndex;

    currentMax = settings.toMaxVisibleValue(settings.indexRange);

    lines = drawLine(currentMax, 1);
    lines.forEach(line => line.drw(lineContext));

    const toCurrentMax = (index: number) => {
        return currentMax.length > 1 ? currentMax[index - 1] : currentMax[0];
    }

    const initStandartFactory = (toMax = toCurrentMax) => {
        const factory = settings.toFactory(settings.jsonData, 2, 1);
        factory.draw(settings.use, context, settings.indexRange, toMax, viewport);
        return factory;
    }

    let chartFactory = initStandartFactory();

    toPopUp(element, settings, toCurrentMax);

    settings.onZoomStart((data, endIndexRanage, _, visibility) => {
        const frames = 10;
        targetMax = settings.adapter.toMax(data, visibility, endIndexRanage);
        deltaMax = map2MaxMin(
            targetMax, currentMax,
            (target, current) => (target - current) / frames,
        );
        redrawLines(deltaMax, frames);
        countMaxValue(frames);
    });

    settings.onSingletonZoom(() => {
        chartFactory = initStandartFactory(() => targetMax[0]);
    });

    settings.onZoom((_, opacity) => {
        const zoomingMax = settings.toMaxVisibleValue(settings.indexRange);
        context.clearRect(0, 0, canvas.width, canvas.height);
        chartFactory.scale(
            settings.use, context, settings.indexRange,
            i => zoomingMax.length > 1 ? zoomingMax[i - 1] : zoomingMax[0],
            viewport, opacity,
        );
    });

    settings.onTimeRangeChange(kind => {
        chartFactory.setRange(settings.indexRange);
        drawCharts(kind);
    });

    settings.onVisibilityChange(visible => {
        chartFactory.setVisible(visible);
        drawCharts('visible');
    });

    let lastCountUpdate = null
    function countMaxValue(count: number) {
        if (lastCountUpdate != null) cancelAnimationFrame(lastCountUpdate);
        incrementValue(1, count)
    }

    function incrementValue(index, count) {
        lastCountUpdate = requestAnimationFrame(() => {

            currentMax = map2MaxMin(
                currentMax, deltaMax,
                (current, delta) => current + delta,
            );

            if (index === count) return;
            incrementValue(index + 1, count);
        })
    }

    function drawCharts(kind: ChangeKind) {
        if (lastUpdateChart) {
            cancelAnimationFrame(lastUpdateChart);
            currentMax = mapMaxMin(currentMax, val => Math.floor(val / 10) * 10); // round current max, if animation wasn't finished
        }

        times.rdt(kind);

        targetMax = settings.toMaxVisibleValue(
            settings.indexRange,
        );
        deltaMax = map2MaxMin(
            targetMax, currentMax,
            (target, current) => Math.round((target - current) / 10)
        );

        scaleChart(0, 10);
        redrawLines(deltaMax, 10);
        countMaxValue(10);
    }


    function scaleChart(index: number, frames: number) {
        lastUpdateChart = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height);

            chartFactory.scale(settings.use, context, settings.indexRange, toCurrentMax, viewport);

            if (index === frames) return;
            return scaleChart(index + 1, frames);
        });
    }

    function drawLine(max: MaxMin[], opacity: number): Line[] {

        const lines = [];

        let items = max.map<LineValue>(([max, min], i) => {
            const lastLine = Math.floor(max / 10) * 10;
            return {
                dx: viewport.height / (max - min),
                lastLine,
                dOneLine: (lastLine - min) / 5, // Lines count.
                color: colors[columns[i + 1][0]],
                isShow: settings.visibility[i + 1],
                label: min,
                min,
            };
        });

        do {
            const x = viewport.height + 10 - (items[0].label - items[0].min) * items[0].dx;
            lines.push(ln(items, x * devicePixelRatio, (viewport.width - 10) * devicePixelRatio, opacity));
            items = items.map(item => ({ ...item, label: item.label + item.dOneLine }));
        }
        while (items[0].label <= items[0].lastLine);

        return lines;
    }

    function redrawLinesForse() {
        lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        lines = drawLine(currentMax, 1);
        lines.forEach(line => line.drw(lineContext));
    }

    function redrawLines(deltaMax: MaxMin[], frames: number) {
        if (deltaMax.every(([max, min]) => max === 0 && min === 0)) return;

        if (lastUpdateLine != null) cancelAnimationFrame(lastUpdateLine);

        lines.forEach(line => {
            line.hd();
            linesStock.push(line);
        });

        lines = drawLine(targetMax, 0);

        scaleLines(0, frames);
    }

    function scaleLines(index: number, frames: number) {
        lastUpdateLine = requestAnimationFrame(() => {

            lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

            const dx1 = viewport.height / (currentMax[0][0] - currentMax[0][1]);

            function update(line: Line): boolean {
                return line.up(lineContext, (viewport.height + 10 - (line.vl[0].label - currentMax[0][1]) * dx1) * devicePixelRatio) != 0;
            }

            lines.forEach(update);
            linesStock = linesStock.filter(update);
            if (index >= frames) return;

            scaleLines(index + 1, frames);
        });
    }

    const pie = pieAnimator(canvas, context, viewport, settings.jsonData);

    settings.onDrawPie((persets, endIndexRange) => {
        disabled = true;
        lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        pie.drawPie(persets).then(() => {
            chartFactory = toPieFactory(settings.jsonData, settings.visibility);
            chartFactory.draw(settings.use, context, endIndexRange, toCurrentMax, viewport);
            settings.onHover(onHover);
        });
    });

    settings.onDrawPersent(persets => {
        settings.offHover(onHover);
        disabled = false;
        pie.drawPersents(persets).then(() => {
            chartFactory = initStandartFactory();
            lines.forEach(line => line.drw(lineContext));
        });
    });

    function onHover(_: number[], hovers: number[]) {
        chartFactory.setHover(hovers);
        scaleChart(0, 20);
    }
}
