
import { devicePixelRatio, map2, toPieAngle } from '../data/const';
import { ChartsItem, MaxMin, Range, UseDataFunction, Viewport } from '../data/models';
import { JsonData, recountPercent } from '../data/service';


export function toPiesItemOver(jsonData: JsonData, vision: boolean[]): ChartsItem {
    const scales: number[] = [];
    const actions: ('none' | 'in' | 'out')[] = [];

    let currentPersents: number[];
    let targetPersents: number[];
    let deltas: number[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        scales.push(vision[i] ? 1 : 0);
        actions.push('none');
        deltas.push(0);
    }

    function drw(
        _use: UseDataFunction, context: CanvasRenderingContext2D, indexRange: Range,
        _toMax: (index: number) => MaxMin, viewport: Viewport,
        _opacity?: number,
    ) {
        currentPersents = recountPercent(jsonData, indexRange.start, scales);
        draw(context, viewport);
    }

    function set(visible: boolean[]) {
        for (let i = 1; i < visible.length; i++) {
            actions[i - 1] = visible[i] ? 'in' : 'out';
        }
    }

    function setRange(indexRange: Range) {
        targetPersents = recountPercent(jsonData, indexRange.start, scales);

        deltas = map2(
            targetPersents, currentPersents,
            (target, current) => (target - current) / 10,
        );
    }

    function sc(
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
        else {
            currentPersents = map2(
                currentPersents, deltas,
                (current, delta) => current + delta,
            );
        }

        draw(context, viewport);
    }


    function draw(context: CanvasRenderingContext2D, viewport: Viewport) {

        const x = viewport.width / 2 * devicePixelRatio;
        const y = viewport.height / 2 * devicePixelRatio;

        context.font = (18 * devicePixelRatio) + 'px Arial';

        currentPersents
            .reduceRight((last, item, i) => {
                context.fillStyle = jsonData.colors[jsonData.columns[i + 1][0]];
                const current = last + item;

                context.beginPath();
                context.moveTo(x, y);
                context.arc(x, y, y, toPieAngle(last), toPieAngle(current));
                context.closePath();
                context.fill();

                return current;
            }, 0);

        context.fillStyle = 'white';
        currentPersents
            .reduceRight((last, item) => {
                const value = Math.round(item);
                if (value) {
                    const middle = toPieAngle(last + item / 2);
                    context.fillText(
                        `${value}%`,
                        x + Math.cos(middle) * y / 4 * 3,
                        y + Math.sin(middle) * y / 4 * 3 + 12,
                    );
                }
                return last + item;
            }, 0);
    }

    return {
        drw,
        set,
        sc,
        setRange,
    };
}
