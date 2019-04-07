import { Column, Dict, Polyline, Range, TimeColumn, Viewport } from 'src/data/models';
import { drawConvas, map2 } from '../data/const';
import { ChangeKind, DataService } from '../data/service';
import { Line, ln } from './line';
import { plg } from './poligon';
import { pl } from './polyline';
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
    const polylines: Dict<Polyline> = {};


    const {
        jsonData: { columns, colors, types },
        viewport: { width, height },
        indexRange, timeRange, viewport,
        min,
    } = settings;

    function createItem(
        type: string,
        color: string,
        lineWidth: number,
    ): Polyline {
        return type === 'line' ? pl(color, lineWidth) : plg(color)
    }

    const devicePixelRatio = window.devicePixelRatio;
    const canvas = drawConvas(element, width, height + 20);
    const context = canvas.getContext('2d');

    context.textAlign = "center";
    context.lineJoin = 'bevel';
    context.lineCap = 'butt';

    const times = toTimes(context, settings);

    const lineCanvas = drawConvas(element, width - 10, height + 11, 'lines');
    const lineContext = lineCanvas.getContext('2d');
    lineContext.font = (10 * devicePixelRatio) + 'px Arial';
    lineContext.fillStyle = "#96a2aa";
    lineContext.strokeStyle = 'rgba(163, 173, 181, 0.3)';
    lineContext.lineWidth = devicePixelRatio;
    lineCanvas.style.zIndex = settings.zIndex;

    currentMax = settings.toMaxVisibleValue(indexRange);

    lines = drawLine(currentMax, 1);
    lines.forEach(line => line.drw(lineContext));

    const toCurrentMax = (index: number) => {
        return currentMax.length > 1 ? currentMax[index - 1] : currentMax[0];
    }

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            i, key, toCurrentMax(i), columns[i],
            columns[0], colors[key],
            indexRange, timeRange, viewport,
        );
    }

    toPopUp(element, context, settings, toCurrentMax);

    settings.onTimeRangeChange(kind => {
        drawCharts(kind);
    });

    let vision: null | number = null;
    settings.onVisibilityChange((key, value) => {
        polylines[key].set(value);
        drawCharts('visible');
    });

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

        scaleChart(0);

        redrawLines(deltaMax);
    }

    function scaleChart(index: number) {
        lastUpdateChart = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height - 20 * devicePixelRatio);

            for (let i = 1; i < columns.length; i++) {
                polylines[columns[i][0]].sc(
                    settings.adapter, context, i, min, toCurrentMax(i), columns[i], columns[0],
                    settings.indexRange, settings.timeRange, viewport,
                );
            }

            if (index === 10) return;

            currentMax = map2(
                currentMax, deltaMax,
                (c, d) => c + d,
            );
            return scaleChart(index + 1);
        });
    }


    function drawPolyline(
        index: number,
        key: string, max: number, values: Column,
        times: TimeColumn, color: string, indexRange: Range,
        timeRange: Range, viewport: Viewport
    ) {
        polylines[key] = settings.cr(color, 2);
        polylines[key].drw(settings.adapter, context, index, min, max, values, times, indexRange, timeRange, viewport);
    }

    function drawLine(max: number[], opacity: number): Line[] {
        const lines = [];

        const [max1, max2] = max;

        const dx1 = height / (max1 - min);
        const lastLine1 = Math.floor(max1 / 10) * 10;
        const dOneLine1 = (lastLine1 - min) / settings.lines;

        let lebel2 = null;
        let dOneLine2 = null;
        let color1 = null;
        let color2 = null;

        if (max2 != null) {
            const lastLine2 = Math.floor(max2 / 10) * 10;
            dOneLine2 = (lastLine2 - min) / settings.lines;
            lebel2 = min;
            color1 = colors[types['x'][0]];
            color2 = colors[types['x'][1]];
        }

        for (let label = min; label <= lastLine1; label += dOneLine1) {

            const x = height + 10 - (label - min) * dx1;

            lines.push(ln(label, lebel2, x * devicePixelRatio, (width - 10) * devicePixelRatio, opacity, color1, color2));
            if (lebel2 != null) {
                lebel2 += dOneLine2;
            }
        }

        return lines;
    }

    function redrawLines(deltaMax: number[]) {
        if (deltaMax.every(item => item === 0)) return;

        if (lastUpdateLine != null) cancelAnimationFrame(lastUpdateLine);

        lines.forEach(line => {
            line.hd();
            linesStock.push(line);
        });

        lines = drawLine(targetMax, 0);

        scaleLines(0);

    }

    function scaleLines(index: number) {
        lastUpdateLine = requestAnimationFrame(() => {

            lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

            const [max1] = currentMax;

            const dx1 = height / (max1 - min);

            function update(line: Line): boolean {
                return line.up(lineContext, (height + 10 - (line.vl - min) * dx1) * devicePixelRatio) != 0;
            }

            lines.forEach(update);
            linesStock = linesStock.filter(update);

            scaleLines(index + 1);
        });
    }
}
