import { Adapter, Column, Polyline, Range, TimeColumn, Viewport } from '../data/models';


export function pl(
    color: string,
    lineWidth: number,
): Polyline {
    const devicePixelRatio = window.devicePixelRatio;
    let action: 'none' | 'in' | 'out' = 'none';
    let opacity = 1;

    function set(value: boolean) {
        action = value ? 'in' : 'out';
    }

    function sc(
        adapter: Adapter,
        context: CanvasRenderingContext2D,
        index: number,
        min: number, max: number, values: Column,
        times: TimeColumn, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) {
        if (action === 'in') {
            opacity = Math.min(1, opacity + 0.1);
            if (opacity === 1) action = 'none';
        }

        if (action === 'out') {
            opacity = Math.max(0, opacity - 0.1);
            if (opacity === 0) action = 'none';
        }

        if (opacity !== 0) {
            drw(
                adapter, context, index, min, max, values, times, indexRange, timeRange, viewport,
            );
        }
    }

    function drw(
        adapter: Adapter,
        context: CanvasRenderingContext2D,
        index: number,
        min: number, max: number, values: Column, times: TimeColumn,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) {
        context.lineWidth = lineWidth * devicePixelRatio;
        context.globalAlpha = opacity;
        context.strokeStyle = color;

        context.beginPath();
        adapter.use(
            index, indexRange, timeRange, viewport, min, max,
            (x, y) => context.lineTo(x, y),
        );
        context.stroke();
    }

    return {
        drw,
        set,
        sc,
    };
}
