import { MaxMin, Range } from 'src/data/models';
import { devicePixelRatio, drawConvas, map2MaxMin, mapMaxMin, scaleAngle, toAngle, toRadian } from '../data/const';
import { ChangeKind, DataService } from '../data/service';
import { Line, LineValue, ln } from './line';
import { toPiesItemOver } from './pie';
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

    let chartItems = settings.cr(settings.jsonData, 2, 1);
    chartItems.drw(settings.use, context, settings.indexRange, toCurrentMax, viewport);

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

    function rerenderAfterChangeFactory() {
        chartItems = settings.cr(settings.jsonData, 2, 1);
        chartItems.drw(settings.use, context, settings.indexRange, () => targetMax[0], viewport);
    }
    settings.onChangeFactory(rerenderAfterChangeFactory);

    settings.onZoom((_, opacity) => {
        const zoomingMax = settings.toMaxVisibleValue(settings.indexRange);
        context.clearRect(0, 0, canvas.width, canvas.height);
        chartItems.sc(
            settings.use, context, settings.indexRange,
            i => zoomingMax.length > 1 ? zoomingMax[i - 1] : zoomingMax[0],
            viewport, opacity,
        );
    });

    settings.onTimeRangeChange(kind => {
        chartItems.setRange(settings.indexRange);
        drawCharts(kind);
    });

    settings.onVisibilityChange(visible => {
        chartItems.set(visible);
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

            chartItems.sc(settings.use, context, settings.indexRange, toCurrentMax, viewport);

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
                dOneLine: (lastLine - min) / settings.lines,
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



    settings.onDrawPie((persets, endIndexRange) => {
        disabled = true;
        lineContext.clearRect(0, 0, lineCanvas.width, lineCanvas.height);
        drawPie(persets, endIndexRange);
    });

    settings.onDrawPersent(persets => {
        disabled = false;
        drawPersents(persets);
    });

    const { height, width } = viewport;
    const halfHeight = height / 2;
    const halfWidth = width / 2;
    const halfPi = Math.PI / 2;
    const dxPie = height / 100;

    function drawPie(persets: number[], endIndexRange: Range) {

        let round = 0;
        const dRound = halfWidth / 18

        let point = 0;
        const dPoint = width / 2 / 16;

        let alfa = 60 / 360;
        const dAlfa = (1 - alfa) / 16;

        const renderFrame = (index: number) => {
            requestAnimationFrame(() => {

                if (index === 19) {
                    chartItems = toPiesItemOver(settings.jsonData, settings.visibility);
                    chartItems.drw(settings.use, context, endIndexRange, toCurrentMax, viewport);
                    return;
                }

                context.clearRect(0, 0, canvas.width, canvas.height);
                context.save();
                clip(round);

                if (index === 0) {
                    renderFirstPieFrame(persets);
                }
                else if (index === 1) {
                    renderSecondPieFrame(persets);
                }
                else if (index <= 18) {
                    // 16 - frames
                    renderTransformPieFrame(persets, alfa, point)
                    alfa += dAlfa;
                    point += dPoint;
                }
                context.restore();

                round += dRound;
                renderFrame(index + 1);
            })
        }
        renderFrame(0);
    }

    function drawPersents(persets: number[]) {

        let round = halfWidth;
        const dRound = -halfWidth / 18

        let point = halfWidth;
        const dPoint = -halfWidth / 16;

        let alfa = 1;
        const dAlfa = -(1 - 60 / 360) / 16;

        const renderFrame = (index: number) => {
            requestAnimationFrame(() => {
                context.clearRect(0, 0, canvas.width, canvas.height);
                context.save();
                clip(round);

                if (index === 0) {
                    renderFirstPieFrame(persets);
                }
                else if (index === 1) {
                    renderSecondPieFrame(persets);
                }
                else if (index <= 18) {
                    // 16 - frames
                    renderTransformPieFrame(persets, alfa, point)
                    alfa += dAlfa;
                    point += dPoint;
                }
                context.restore();

                round += dRound;

                if (index === 0) {
                    chartItems = settings.cr(settings.jsonData, 2, 1);
                    chartItems.drw(settings.use, context, settings.indexRange, toCurrentMax, viewport);
                    lines.forEach(line => line.drw(lineContext));
                    return;
                }
                renderFrame(index - 1);
            })
        }
        renderFrame(18);
    }

    function clip(round: number) {
        context.beginPath();
        context.moveTo(width / 2 * devicePixelRatio, 0);
        if (round < halfHeight) {

            context.lineTo((width - round) * devicePixelRatio, 0);

            context.arc((width - round) * devicePixelRatio, round * devicePixelRatio, round * devicePixelRatio, -halfPi, 0);

            context.lineTo(width * devicePixelRatio, (height - round) * devicePixelRatio);
            context.arc((width - round) * devicePixelRatio, (height - round) * devicePixelRatio, round * devicePixelRatio, 0, halfPi);

            context.lineTo(round * devicePixelRatio, height * devicePixelRatio);
            context.arc(round * devicePixelRatio, (height - round) * devicePixelRatio, round * devicePixelRatio, halfPi, halfPi * 2);

            context.lineTo(0, round * devicePixelRatio);
            context.arc(round * devicePixelRatio, round * devicePixelRatio, round * devicePixelRatio, halfPi * 2, halfPi * 3);
        }
        else {
            context.arc((width - round) * devicePixelRatio, halfHeight * devicePixelRatio, halfHeight * devicePixelRatio, -halfPi, halfPi);
            context.lineTo(round * devicePixelRatio, height * devicePixelRatio);
            context.arc(round * devicePixelRatio, halfHeight * devicePixelRatio, halfHeight * devicePixelRatio, halfPi, halfPi * 3);
        }

        context.closePath();
        context.clip();
    }

    function renderFirstPieFrame(persets: number[]) {
        persets.reduceRight((last, item, i) => {

            context.fillStyle = colors[columns[i + 1][0]];
            const current = last + item;

            context.beginPath();
            context.moveTo(0, (height - last * dxPie) * devicePixelRatio);
            context.lineTo(0, (height - current * dxPie) * devicePixelRatio);
            context.lineTo(width * devicePixelRatio, (height - current * dxPie) * devicePixelRatio);
            context.lineTo(width * devicePixelRatio, (height - last * dxPie) * devicePixelRatio);
            context.closePath();
            context.fill();

            return last + item;
        }, 0);
    }

    function renderSecondPieFrame(persets: number[]) {
        persets.reduceRight((last, item, i) => {

            context.fillStyle = colors[columns[i + 1][0]];
            const current = last + item;

            context.beginPath();
            context.moveTo(0, (height - last * dxPie) * devicePixelRatio);
            context.lineTo(0, (height - current * dxPie) * devicePixelRatio);
            if (i === 0) {
                context.lineTo(width * devicePixelRatio, 0);
            }

            context.lineTo(width * devicePixelRatio, (height / 2) * devicePixelRatio);

            if (i === persets.length - 1) {
                context.lineTo(width * devicePixelRatio, height * devicePixelRatio);
            }
            context.closePath();
            context.fill();

            return last + item;
        }, 0);
    }

    function renderTransformPieFrame(persets: number[], alfa: number, point: number) {
        persets.reduceRight((last, item, i) => {
            context.fillStyle = colors[columns[i + 1][0]];
            const current = last + item;

            const x = (width - point) * devicePixelRatio;
            const y = (height / 2) * devicePixelRatio;

            context.beginPath();
            context.moveTo(x, y); // point
            context.arc(x, y, width * 2 * devicePixelRatio, toAngle(alfa, last), toAngle(alfa, current));
            context.closePath();
            context.fill();

            const other = toRadian(90 + 60 + (360 + scaleAngle(alfa, 100)) / 2);
            if (i === persets.length - 1 && alfa != 1) {
                context.beginPath();
                context.moveTo(x, y);
                context.arc(x, y, width * devicePixelRatio, other, toAngle(alfa, 0));
                context.closePath();
                context.fill();
            }
            if (i === 0 && alfa != 1) {
                context.beginPath();
                context.moveTo(x, y);
                context.arc(x, y, width * devicePixelRatio, toAngle(alfa, current), other);
                context.closePath();
                context.fill();

            }
            return last + item;
        }, 0);
    }
}

