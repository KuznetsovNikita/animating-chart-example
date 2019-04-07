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

interface RGB {
    r: number;
    g: number;
    b: number;
}

export function pl(
    color: string,
    lineWidth: number,
) {

    let action: 'none' | 'in' | 'out' = 'none';
    let opacity = 1;
    const rgb = hexToRgb(color);

    function hexToRgb(hex: string): RGB {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        };
    }

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
        context.lineWidth = lineWidth;
        context.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${opacity})`;

        const { start, end } = timeRange;
        const { height, width } = viewport;

        const dx = (height - 10) / (max - min);
        const dy = width / (end - start);

        let oldX = 0;
        let oldY = 0;
        context.beginPath();
        for (let i = indexRange.start; i <= indexRange.end; i++) {
            const y = Math.round(((times[i] as number) - start) * dy);
            const x = Math.round(height - (values[i] as number - min) * dx);
            if (x > oldX + 1 || x < oldX - 1 || y > oldY + 1 || y < oldY - 1) {
                context.lineTo(y, x);
                oldX = x;
                oldY = y;
            }
        }
        context.stroke();
    }

    return {
        drw,
        set,
        sc,
    };
}
