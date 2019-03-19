import { DataService } from "src/data/service";
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


export class PopUp {

    index: number | null = null;
    elements: Elements;

    constructor(
        svg: SVGGElement,
        private setting: DataService,
        private toMax: () => number,
        private g = document.createElementNS("http://www.w3.org/2000/svg", "g"),
    ) {
        svg.appendChild(this.g);
        this.g.classList.add('pop-up');
        this.createPopUp();

        let lastUpdate: number;
        const drawPopUp = (offsetX: number, offsetY: number) => {
            if (lastUpdate != null) cancelAnimationFrame(lastUpdate);
            lastUpdate = requestAnimationFrame(() => {
                const {
                    indexRange: { start, end },
                    viewport: { width }
                } = this.setting;

                const dx = width / (end - start);

                const index = start + Math.round(offsetX / dx);

                if (index != this.index) {
                    this.index = index;
                    this.drawPopUp(index, offsetY);
                }
            });
        }

        const cleanUp = () => {
            this.g.classList.add('invisible');
        }

        const touchEnd = () => {
            svg.removeEventListener('touchmove', drawPopUpByTouch);
            cleanUp();
        }

        svg.addEventListener('mousemove', event => drawPopUp(event.offsetX, event.offsetY));
        svg.addEventListener('mouseleave', cleanUp);

        const drawPopUpByTouch = (event: TouchEvent) => {
            if (event.targetTouches.length == 1) {
                event.preventDefault();
                event.stopPropagation();
                const { pageX, pageY } = event.targetTouches[0];
                drawPopUp(pageX, pageY);
            }
        }

        svg.addEventListener('touchstart', event => {
            if (event.targetTouches.length == 1) {
                event.preventDefault();
                event.stopPropagation();
                const { pageX, pageY } = event.targetTouches[0];
                drawPopUp(pageX, pageY);

                svg.addEventListener('touchmove', drawPopUpByTouch, { passive: false });
            }
        }, { passive: false });


        svg.addEventListener('touchend', touchEnd);


        this.setting.onVisibilityChange(key => {
            this.elements.dots.forEach((dot, i) => {
                if (this.setting.jsonData.columns[i + 1][0] == key) {
                    dot.circle.classList.toggle('invisible');
                    dot.innerCircle.classList.toggle('invisible');
                }
            })
        });
    }

    createPopUp() {
        const {
            viewport: { height },
            jsonData: { columns, colors }
        } = this.setting;
        const [_, ...lines] = columns;

        this.g.classList.add('invisible');

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.classList.add('line');
        line.setAttribute('y1', '0');
        line.setAttribute('y2', height.toString());

        this.g.appendChild(line);

        const dots = lines.map(item => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            const innerCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            this.g.appendChild(circle);
            circle.style.fill = colors[item[0]];
            circle.setAttribute("r", '5');

            this.g.appendChild(innerCircle);
            innerCircle.classList.add('inner-circle');
            innerCircle.setAttribute("r", '3');

            return {
                circle,
                innerCircle,
            }
        });

        this.elements = {
            line,
            dots,
            block: toPopUpBlock(this.setting, this.g),
        }
    }

    destroy() {
        this.g.removeChild(this.elements.line);
        this.elements.dots.forEach(({ circle, innerCircle }) => {
            this.g.removeChild(circle);
            this.g.removeChild(innerCircle);
        });
        this.elements = null;
    }

    drawPopUp(index: number, offsetY: number) {
        const {
            timeRange: { start, end },
            viewport: { width, height },
            jsonData: { columns }
        } = this.setting;

        const [times, ...lines] = columns;
        const time = times[index] as number;
        const dx = width / (end - start);
        const positionX = (time - start) * dx;
        const x = positionX.toString();

        this.elements.line.setAttribute('x1', x);
        this.elements.line.setAttribute('x2', x);

        const max = this.toMax();
        const dy = (height - 10) / max;

        this.elements.dots.forEach((dot, i) => {
            const coordinates = lines[i][index] as number;
            const positionY = height - coordinates * dy;
            const y = positionY.toString();

            dot.circle.setAttribute("cx", x);
            dot.circle.setAttribute("cy", y);

            dot.innerCircle.setAttribute("cx", x);
            dot.innerCircle.setAttribute("cy", y);
        });

        this.elements.block.setData(time, index, positionX, offsetY);
        this.g.classList.remove('invisible');
    }
}