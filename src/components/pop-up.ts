import { MaxMin } from 'src/data/models';
import { toDiv, toggleClass } from '../data/const';
import { DataService, day } from '../data/service';
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
    setting: DataService,
    toMax: (index: number) => MaxMin,
) {
    let elements: Elements;
    const { viewport: { width, height }, jsonData: { colors } } = setting;

    const element = toDiv(parent, 'hover');
    element.style.height = height + 'px';
    element.style.width = width + 'px';

    const container = toDiv(element, 'pop-up');

    createPopUp();

    let oldTime: number | null = null;
    let lastUpdate: number;
    const onDrawPopUp = (offsetX: number, offsetY: number, shouldLoad: boolean) => {
        if (lastUpdate != null) cancelAnimationFrame(lastUpdate);
        lastUpdate = requestAnimationFrame(() => {

            const dx = width / (setting.timeRange.end - setting.timeRange.start);

            const d = new Date(setting.timeRange.start + Math.round(offsetX / dx));
            const time = setting.isZoom
                ? d.setUTCMinutes(0, 0, 0)
                : d.setUTCHours(0, 0, 0, 0);

            const [times] = setting.jsonData.columns;
            const index = times.findIndex(item => item === time);
            if (index === -1) {
                return cleanUp();
            }

            if (shouldLoad && !setting.isZoom) {
                setting.loadingData(setting.isBars ? time + day : time);
            }

            if (time !== oldTime) {
                oldTime = time;
                drawPopUp(time, dx, index);
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
        onDrawPopUp(x, y, false);
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
            onDrawPopUp(x, y, false);
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
        onDrawPopUp(x, y, true);

    }

    element.addEventListener('click', onClick);

    element.addEventListener('mousemove', onMouseMove);
    element.addEventListener('mouseleave', onMouseOut);

    element.addEventListener('touchstart', onTouchStart, { passive: false });
    element.addEventListener('touchend', touchEnd);

    setting.onVisibilityChange(visible => {
        cleanUp();
        if (elements.dots.length) {
            for (let i = 1; i < visible.length; i++) {
                toggleClass(elements.dots[i - 1], !visible[i], 'invisible');
            }
        }
    });

    setting.onTimeRangeChange(() => cleanUp());
    setting.onZoomStart(() => cleanUp());

    setting.onDestroy(() => {
        element.removeEventListener('click', onClick);

        element.removeEventListener('mousemove', onMouseMove);
        element.removeEventListener('mouseleave', onMouseOut);

        element.removeEventListener('touchstart', onTouchStart);
        element.removeEventListener('touchend', touchEnd);
    });

    function createPopUp() {
        const [_, ...lines] = setting.jsonData.columns;

        container.classList.add('invisible');

        if (setting.isBars) {
            elements = {
                line: [toDiv(container, 'shadow'), toDiv(container, 'shadow')],
                dots: [],
                block: toPopUpBlock(setting, container),
            };
        }
        else {
            const line = toDiv(container, 'line');
            const dots = setting.isPercentage ? [] : lines.map(([key]) => {
                const dot = toDiv(container, 'dot');
                dot.style.borderColor = colors[key];
                return dot;
            });

            elements = {
                line: [line],
                dots,
                block: toPopUpBlock(setting, container),
            };
        }
    }

    function drawPopUp(time: number, dx: number, index: number) {

        const [times, ...lines] = setting.jsonData.columns;
        const x = (time - setting.timeRange.start) * dx;
        if (!setting.isBars) {
            elements.line[0].style.transform = `translate(${x}px, 0)`;

            elements.dots.forEach((dot, i) => {
                const dy = height / (toMax(i + 1)[0] - toMax(i + 1)[1]);
                const coordinates = lines[i][index] as number - toMax(i + 1)[1];
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
            elements.line[1].style.transform = `translate(${(next - setting.timeRange.start) * dx}px, 0)`;
            elements.line[1].style.width = (setting.timeRange.end - next) * dx + 'px';
            elements.block.setData(time + (setting.isBars && !setting.isZoom ? day : 0), index + 1, x);
        }
        container.classList.remove('invisible');
    }
}
