
import { devicePixelRatio, toPieAngle } from '../data/const';
import { ScalesChartItem, UseDataFunction, Viewport } from '../data/models';

export function pie(
    color: string,
): ScalesChartItem {

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
        scales: number[],
    ) {
        context.fillStyle = color;
        context.beginPath();
        use(
            index, viewport, min, max,
            (last, current, x, y) => {
                context.moveTo(x * devicePixelRatio, y * devicePixelRatio);
                context.arc(
                    x * devicePixelRatio,
                    y * devicePixelRatio,
                    y * devicePixelRatio,
                    toPieAngle(last), toPieAngle(current),
                );
            },
            scales,
        );
        context.closePath();
        context.fill();
    }

    return {
        drw,
    };
}

