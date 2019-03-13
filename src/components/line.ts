
export class Line {
    constructor(
        private svg: SVGGElement,
        public value: number,
        height: number,
        width: number,
        className: string,
        public g = document.createElementNS("http://www.w3.org/2000/svg", "g"),
    ) {

        this.g.classList.add('line');
        className && this.g.classList.add(className);
        this.setHeight(height);

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

        line.setAttribute('x1', '5');
        line.setAttribute('x2', (width - 5).toString());
        line.setAttribute('y1', '-1');
        line.setAttribute('y2', '-1');

        text.setAttribute('x', '5');
        text.setAttribute('y', '-10');
        text.textContent = value.toString();

        g.appendChild(line);
        g.appendChild(text);

        svg.appendChild(g);
    }

    setHeight(height: number) {
        if (this.g != null) {
            this.g.setAttribute('transform', `translate(0,${height})`);
        }
    }

    destroy() {
        if (this.g != null) {
            this.svg.removeChild(this.g);
            this.g = null;
        }
    }
}
