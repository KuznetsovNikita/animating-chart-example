import { JsonData } from 'src/data/service';
import { ChartsItem, UseDataFunction, Viewport } from '../data/models';

interface Poligon {
    draw: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
        scale: number[],
    ) => void;
}

export function plgs(jsonData: JsonData): ChartsItem {
    const items: Poligon[] = [];
    const scales: number[] = [];
    const actions: ('none' | 'in' | 'out')[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        const key = jsonData.columns[i][0];
        items.push(poligon(jsonData.colors[key]));
        scales.push(1);
        actions.push('none');
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        min: number, toMax: (index: number) => number, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.draw(
                use, context, index + 1, min,
                toMax(index + 1), viewport, scales,
            );
        });
    }

    function set(key: string, value: boolean) {
        jsonData.columns.forEach((column, index) => {
            if (column[0] === key) {
                actions[index - 1] = value ? 'in' : 'out';
            }
        });
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        min: number, toMax: (index: number) => number, viewport: Viewport,
    ) {
        actions.forEach((action, index) => {
            if (action === 'in') {
                scales[index] = Math.min(1, scales[index] + 0.1);
                if (scales[index] === 1) action = 'none';
            }

            if (action === 'out') {
                scales[index] = Math.max(0, scales[index] - 0.1);
                if (scales[index] === 0) action = 'none';
            }
        });
        items.forEach((item, index) => {
            if (scales[index] !== 0) {
                item.draw(use, context, index + 1, min, toMax(index + 1), viewport, scales);
            }
        });
    }

    function poligon(
        color: string,
    ) {

        function draw(
            use: UseDataFunction, context: CanvasRenderingContext2D,
            index: number, min: number, max: number, viewport: Viewport,
            scales: number[],
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
                scales,
            );
        }

        return {
            draw,
        };
    }

    return {
        drw,
        set,
        sc,
    };
}
