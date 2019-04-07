
export interface Line {
    drw: (context: CanvasRenderingContext2D) => void;
    hd: () => void;
    up: (context: CanvasRenderingContext2D, height: number) => number;
    vl: number;
}

export function ln(
    vl: number,
    value2: number | null,
    height: number,
    width: number,
    opacity: number,
    color1: string | null,
    color2: string | null,
): Line {
    let action: 'none' | 'in' | 'out' = opacity === 0 ? 'in' : 'none';

    function hd() {
        action = 'out';
    }

    function draw(context: CanvasRenderingContext2D, h: number) {
        context.globalAlpha = opacity;
        context.textAlign = 'left';
        if (color1) context.fillStyle = color1;
        context.fillText(vl.toString(), 0, h - 5);

        if (value2 !== null) {
            context.fillStyle = color2;
            context.textAlign = 'right';
            context.fillText(value2.toString(), width, h - 5);
        }

        context.beginPath();
        context.lineTo(0, h);
        context.lineTo(width, h);
        context.stroke();
    }

    function drw(context: CanvasRenderingContext2D) {
        draw(context, height);
    }

    function up(context: CanvasRenderingContext2D, h: number): number {
        if (action === 'in') {
            opacity = Math.min(1, opacity + 0.1);
            if (opacity === 1) action = 'none';
        }

        if (action === 'out') {
            opacity = Math.max(0, opacity - 0.1);
            if (opacity === 0) action = 'none';
        }

        if (opacity !== 0) {
            draw(context, h);
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
