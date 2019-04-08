import { Adapter, Column, Polyline, Range, TimeColumn, Viewport } from '../data/models';


export function plg(
    color: string,
): Polyline {
    let scale = 1;

    function set(value: boolean) {
        scale = value ? 1 : 0;
    }

    function sc(
        adapter: Adapter,
        context: CanvasRenderingContext2D,
        index: number,
        min: number, max: number, values: Column,
        times: TimeColumn, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) {
        if (scale !== 0) {
            drw(
                adapter, context, index, min, max, values, times, indexRange, timeRange, viewport,
            );
        }
        return scale;
    }

    function drw(
        adapter: Adapter, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, values: Column, times: TimeColumn,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) {
        context.fillStyle = color;
        adapter.use(
            index, indexRange, timeRange, viewport, min, max,
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
