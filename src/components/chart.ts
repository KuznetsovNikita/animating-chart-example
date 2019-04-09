import { drawConvas, map2 } from '../data/const';
import { ChangeKind, DataService } from '../data/service';
import { Line, ln } from './line';
import { toPopUp } from './pop-up';
import { toTimes } from './times';


export function toChart(
    element: HTMLDivElement,
    settings: DataService,
) {
    let currentMax: number[];
    let targetMax: number[];

    let deltaMax: number[];

    let lastUpdateChart: number;
    let lastUpdateLine: number;

    let lines: Line[] = [];
    let linesStock: Line[] = [];

    const {
        jsonData: { columns, colors },
        viewport,
        min,
    } = settings;

    const devicePixelRatio = window.devicePixelRatio;
    const canvas = drawConvas(element, viewport.width, viewport.height + 20);
    const context = canvas.getContext('2d');

    context.textAlign = "center";
    context.lineJoin = 'bevel';
    context.lineCap = 'butt';

    const times = toTimes(context, settings);

    const lineCanvas = drawConvas(element, viewport.width - 10, viewport.height + 11, 'lines');
    const lineContext = lineCanvas.getContext('2d');
    lineContext.font = (10 * devicePixelRatio) + 'px Arial';

    lineContext.fillStyle = settings.style.text;
    lineContext.strokeStyle = settings.style.line;

    settings.onChangeStyle(() => {
        lineContext.fillStyle = settings.style.text;
        lineContext.strokeStyle = settings.style.line;
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

    const chartItems = settings.cr(settings.jsonData, 2);
    chartItems.drw(settings.use, context, min, toCurrentMax, viewport);

    toPopUp(element, settings, toCurrentMax);

    settings.onZoomStart((data, endIndexRanage) => {
        const frames = 20;
        targetMax = settings.adapter.toMax(data, settings.visibility, endIndexRanage);
        deltaMax = map2(
            targetMax, currentMax,
            (t, c) => (t - c) / frames
        );
        redrawLines(deltaMax, frames);
        countMaxValue(frames);
    });

    settings.onZoom(() => {
        const zoomingMax = settings.toMaxVisibleValue(settings.indexRange);
        context.clearRect(0, 0, canvas.width, canvas.height - 19 * devicePixelRatio);
        chartItems.sc(
            settings.use, context, min,
            i => zoomingMax.length > 1 ? zoomingMax[i - 1] : zoomingMax[0],
            viewport,
        );
    });

    settings.onTimeRangeChange(kind => {
        drawCharts(kind);
    });

    settings.onVisibilityChange((key, value) => {
        chartItems.set(key, value);
        drawCharts('visible');
    });

    let lastCountUpdate = null
    function countMaxValue(count: number) {
        if (lastCountUpdate != null) cancelAnimationFrame(lastCountUpdate);
        incrementValue(1, count)
    }

    function incrementValue(index, count) {
        lastCountUpdate = requestAnimationFrame(() => {

            currentMax = map2(
                currentMax, deltaMax,
                (c, d) => c + d,
            );

            if (index === count) return;
            incrementValue(index + 1, count);
        })
    }

    function drawCharts(kind: ChangeKind) {
        if (lastUpdateChart) {
            cancelAnimationFrame(lastUpdateChart);
            currentMax = currentMax.map(max => Math.floor(max / 10) * 10); // round current max, if animation wasn't finished
        }

        times.rdt(kind);

        targetMax = settings.toMaxVisibleValue(
            settings.indexRange,
        );
        deltaMax = map2(
            targetMax, currentMax,
            (t, c) => Math.round((t - c) / 10)
        );

        scaleChart(0, 10);
        redrawLines(deltaMax, 10);
        countMaxValue(10);
    }

    function scaleChart(index: number, frames: number) {
        lastUpdateChart = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height - 20 * devicePixelRatio);

            chartItems.sc(settings.use, context, min, toCurrentMax, viewport);

            if (index === frames) return;
            return scaleChart(index + 1, frames);
        });
    }

    function drawLine(max: number[], opacity: number): Line[] {

        const lines = [];

        let items = max.map((maxValue, i) => {
            const lastLine = Math.floor(maxValue / 10) * 10;
            return {
                dx: viewport.height / (maxValue - min),
                lastLine,
                dOneLine: (lastLine - min) / settings.lines,
                color: colors[columns[i + 1][0]],
                isShow: settings.visibility[columns[i + 1][0]],
                label: min,
            };
        });

        do {
            const x = viewport.height + 10 - (items[0].label - min) * items[0].dx;
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

    function redrawLines(deltaMax: number[], frames: number) {
        if (deltaMax.every(item => item === 0)) return;

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

            const dx1 = viewport.height / (currentMax[0] - min);

            function update(line: Line): boolean {
                return line.up(lineContext, (viewport.height + 10 - (line.vl[0].label - min) * dx1) * devicePixelRatio) != 0;
            }

            lines.forEach(update);
            linesStock = linesStock.filter(update);
            if (index >= frames) return;

            scaleLines(index + 1, frames);
        });
    }
}
