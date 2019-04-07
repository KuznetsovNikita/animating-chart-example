import { Column, Dict, Range, TimeColumn, Viewport } from 'src/data/models';
import { drawConvas } from '../data/const';
import { ChangeKind, DataService } from '../data/service';
import { Line, ln } from './line';
import { pl, Polyline } from './polyline';
import { toPopUp } from './pop-up';
import { toTimes } from './times';


export function toChart(
    element: HTMLDivElement,
    settings: DataService,
) {
    let currentMax: number;
    let targetMax: number;

    let deltaMax: number;

    let lastUpdateChart: number;
    let lastUpdateLine: number;

    let lines: Line[] = [];
    let linesStock: Line[] = [];
    const polylines: Dict<Polyline> = {};


    const {
        jsonData: { columns, colors },
        viewport: { width, height },
        indexRange, timeRange, viewport,
        min,
    } = settings;

    const devicePixelRatio = window.devicePixelRatio;
    const canvas = drawConvas(element, width, height + 20);
    const context = canvas.getContext('2d');

    context.textAlign = "center";
    context.lineJoin = 'bevel';
    context.lineCap = 'butt';

    const times = toTimes(context, settings);

    const lineCanvas = drawConvas(element, width - 10, height + 1, 'lines');
    const lineContext = lineCanvas.getContext('2d');
    lineContext.font = (10 * devicePixelRatio) + 'px Arial';
    lineContext.fillStyle = "#96a2aa";
    lineContext.strokeStyle = 'rgba(163, 173, 181, 0.3)';
    lineContext.lineWidth = devicePixelRatio;

    lineCanvas.style.zIndex = '-1';

    currentMax = settings.toMaxVisibleValue(indexRange);

    lines = drawLine(currentMax, 1);
    lines.forEach(line => line.drw(lineContext));

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            key, currentMax, columns[i],
            columns[0], colors[key],
            indexRange, timeRange, viewport,
        );
    }

    toPopUp(element, context, settings, () => currentMax);

    settings.onTimeRangeChange(kind => {
        drawCharts(kind);
    });

    settings.onVisibilityChange((key, value) => {
        polylines[key].set(value);
        drawCharts('visible');
    });

    function drawCharts(kind: ChangeKind) {
        if (lastUpdateChart) cancelAnimationFrame(lastUpdateChart);

        times.rdt(kind);

        const max = settings.toMaxVisibleValue(
            settings.indexRange,
        );



        targetMax = max;
        deltaMax = Math.round((targetMax - currentMax) / 10);

        scaleChart(0);

        redrawLines(deltaMax);
    }

    function scaleChart(index: number) {
        lastUpdateChart = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height - 20 * devicePixelRatio);

            for (let i = 1; i < columns.length; i++) {
                polylines[columns[i][0]].sc(
                    context, min, currentMax, columns[i], columns[0],
                    settings.indexRange, settings.timeRange, viewport,
                );
            }

            if (index === 10) return;
            currentMax += deltaMax;
            return scaleChart(index + 1);
        });
    }


    function drawPolyline(
        key: string, max: number, values: Column,
        times: TimeColumn, color: string, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) {
        polylines[key] = pl(color, 2);
        polylines[key].drw(context, min, max, values, times, indexRange, timeRange, viewport);
    }

    function drawLine(max: number, opacity: number): Line[] {
        const dx = (height - 5) / (max - min);

        let lastLine: number;
        if (max > 50) {
            lastLine = Math.floor((max - 20 / dx) / 10) * 10;
        }
        else {
            lastLine = max - max % 5;
            if (lastLine * dx > height - 10) {
                lastLine -= 5;
            }
        }
        const dOneLine = (lastLine - min) / settings.lines;

        const lines = [];
        for (let label = min; label <= lastLine; label += dOneLine) {
            const x = height - (label - min) * dx;

            lines.push(ln(label, x * devicePixelRatio, (width - 10) * devicePixelRatio, opacity));
        }
        return lines;
    }

    function redrawLines(deltaMax: number) {
        if (deltaMax !== 0) {

            if (lastUpdateLine != null) cancelAnimationFrame(lastUpdateLine);

            lines.forEach(line => {
                line.hd();
                linesStock.push(line);
            });

            lines = drawLine(targetMax, 0);

            scaleLines(0);
        }
    }

    function scaleLines(index: number) {
        lastUpdateLine = requestAnimationFrame(() => {

            lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);

            const dx = (height - 10) / (currentMax - min);

            lines.forEach(line => line.up(lineContext, (height - dx * (line.vl - min)) * devicePixelRatio));
            linesStock = linesStock.filter(
                line => line.up(lineContext, (height - dx * (line.vl - min)) * devicePixelRatio)
            );

            scaleLines(index + 1);
        });
    }
}
