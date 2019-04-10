import { ScalesChartItem, UseDataFunction, Viewport } from 'src/data/models';

export function ar(
    color: string,
): ScalesChartItem {

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
        scales: number[],
    ) {
        context.fillStyle = color;
        context.beginPath();

        const pair: [number, number][] = [];
        use(
            index, viewport, min, max,
            (x, y, bx, by) => {
                context.lineTo(x, y);
                pair.push([bx, by]);
            },
            scales,
        );
        for (let i = pair.length - 1; i >= 0; i--) {
            const [x, y] = pair[i];
            context.lineTo(x, y);
        }
        context.closePath();
        context.fill();
    }

    return {
        drw,
    };
}
