import { Column, Dict, Range, TimeColumn, Viewport } from 'src/data/models';
import { drawConvas } from '../data/const';
import { ChangeKind, DataService } from '../data/service';
import { Line } from './line';
import { pl, Polyline } from './polyline';
import { toTimes } from './times';


export function toChart(
    element: HTMLDivElement,
    settings: DataService,
) {
    let currentMax: number;
    let targetMax: number;

    let deltaMax: number;

    let lastUpdateChart: number;


    let lines: Line[] = [];
    let linesStock: Line[] = [];
    const polylines: Dict<Polyline> = {};


    const {
        jsonData: { columns, colors },
        viewport: { width, height },
        indexRange, timeRange, viewport,
        min,
    } = settings;

    const padding = 20;
    const devicePixelRatio = window.devicePixelRatio;
    const canvas = drawConvas(element, width, height + padding);
    const context = canvas.getContext('2d');

    context.textAlign = "center";
    context.lineJoin = 'bevel';
    context.lineCap = 'butt';

    const times = toTimes(context, settings);

    currentMax = settings.toMaxVisibleValue(indexRange);

    //  toLine(gLines, settings.min, height, width, '');
    ///  lines = drawLine(currentMax);

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            key, currentMax, columns[i],
            columns[0], colors[key],
            indexRange, timeRange, viewport,
        );
    }

    // toPopUp(element, svg, settings, () => currentMax);

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
        deltaMax = (targetMax - currentMax) / 10;

        //   redrawLines(deltaMax);
        scale(0);
    }

    function scale(index: number) {
        lastUpdateChart = requestAnimationFrame(() => {
            context.clearRect(0, 0, canvas.width, canvas.height - 20 * devicePixelRatio);

            //  scaleLines();
            const {
                indexRange, timeRange,
            } = settings;
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
        times: TimeColumn, color: string, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) {
        polylines[key] = pl(color, 2);
        polylines[key].drw(context, min, max, values, times, indexRange, timeRange, viewport);
    }

    // function drawLine(max: number, className = ''): Line[] {
    //     const dx = (height - 5) / (max - min);

    //     let lastLine: number;
    //     if (max > 50) {
    //         lastLine = Math.floor((max - 20 / dx) / 10) * 10;
    //     }
    //     else {
    //         lastLine = max - max % 5;
    //         if (lastLine * dx > height - 10) {
    //             lastLine -= 5;
    //         }
    //     }
    //     const dOneLine = (lastLine - min) / settings.lines;

    //     const lines = [];
    //     for (let label = min + dOneLine; label <= lastLine; label += dOneLine) {
    //         const x = height - (label - min) * dx;

    //         lines.push(toLine(gLines, label, x, width, className));
    //     }
    //     return lines;
    // }

    // function redrawLines(deltaMax: number) {
    //     if (deltaMax !== 0) {

    //         lines.forEach(line => {
    //             line.g.classList.add('transparent');
    //             linesStock.push(line);
    //             setTimeout(() => {
    //                 linesStock = linesStock
    //                     .filter(item => item !== line);
    //                 line.destroy();
    //             }, 400);
    //         });

    //         const newLines = drawLine(targetMax, 'transparent');
    //         lines = newLines;

    //         requestAnimationFrame(() => {
    //             newLines.forEach(line => line.g.classList.remove('transparent'));
    //         });
    //     }
    // }

    // function scaleLines() {
    //     const dx = (height - 10) / (currentMax - min);

    //     lines.forEach(line => line.setHeight(height - dx * (line.value - min)));
    //     linesStock.forEach(line => line.setHeight(height - dx * (line.value - min)));
    // }
}
