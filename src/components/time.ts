import { month } from "../data/const";


export class Time {
    constructor(
        private svg: SVGGElement,
        public value: number,
        left: number,
        public text = document.createElementNS("http://www.w3.org/2000/svg", "text"),
        private tspan = document.createElementNS("http://www.w3.org/2000/svg", "tspan")
    ) {
        text.classList.add('time');
        text.appendChild(tspan);

        const date = new Date(value);
        tspan.innerHTML = `${date.getDate()} ${month[date.getMonth()]}`;

        this.setLeft(left);
        tspan.setAttribute('y', '18');
        tspan.setAttribute('text-anchor', 'middle');

        this.svg.appendChild(this.text);
    }

    setLeft(left: number) {
        this.tspan.setAttribute('x', left.toString());
    }

    destroy() {
        this.svg.removeChild(this.text);
    }
}