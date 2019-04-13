import { ScalesChartItem, UseDataFunction, Viewport } from '../../data/models';

export function toPoligonFactoryOver(
    color: string,
): ScalesChartItem {

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
        scales: number[], opacity = 1,
    ) {
        context.fillStyle = color;
        context.globalAlpha = opacity;
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
        drw,
    };
}
