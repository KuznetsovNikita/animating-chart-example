import { scaleAngle, toAngle, toRadian } from '../data/common';
import { JsonData, Range, Viewport } from '../data/models';

export function pieAnimator(
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    viewport: Viewport,
    jsonData: JsonData,
) {
    const { colors, columns } = jsonData;
    const { height, width } = viewport;
    const halfHeight = height / 2;
    const halfWidth = width / 2;
    const halfPi = Math.PI / 2;
    const dxPie = height / 100;

    function drawPie(persets: number[], endIndexRange: Range): Promise<void> {

        return new Promise(resolve => {
            let round = 0;
            const dRound = halfWidth / 18;

            let point = 0;
            const dPoint = width / 2 / 16;

            let alfa = 60 / 360;
            const dAlfa = (1 - alfa) / 16;

            const renderFrame = (index: number) => {
                requestAnimationFrame(() => {

                    context.clearRect(0, 0, canvas.width, canvas.height);

                    if (index === 19) return resolve();

                    context.save();
                    clip(round);

                    if (index === 0) {
                        renderFirstPieFrame(persets);
                    }
                    else if (index === 1) {
                        renderSecondPieFrame(persets);
                    }
                    else if (index <= 18) {
                        // 16 - frames
                        renderTransformPieFrame(persets, alfa, point);
                        alfa += dAlfa;
                        point += dPoint;
                    }
                    context.restore();

                    round += dRound;
                    renderFrame(index + 1);
                });
            };
            renderFrame(0);
        });
    }

    function drawPersents(persets: number[]): Promise<void> {

        return new Promise(resolve => {
            let round = halfWidth;
            const dRound = -halfWidth / 18;

            let point = halfWidth;
            const dPoint = -halfWidth / 16;

            let alfa = 1;
            const dAlfa = -(1 - 60 / 360) / 16;

            const renderFrame = (index: number) => {
                requestAnimationFrame(() => {
                    context.clearRect(0, 0, canvas.width, canvas.height);
                    context.save();
                    clip(round);

                    if (index === 0) {
                        renderFirstPieFrame(persets);
                    }
                    else if (index === 1) {
                        renderSecondPieFrame(persets);
                    }
                    else if (index <= 18) {
                        // 16 - frames
                        renderTransformPieFrame(persets, alfa, point);
                        alfa += dAlfa;
                        point += dPoint;
                    }
                    context.restore();

                    round += dRound;

                    if (index === 0) return resolve();
                    renderFrame(index - 1);
                });
            };
            renderFrame(18);
        });
    }


    function clip(round: number) {
        context.beginPath();
        context.moveTo(width / 2 * devicePixelRatio, 0);
        if (round < halfHeight) {

            context.lineTo((width - round) * devicePixelRatio, 0);

            context.arc((width - round) * devicePixelRatio, round * devicePixelRatio, round * devicePixelRatio, -halfPi, 0);

            context.lineTo(width * devicePixelRatio, (height - round) * devicePixelRatio);
            context.arc((width - round) * devicePixelRatio, (height - round) * devicePixelRatio, round * devicePixelRatio, 0, halfPi);

            context.lineTo(round * devicePixelRatio, height * devicePixelRatio);
            context.arc(round * devicePixelRatio, (height - round) * devicePixelRatio, round * devicePixelRatio, halfPi, halfPi * 2);

            context.lineTo(0, round * devicePixelRatio);
            context.arc(round * devicePixelRatio, round * devicePixelRatio, round * devicePixelRatio, halfPi * 2, halfPi * 3);
        }
        else {
            context.arc((width - round) * devicePixelRatio, halfHeight * devicePixelRatio, halfHeight * devicePixelRatio, -halfPi, halfPi);
            context.lineTo(round * devicePixelRatio, height * devicePixelRatio);
            context.arc(round * devicePixelRatio, halfHeight * devicePixelRatio, halfHeight * devicePixelRatio, halfPi, halfPi * 3);
        }

        context.closePath();
        context.clip();
    }

    function renderFirstPieFrame(persets: number[]) {
        persets.reduceRight((last, item, i) => {

            context.fillStyle = colors[columns[i + 1][0]];
            const current = last + item;

            context.beginPath();
            context.moveTo(0, (height - last * dxPie) * devicePixelRatio);
            context.lineTo(0, (height - current * dxPie) * devicePixelRatio);
            context.lineTo(width * devicePixelRatio, (height - current * dxPie) * devicePixelRatio);
            context.lineTo(width * devicePixelRatio, (height - last * dxPie) * devicePixelRatio);
            context.closePath();
            context.fill();

            return last + item;
        }, 0);
    }

    function renderSecondPieFrame(persets: number[]) {
        persets.reduceRight((last, item, i) => {

            context.fillStyle = colors[columns[i + 1][0]];
            const current = last + item;

            context.beginPath();
            context.moveTo(0, (height - last * dxPie) * devicePixelRatio);
            context.lineTo(0, (height - current * dxPie) * devicePixelRatio);
            if (i === 0) {
                context.lineTo(width * devicePixelRatio, 0);
            }

            context.lineTo(width * devicePixelRatio, (height / 2) * devicePixelRatio);

            if (i === persets.length - 1) {
                context.lineTo(width * devicePixelRatio, height * devicePixelRatio);
            }
            context.closePath();
            context.fill();

            return last + item;
        }, 0);
    }

    function renderTransformPieFrame(persets: number[], alfa: number, point: number) {
        persets.reduceRight((last, item, i) => {
            context.fillStyle = colors[columns[i + 1][0]];
            const current = last + item;

            const x = (width - point) * devicePixelRatio;
            const y = (height / 2) * devicePixelRatio;

            context.beginPath();
            context.moveTo(x, y); // point
            context.arc(x, y, width * 2 * devicePixelRatio, toAngle(alfa, last), toAngle(alfa, current));
            context.closePath();
            context.fill();

            const other = toRadian(90 + 60 + (360 + scaleAngle(alfa, 100)) / 2);
            if (i === persets.length - 1 && alfa !== 1) {
                context.beginPath();
                context.moveTo(x, y);
                context.arc(x, y, width * devicePixelRatio, other, toAngle(alfa, 0));
                context.closePath();
                context.fill();
            }
            if (i === 0 && alfa !== 1) {
                context.beginPath();
                context.moveTo(x, y);
                context.arc(x, y, width * devicePixelRatio, toAngle(alfa, current), other);
                context.closePath();
                context.fill();

            }
            return last + item;
        }, 0);
    }

    return {
        drawPie,
        drawPersents,
    };
}
