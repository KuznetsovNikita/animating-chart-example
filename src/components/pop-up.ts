import { MaxMin } from 'src/data/models';
import { recountPercent } from '../data/adapters';
import { day, findIndex, toDiv, toggleClass, toScales } from '../data/common';
import { DataService } from '../models/service';
import { PopUpBlock, toPopUpBlock } from './pop-up-block';

interface Elements {
    line: HTMLDivElement[];
    dots: HTMLDivElement[];
    block: PopUpBlock;
}

function getRoundedDate(minutes: number, date: Date): number {
    let ms = 1000 * 60 * minutes;
    return Math.round(date.getTime() / ms) * ms;
}

export function toPopUp(
    parent: HTMLDivElement,
    setting: DataService,
    toMax: (index: number) => MaxMin,
) {
    let elements: Elements;
    const { viewport: { width, height } } = setting;

    const element = toDiv(parent, 'hover');
    element.style.height = height + 'px';
    element.style.width = width + 'px';

    const container = toDiv(element, 'pop-up');

    let isShow = false;
    let isPiePopUp = false;
    let isTouchEvents = false;

    setting.onVisibilityChange(visible => {
        if (isPiePopUp) return;
        elements.block.setVisibility(visible);
    });

    setting.onSingletonZoom(() => {
        destroyElements();
        createPopUp();
    });

    setting.onDrawPie(() => {
        cleanUp();
        destroyElements();
        createPopUp();
        isPiePopUp = true;
    });

    setting.onDrawPersent(() => {
        cleanUp();
        destroyElements();
        createPopUp();
        elements.block.setVisibility(setting.visibility);
        isPiePopUp = false;
    });

    createPopUp();

    function toAlfa(offsetX: number, offsetY: number) {
        let alfa = Math.atan((setting.viewport.height / 2 - offsetY) / (offsetX - setting.viewport.width / 2)) / Math.PI * 180;
        if (offsetX > setting.viewport.width / 2) {
            return 30 + 180 - alfa;
        }
        else {
            if (offsetY < setting.viewport.height / 2 || alfa <= 30) {
                return 30 - alfa;
            }
            else {
                return 30 + 360 - alfa;
            }
        }
    }

    function toAngle(persent) {
        return persent * 360 / 100;
    }

    function seeIfOutOfPie(offsetX: number, offsetY: number) {
        const y = setting.viewport.height / 2 - offsetY;
        const x = offsetX - setting.viewport.width / 2;
        return Math.sqrt(x * x + y * y) > setting.viewport.height / 2 - 20;
    }
    function drawPiePopUp(offsetX: number, offsetY: number) {
        const { jsonData, visibility, indexRange } = setting;


        const alfa = toAlfa(offsetX, offsetY);
        const persents = recountPercent(jsonData, indexRange.start, toScales(visibility));

        if (seeIfOutOfPie(offsetX, offsetY)) {
            return setting.hover(persents, persents.map(() => 0), offsetX, offsetY, true);
        }

        const hovers: number[] = [];
        persents.reduceRight((last, item) => {
            const current = last + item;

            hovers.push((toAngle(last) < alfa) && (alfa <= toAngle(current)) && 1 || 0);

            return last + item;
        }, 0);
        setting.hover(persents, hovers.reverse(), offsetX, offsetY, false);
    }

    setting.onHover((persents, hovers, offsetX, offsetY, shouldClose) => {
        elements.block.setPersent(persents, hovers, offsetX, offsetY);
        shouldClose ? hidePopUp() : showPopUp();
    });

    let oldTime: number | null = null;
    let lastUpdate: number;
    const onDrawPopUp = (offsetX: number, offsetY: number, shouldLoad: boolean) => {
        if (lastUpdate != null) cancelAnimationFrame(lastUpdate);
        lastUpdate = requestAnimationFrame(() => {

            if (isPiePopUp) return drawPiePopUp(offsetX, offsetY);

            const dx = width / (setting.timeRange.end - setting.timeRange.start);

            const d = new Date(setting.timeRange.start + Math.round(offsetX / dx));
            const time = setting.isZoom
                ? setting.isSingleton
                    ? getRoundedDate(5, d)
                    : d.setUTCMinutes(0, 0, 0)
                : d.setUTCHours(0, 0, 0, 0);

            const [times] = setting.jsonData.columns;
            const index = findIndex(times, item => item === time);
            if (index === -1) {
                return cleanUp();
            }

            if (shouldLoad && !setting.isZoom) {
                elements.block.setLoading(
                    setting.loadingData(setting.isBars ? time + day : time),
                );
            }

            if (time !== oldTime) {
                oldTime = time;
                drawPopUp(time, dx, index);
            }

        });
    };

    function cleanUp() {
        hidePopUp();
        if (!isTouchEvents) {
            element.addEventListener('mousemove', onMouseMove);
        }
    }


    function touchEnd(event: TouchEvent) {
        if (event.target === element) {
            element.removeEventListener('touchmove', onTouchMove);
            drawPopUpByTouch(lastTouchEvent, true);
        }
    }

    function drawPopUpByTouch(event: TouchEvent, shouldLoad: boolean) {
        //   event.preventDefault();
        event.stopPropagation();
        const { clientX, clientY, target } = event.targetTouches[0];
        var rect = (target as SVGSVGElement).getBoundingClientRect();
        var x = clientX - rect.left;
        var y = clientY - rect.top;
        onDrawPopUp(x, y, shouldLoad);
    }

    let lastTouchEvent: TouchEvent;
    function onTouchMove(event: TouchEvent) {
        if (event.targetTouches.length === 1) {
            drawPopUpByTouch(event, false);
            lastTouchEvent = event;
        }
    }


    function onTouchStart(event: TouchEvent) {
        isTouchEvents = true;
        element.removeEventListener('mousemove', onMouseMove);
        if (event.targetTouches.length === 1 && event.target === element) {
            drawPopUpByTouch(event, false);
            element.addEventListener('touchmove', onTouchMove, { passive: false });
            lastTouchEvent = event;
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
        if (!isPiePopUp) {
            element.removeEventListener('mousemove', onMouseMove);
        }

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
        const { columns: [_, ...lines], colors } = setting.jsonData;

        hidePopUp();

        if (setting.isBars) {
            elements = {
                line: [toDiv(container, 'shadow'), toDiv(container, 'shadow')],
                dots: [],
                block: toPopUpBlock(setting, container),
            };
        }
        else {
            const line = [];
            if (!setting.isPercentage || !setting.isZoom) {
                line.push(toDiv(container, 'line'));
            }
            const dots = setting.isPercentage ? [] : lines.map(([key]) => {
                const dot = toDiv(container, 'dot');
                dot.style.borderColor = colors[key];
                return dot;
            });

            elements = {
                line,
                dots,
                block: toPopUpBlock(setting, container),
            };
        }
    }

    function destroyElements() {
        elements.line.forEach(line => container.removeChild(line));
        elements.dots.forEach(dot => container.removeChild(dot));
        elements.block.destroy();
        container.removeChild(elements.block.panel);
        elements = null;
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
        showPopUp();
    }

    function showPopUp() {
        if (isShow) return;
        isShow = true;
        container.classList.remove('invisible');
        if (setting.isZoom && setting.isPercentage) return;
        container.classList.add('animation');


    }

    function hidePopUp() {
        isShow = false;
        container.classList.add('invisible');
        container.classList.remove('animation');
        if (setting.isZoom && setting.isPercentage) return;
    }
}
