
export interface Line {
    drw: (context: CanvasRenderingContext2D) => void;
    hd: () => void;
    up: (context: CanvasRenderingContext2D, height: number) => number;
    vl: LineValue[];
}
export interface LineValue {
    dx: number;
    lastLine: number;
    dOneLine: number;
    color: string;
    isShow: boolean;
    label: number;
    min: number;
}

export function ln(
    vl: LineValue[],
    height: number,
    width: number,
    opacity: number,
): Line {
    let action: 'none' | 'in' | 'out' = opacity === 0 ? 'in' : 'none';

    function hd() {
        action = 'out';
    }

    function draw(context: CanvasRenderingContext2D, h: number) {
        const [one, two] = vl;
        context.globalAlpha = opacity;

        if (two != null) context.fillStyle = one.color;
        if (one.isShow || two == null) {
            context.textAlign = 'left';
            context.fillText(one.label.toString(), 0, h - 5);
        }

        if (two != null && two.isShow) {
            context.fillStyle = two.color;
            context.textAlign = 'right';
            context.fillText(two.label.toString(), width, h - 5);
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
