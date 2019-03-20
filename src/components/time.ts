import { month, nsu } from "../data/const";

export interface Time {
    g: SVGGElement,
    value: number;
    update: (value: number, left: number) => void;
    setLeft: (left: number) => void;
    destroy: () => void;
}

export function toTime(
    svg: SVGGElement,
    value: number,
    left: number,
    className?: string,
): Time {
    const g = document.createElementNS(nsu, "g");
    const text = document.createElementNS(nsu, "text");
    const tspan = document.createElementNS(nsu, "tspan");

    g.classList.add('time');
    className && g.classList.add(className);

    text.appendChild(tspan);
    g.appendChild(text);

    update(value, left);
    tspan.setAttribute('y', '18');
    tspan.setAttribute('text-anchor', 'middle');


    svg.appendChild(g);

    function update(value: number, left: number) {
        setValue(value);
        setLeft(left);
    }

    function setValue(value: number) {
        const date = new Date(value);
        tspan.innerHTML = `${date.getDate()} ${month[date.getMonth()]}`;
    }
    function setLeft(left: number) {
        tspan.setAttribute('x', left.toString());
    }

    function destroy() {
        svg.removeChild(g);
    }

    return {
        g,
        value,
        update,
        setLeft,
        destroy
    }
}
