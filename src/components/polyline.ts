import { devicePixelRatio } from '../data/const';
import { ChartItem, UseDataFunction, Viewport } from '../data/models';

export function pl(
    color: string,
    lineWidth: number,
    opacity?: number,
): ChartItem {
    let action: 'none' | 'in' | 'out' = opacity === 1 ? 'none' : 'in';
    // let opacity = 1;

    function set(value: boolean) {
        action = value ? 'in' : 'out';
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
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
            drw(use, context, index, min, max, viewport);
        }

    }


    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
    ) {
        context.lineWidth = lineWidth * devicePixelRatio;
        context.globalAlpha = opacity;
        context.strokeStyle = color;

        context.beginPath();
        use(
            index, viewport, min, max,
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
