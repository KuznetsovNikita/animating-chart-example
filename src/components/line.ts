
export interface Line {
    drw: (context: CanvasRenderingContext2D) => void;
    hd: () => void;
    up: (context: CanvasRenderingContext2D, height: number) => number;
    vl: number;
}

export function ln(
    vl: number,
    height: number,
    width: number,
    opacity: number,
): Line {
    let action: 'none' | 'in' | 'out' = opacity === 0 ? 'in' : 'none';

    function hd() {
        action = 'out';
    }

    function drw(context: CanvasRenderingContext2D) {
        context.globalAlpha = opacity;
        context.fillText(vl.toString(), 0, height - 5);

        context.beginPath();
        context.lineTo(0, height);
        context.lineTo(width, height);
        context.stroke();
    }

    function up(context: CanvasRenderingContext2D, newHeight: number): number {
        if (action === 'in') {
            opacity = Math.min(1, opacity + 0.1);
            if (opacity === 1) action = 'none';
        }

        if (action === 'out') {
            opacity = Math.max(0, opacity - 0.1);
            if (opacity === 0) action = 'none';
        }

        if (opacity !== 0) {
            context.globalAlpha = opacity;
            context.fillText(vl.toString(), 0, newHeight - 5);

            context.beginPath();
            context.lineTo(0, newHeight);
            context.lineTo(width, newHeight);
            context.stroke();
        }

        return opacity;
    }

    return {
        drw,
        hd,
        up,
        vl,
    };
}
