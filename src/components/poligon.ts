import { Adapter, Column, Polyline, Range, TimeColumn, Viewport } from '../data/models';


export function plg(
    color: string,
): Polyline {
    const devicePixelRatio = window.devicePixelRatio;
    let action: 'none' | 'in' | 'out' = 'none';
    let scale = 1;

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
            scale = Math.min(1, scale + 0.1);
            if (scale === 1) action = 'none';
        }

        if (action === 'out') {
            scale = Math.max(0, scale - 0.1);
            if (scale === 0) action = 'none';
        }

        if (scale !== 0) {
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
        )
        const { start, end } = timeRange;
        const { height, width } = viewport;

        const dy = height / (max - min);
        const dx = width / (end - start);

        let oldX = 0;
        for (let i = indexRange.start; i <= indexRange.end; i++) {
            const x = ((times[i] as number) - start) * dx * devicePixelRatio * scale;
            const y = (height - (values[i] as number - min) * dy) * devicePixelRatio;
            context.beginPath();
            context.moveTo(oldX, height * devicePixelRatio);
            context.lineTo(oldX, y);
            context.lineTo(x, y);
            context.lineTo(x, height * devicePixelRatio);
            context.closePath();
            context.fill();

            oldX = x;
        }
    }

    return {
        drw,
        set,
        sc,
    };
}
