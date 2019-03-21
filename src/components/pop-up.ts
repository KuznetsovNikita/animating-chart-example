import { nsu } from "../data/const";
import { DataService } from "../data/service";
import { PopUpBlock, toPopUpBlock } from "./pop-up-block";

interface Dot {
    innerCircle: SVGCircleElement;
    circle: SVGCircleElement;
}

interface Elements {
    line: SVGLineElement;
    dots: Dot[];
    block: PopUpBlock;
}

export function toPopUp(
    svg: SVGSVGElement,
    setting: DataService,
    toMax: () => number
) {
    let index: number | null = null;
    let elements: Elements;
    const { viewport: { width, height }, jsonData: { columns, colors } } = setting;
    const g = document.createElementNS(nsu, "g");
    svg.appendChild(g);
    g.classList.add('pop-up');
    createPopUp();

    const hover = document.createElementNS(nsu, "rect");
    hover.classList.add('hover');
    hover.setAttribute('width', svg.width.baseVal.value.toString());
    hover.setAttribute('height', svg.height.baseVal.value.toString());
    svg.appendChild(hover);


    let lastUpdate: number;
    const onDrawPopUp = (offsetX: number, offsetY: number) => {
        if (lastUpdate != null) cancelAnimationFrame(lastUpdate);
        lastUpdate = requestAnimationFrame(() => {
            const {
                indexRange: { start, end },
            } = setting;

            const dx = width / (end - start);

            const newIndex = start + Math.round(offsetX / dx);

            if (newIndex != index) {
                index = newIndex;
                drawPopUp(newIndex, offsetY);
            }
        });
    }

    function cleanUp() {
        g.classList.add('invisible');
    }

    function touchEnd() {
        hover.removeEventListener('touchmove', onTouchMove);
        cleanUp();
    }

    function onMouseMove(event: MouseEvent) {
        onDrawPopUp(event.offsetX, event.offsetY);
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
        if (event.targetTouches.length == 1) {
            drawPopUpByTouch(event);
        }
    }

    function onTouchStart(event: TouchEvent) {
        if (event.targetTouches.length == 1) {
            drawPopUpByTouch(event);
            hover.addEventListener('touchmove', onTouchMove, { passive: false });
        }
    }

    hover.addEventListener('mousemove', onMouseMove);
    hover.addEventListener('mouseout', cleanUp);

    hover.addEventListener('touchstart', onTouchStart, { passive: false });
    hover.addEventListener('touchend', touchEnd);

    setting.onVisibilityChange(key => {
        elements.dots.forEach((dot, i) => {
            if (setting.jsonData.columns[i + 1][0] == key) {
                dot.circle.classList.toggle('invisible');
                dot.innerCircle.classList.toggle('invisible');
            }
        })
    });

    setting.onDestroy(() => {
        hover.removeEventListener('mousemove', onMouseMove);
        hover.removeEventListener('mouseout', cleanUp);

        hover.removeEventListener('touchstart', onTouchStart);
        hover.removeEventListener('touchend', touchEnd);

        g.removeChild(elements.line);
        elements.dots.forEach(({ circle, innerCircle }) => {
            g.removeChild(circle);
            g.removeChild(innerCircle);
        });
        elements = null;
    })

    function createPopUp() {
        const [_, ...lines] = columns;

        g.classList.add('invisible');

        const line = document.createElementNS(nsu, "line");
        line.classList.add('line');
        line.setAttribute('y1', '0');
        line.setAttribute('y2', height.toString());

        g.appendChild(line);

        const dots = lines.map(item => {
            const circle = document.createElementNS(nsu, "circle");
            const innerCircle = document.createElementNS(nsu, "circle");
            g.appendChild(circle);
            circle.style.fill = colors[item[0]];
            circle.setAttribute("r", '5');

            g.appendChild(innerCircle);
            innerCircle.classList.add('inner-circle');
            innerCircle.setAttribute("r", '3');

            return {
                circle,
                innerCircle,
            }
        });

        elements = {
            line,
            dots,
            block: toPopUpBlock(setting, g),
        }
    }

    function drawPopUp(index: number, offsetY: number) {
        const {
            timeRange: { start, end },
        } = setting;

        const [times, ...lines] = columns;
        const time = times[index] as number;
        const dx = width / (end - start);
        const positionX = (time - start) * dx;
        const x = positionX.toString();

        elements.line.setAttribute('x1', x);
        elements.line.setAttribute('x2', x);

        const dy = (height - 10) / toMax();

        elements.dots.forEach((dot, i) => {
            const coordinates = lines[i][index] as number;
            const positionY = height - coordinates * dy;
            const y = positionY.toString();

            dot.circle.setAttribute("cx", x);
            dot.circle.setAttribute("cy", y);

            dot.innerCircle.setAttribute("cx", x);
            dot.innerCircle.setAttribute("cy", y);
        });

        elements.block.setData(time, index, positionX, offsetY);
        g.classList.remove('invisible');
    }
}
