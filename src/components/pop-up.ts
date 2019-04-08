import { toDiv } from '../data/const';
import { DataService } from '../data/service';
import { PopUpBlock, toPopUpBlock } from './pop-up-block';

// interface Dot {
//     innerCircle: SVGCircleElement;
//     circle: SVGCircleElement;
// }

interface Elements {
    line: HTMLDivElement[];
    dots: HTMLDivElement[];
    block: PopUpBlock;
}

export function toPopUp(
    parent: HTMLDivElement,
    context: CanvasRenderingContext2D,
    setting: DataService,
    toMax: (index: number) => number,
) {
    let index: number | null = null;
    let elements: Elements;
    const { viewport: { width, height }, jsonData: { columns, colors } } = setting;

    const element = toDiv(parent, 'hover');
    element.style.height = height + 'px';
    element.style.width = width + 'px';


    const container = toDiv(element, 'pop-up');

    createPopUp();

    let lastUpdate: number;
    const onDrawPopUp = (offsetX: number, offsetY: number) => {
        if (lastUpdate != null) cancelAnimationFrame(lastUpdate);
        lastUpdate = requestAnimationFrame(() => {
            const { indexRange: { start, end } } = setting;

            const dx = width / (end - start);

            const newIndex = start + Math.round(offsetX / dx);

            if (newIndex !== index) {
                index = newIndex;
                drawPopUp(newIndex, offsetY);
            }
        });
    };

    function cleanUp() {
        container.classList.add('invisible');
        element.addEventListener('mousemove', onMouseMove);
    }


    function touchEnd() {
        element.removeEventListener('touchmove', onTouchMove);
        cleanUp();
    }

    function drawPopUpByTouch(event: TouchEvent) {
        event.preventDefault();
        event.stopPropagation();
        const { clientX, clientY, target } = event.targetTouches[0];
        var rect = (target as SVGSVGElement).getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        onDrawPopUp(x, y);
    }

    function onTouchMove(event: TouchEvent) {
        if (event.targetTouches.length === 1) {
            drawPopUpByTouch(event);
        }
    }

    function onTouchStart(event: TouchEvent) {
        if (event.targetTouches.length === 1) {
            drawPopUpByTouch(event);
            element.addEventListener('touchmove', onTouchMove, { passive: false });
        }
    }

    function onMouseMove(event: MouseEvent) {
        if (!setting.isMove) {
            const { clientX, clientY, currentTarget } = event;
            var rect = (currentTarget as HTMLDivElement).getBoundingClientRect();
            var x = clientX - rect.left;
            var y = clientY - rect.top;
            onDrawPopUp(x, y);
        }
        else {
            cleanUp();
        }
    }

    function onMouseOut(_event: MouseEvent) {
        cleanUp();
    }

    function onClick(event: MouseEvent) {
        element.removeEventListener('mousemove', onMouseMove);

        const { clientX, clientY, currentTarget } = event;
        var rect = (currentTarget as HTMLDivElement).getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        onDrawPopUp(x, y);
    }

    element.addEventListener('click', onClick);

    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseleave', onMouseOut);

    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchend', touchEnd);

    setting.onVisibilityChange(key => {
        elements.dots.forEach((dot, i) => {
            if (setting.jsonData.columns[i + 1][0] === key) {
                dot.classList.toggle('invisible');
            }
        });
    });

    setting.onTimeRangeChange(() => cleanUp());

    setting.onDestroy(() => {
        element.removeEventListener('click', onClick);

        element.removeEventListener('mousemove', onMouseMove);
        element.removeEventListener('mouseleave', onMouseOut);

        element.removeEventListener('touchstart', onTouchStart);
        element.removeEventListener('touchend', touchEnd);
    });

    function createPopUp() {
        const [_, ...lines] = columns;

        container.classList.add('invisible');

        if (setting.isBars) {
            elements = {
                line: [toDiv(container, 'line'), toDiv(container, 'line')],
                dots: [],
                block: toPopUpBlock(setting, container),
            };
        }
        else {
            const line = toDiv(container, 'line');
            const dots = lines.map(item => {
                const dot = toDiv(container, 'dot');
                dot.style.borderColor = colors[item[0]];
                return dot;
            });

            elements = {
                line: [line],
                dots,
                block: toPopUpBlock(setting, container),
            };
        }
    }

    function drawPopUp(index: number, _offsetY: number) {
        const {
            timeRange: { start, end },
        } = setting;

        const [times, ...lines] = columns;
        const time = times[index] as number;
        const dx = width / (end - start);
        const x = (time - start) * dx;
        if (!setting.isBars) {
            elements.line[0].style.transform = `translate(${x}px, 0)`;

            elements.dots.forEach((dot, i) => {
                const dy = height / (toMax(i + 1) - setting.min);
                const coordinates = lines[i][index] as number - setting.min;
                const positionY = height - coordinates * dy;
                const y = positionY.toString();
                dot.style.transform = `translate(${x}px, ${y}px)`;
            });

            elements.block.setData(time, index, x);
        }
        else {
            const next = times[index + 1] as number;
            if (!next) return;
            elements.line[0].style.transform = `translate(0, 0)`;
            elements.line[0].style.width = x + 'px';
            elements.line[1].style.transform = `translate(${(next - start) * dx}px, 0)`;
            elements.line[1].style.width = (end - next) * dx + 'px';
            elements.block.setData(time, index + 1, x);
        }


        container.classList.remove('invisible');
    }
}
