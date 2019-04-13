
import { recountPercent } from '../../data/adapters';
import { devicePixelRatio, map2, roundPercentageTotals, toPieAngle } from '../../data/common';
import { ChartItemsFactory, JsonData, MaxMin, Range, UseDataFunction, Viewport } from '../../data/models';


export function toPieFactory(jsonData: JsonData, vision: boolean[]): ChartItemsFactory {
    const scales: number[] = [];
    const actions: ('none' | 'in' | 'out')[] = [];

    let currentPersents: number[];
    let targetPersents: number[];
    let deltas: number[] = [];

    let currentHovers: number[] = [];
    let hoversDeltas: number[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        scales.push(vision[i] ? 1 : 0);
        actions.push('none');
        deltas.push(0);
        currentHovers.push(0);
        hoversDeltas.push(0);
    }

    function draw(
        _use: UseDataFunction, context: CanvasRenderingContext2D, indexRange: Range,
        _toMax: (index: number) => MaxMin, viewport: Viewport,
        _opacity?: number,
    ) {
        currentPersents = recountPercent(jsonData, indexRange.start, scales);
        drawItems(context, viewport);
    }

    function setVisible(visible: boolean[]) {
        cleanUpHover();
        for (let i = 1; i < visible.length; i++) {
            actions[i - 1] = visible[i] ? 'in' : 'out';
        }
    }

    function setRange(indexRange: Range) {
        cleanUpHover();
        targetPersents = recountPercent(jsonData, indexRange.start, scales);

        deltas = map2(
            targetPersents, currentPersents,
            (target, current) => (target - current) / 10,
        );
    }

    function scale(
        _use: UseDataFunction, context: CanvasRenderingContext2D, indexRange: Range,
        _toMax: Function, viewport: Viewport, _opacity?: number,
    ) {
        if (actions.some(a => a !== 'none')) {

            actions.forEach((action, index) => {
                if (action === 'in') {
                    scales[index] = Math.min(1, scales[index] + 0.1);
                    if (scales[index] === 1) actions[index] = 'none';
                }

                if (action === 'out') {
                    scales[index] = Math.max(0, scales[index] - 0.1);
                    if (scales[index] === 0) actions[index] = 'none';
                }
            });

            currentPersents = recountPercent(jsonData, indexRange.start, scales);
        }
        else if (deltas.some(delta => delta !== 0)) {
            currentPersents = map2(
                currentPersents, deltas,
                (current, delta) => current + delta,
            );
        }
        else {
            currentHovers = map2(
                currentHovers, hoversDeltas,
                (current, delta, index) => {
                    const result = Math.min(Math.max(current + delta, 0), 1);
                    if (result === 0 || result === 1) {
                        hoversDeltas[index] = 0;
                    }
                    return result;
                },
            );
        }

        drawItems(context, viewport);
    }



    function drawItems(context: CanvasRenderingContext2D, viewport: Viewport) {

        const hoverShift = viewport.height * 0.02 * devicePixelRatio;
        const x = viewport.width / 2 * devicePixelRatio;
        const y = viewport.height / 2 * devicePixelRatio;

        context.font = (18 * devicePixelRatio) + 'px Arial';

        currentPersents
            .reduceRight((last, item, i) => {
                context.fillStyle = jsonData.colors[jsonData.columns[i + 1][0]];
                const current = last + item;

                const middle = toPieAngle(last + item / 2);
                const pointX = x + Math.cos(middle) * hoverShift * currentHovers[i];
                const pointY = y + Math.sin(middle) * hoverShift * currentHovers[i];

                context.beginPath();
                context.moveTo(pointX, pointY);
                context.arc(pointX, pointY, y - hoverShift, toPieAngle(last), toPieAngle(current));
                context.closePath();
                context.fill();

                return current;
            }, 0);

        context.fillStyle = 'white';

        const roundedPersents = roundPercentageTotals(currentPersents);
        currentPersents
            .reduceRight((last, item, i) => {
                if (item) {
                    const middle = toPieAngle(last + item / 2);
                    context.fillText(
                        `${roundedPersents[i]}%`,
                        x + Math.cos(middle) * (y / 3 * 2 + hoverShift * currentHovers[i]),
                        y + Math.sin(middle) * (y / 3 * 2 + hoverShift * currentHovers[i]) + 12,
                    );
                }
                return last + item;
            }, 0);
    }

    function cleanUpHover() {
        currentHovers = currentHovers.map(() => 0);
        hoversDeltas = hoversDeltas.map(() => 0);
    }

    function setHover(hovers: number[]) {
        deltas = deltas.map(() => 0);
        hovers.forEach((hover, i) => {
            if (hover !== currentHovers[i]) {
                hoversDeltas[i] = hover > 0 ? 0.05 : -0.05;
            }
        });
    }

    return {
        draw,
        scale,
        setVisible,
        setRange,
        setHover,
    };
}
