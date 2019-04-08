import { ChartItem, UseDataFunction, Viewport } from '../data/models';


export function plg(
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
        return scale;
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
    ) {
        context.fillStyle = color;
        use(
            index, viewport, min, max,
            (x, y, bx, by) => {
                context.beginPath();
                context.moveTo(bx, by);
                context.lineTo(bx, y);
                context.lineTo(x, y);
                context.lineTo(x, by);
                context.closePath();
                context.fill();
            },
        );
    }

    return {
        drw,
        set,
        sc,
    };
}
