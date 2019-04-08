import { ChartItem, UseDataFunction, Viewport } from 'src/data/models';

export function ar(
    color: string,
): ChartItem {
    let scale = 1;

    function set(value: boolean) {
        scale = value ? 1 : 0;
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
    ) {
        if (scale !== 0) {
            drw(
                use, context, index, min, max, viewport,
            );
        }
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
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
        set,
        sc,
    };
}