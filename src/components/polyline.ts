import { Column, Range, TimeColumn, Viewport } from '../data/models';

export interface Polyline {
    drw: (
        context: CanvasRenderingContext2D,
        min: number, max: number, values: Column, times: TimeColumn,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) => void;
    set: (value: boolean) => void;
    sc: (
        context: CanvasRenderingContext2D,
        min: number, max: number, values: Column,
        times: TimeColumn, indexRange: Range,
        timeRange: Range, viewport: Viewport,
    ) => void;
}

export function pl(
    color: string,
    lineWidth: number,
) {
    const devicePixelRatio = window.devicePixelRatio;
    let action: 'none' | 'in' | 'out' = 'none';
    let opacity = 1;

    function set(value: boolean) {
        action = value ? 'in' : 'out';
    }

    function sc(
        context: CanvasRenderingContext2D,
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
                context, min, max, values, times, indexRange, timeRange, viewport,
            );
        }
    }

    function drw(
        context: CanvasRenderingContext2D,
        min: number, max: number, values: Column, times: TimeColumn,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) {
        context.lineWidth = lineWidth * devicePixelRatio;
        context.globalAlpha = opacity;
        context.strokeStyle = color;

        const { start, end } = timeRange;
        const { height, width } = viewport;

        const dx = (height - 10) / (max - min);
        const dy = width / (end - start);

        context.beginPath();
        for (let i = indexRange.start; i <= indexRange.end; i++) {
            context.lineTo(
                ((times[i] as number) - start) * dy * devicePixelRatio,
                (height - (values[i] as number - min) * dx) * devicePixelRatio,
            );
        }
        context.stroke();
    }

    return {
        drw,
        set,
        sc,
    };
}
