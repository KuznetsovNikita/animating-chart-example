import { nsu } from '../data/const';

export interface Line {
    g: SVGGElement;
    value: number;
    setHeight: (height: number) => void;
    destroy: () => void;
}

export function toLine(
    svg: SVGGElement,
    value: number,
    height: number,
    width: number,
    className: string,
) {
    const g = document.createElementNS(nsu, "g");

    g.classList.add('line');
    className && g.classList.add(className);
    setHeight(height);

    const line = document.createElementNS(nsu, "line");
    const text = document.createElementNS(nsu, "text");

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

    function setHeight(height: number) {
        g.setAttribute('transform', `translate(0,${height})`);
    }

    function destroy() {
        svg.removeChild(g);
        svg = null;
    }

    return {
        g,
        value,
        setHeight,
        destroy,
    }
}
