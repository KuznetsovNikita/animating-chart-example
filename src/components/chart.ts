import { Column, Dict, Range, TimeColumn, Viewport } from 'src/data/models';
import { nsu } from '../data/const';
import { ChangeKind, DataService } from '../data/service';
import { Line, toLine } from './line';
import { Polyline, toPolyline } from './polyline';
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


    let lines: Line[] = [];
    let linesStock: Line[] = [];
    const polylines: Dict<Polyline> = {};

    const svg = document.createElementNS(nsu, "svg");
    const gLines = document.createElementNS(nsu, "g");
    const gDates = document.createElementNS(nsu, "g");

    element.appendChild(svg);
    svg.appendChild(gLines);
    svg.appendChild(gDates);

    const {
        jsonData: { columns, colors },
        viewport: { width, height },
        indexRange, timeRange, viewport,
        min,
    } = settings;

    svg.setAttribute('width', width.toString());
    svg.setAttribute('height', (height + 20).toString());

    const times = toTimes(gDates, settings);

    currentMax = settings.toMaxVisibleValue(indexRange);

    toLine(gLines, settings.min, height, width, '');
    lines = drawLine(currentMax);

    for (let i = 1; i < columns.length; i++) {
        const key = columns[i][0];
        drawPolyline(
            key, currentMax, columns[i],
            columns[0], colors[key],
            indexRange, timeRange, viewport,
        );
    }

    toPopUp(element, svg, settings, () => currentMax);

    settings.onTimeRangeChange(kind => {
        drawCharts(kind);
    });

    settings.onVisibilityChange((key) => {
        polylines[key].polyline.classList.toggle('transparent');
        drawCharts('visible');
    });

    function drawCharts(kind: ChangeKind) {
        if (lastUpdateChart) cancelAnimationFrame(lastUpdateChart);

        times.redrawTimes(kind);

        const max = settings.toMaxVisibleValue(
            settings.indexRange,
        );

        if (max === 0) return;

        targetMax = max;
        deltaMax = targetMax - currentMax;

        redrawLines(deltaMax);
        scale();
    }

    function scale() {
        lastUpdateChart = requestAnimationFrame(() => {

            scaleLines();
            const {
                indexRange, timeRange,
            } = settings;
            for (let i = 1; i < columns.length; i++) {
                polylines[columns[i][0]].setPoints(
                    min, currentMax, columns[i], columns[0],
                    indexRange, timeRange, viewport,
                );
            }

            if (currentMax === targetMax) return;

            const absMax = Math.abs(deltaMax);
            for (let i = 0; i < absMax * settings.animationSpeed; i++) {
                currentMax += deltaMax / absMax;
                if (currentMax === targetMax) break;

            }
            return scale();
        });
    }

    function drawPolyline(
        key: string, max: number, values: Column,
        times: TimeColumn, color: string, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) {
        const poliline = toPolyline(color, 'main-chart');

        svg.appendChild(poliline.polyline);
        poliline.setPoints(
            min, max, values, times, indexRange, timeRange, viewport,
        );

        polylines[key] = poliline;
    }

    function drawLine(max: number, className: string = ''): Line[] {
        const dx = (height - 5) / (max - min);

        let lastLine: number;
        if (max > 50) {
            lastLine = Math.floor((max - 20 / dx) / 10) * 10;
        }
        else {
            lastLine = max - max % 5
            if (lastLine * dx > height - 10) {
                lastLine -= 5;
            }
        }
        const dOneLine = (lastLine - min) / settings.lines;

        const lines = [];
        for (let label = min + dOneLine; label <= lastLine; label += dOneLine) {
            const x = height - (label - min) * dx;

            lines.push(toLine(gLines, label, x, width, className));
        }
        return lines;
    }

    function redrawLines(deltaMax: number) {
        if (deltaMax != 0) {

            lines.forEach(line => {
                line.g.classList.add('transparent');
                linesStock.push(line);
                setTimeout(() => {
                    linesStock = linesStock
                        .filter(item => item !== line);
                    line.destroy();
                }, 400);
            })

            const newLines = drawLine(targetMax, 'transparent');
            lines = newLines;

            requestAnimationFrame(() => {
                newLines.forEach(line => line.g.classList.remove('transparent'));
            });
        }
    }

    function scaleLines() {
        const dx = (height - 10) / (currentMax - min);

        lines.forEach(line => line.setHeight(height - dx * (line.value - min)));
        linesStock.forEach(line => line.setHeight(height - dx * (line.value - min)));
    }
}
