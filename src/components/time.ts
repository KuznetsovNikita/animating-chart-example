import { month, nsu } from "../data/const";

export interface Time {
    text: SVGTextElement,
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
    const text = document.createElementNS(nsu, "text");
    const tspan = document.createElementNS(nsu, "tspan");

    text.classList.add('time');
    className && text.classList.add(className);

    text.appendChild(tspan);

    update(value, left);
    tspan.setAttribute('y', '18');
    tspan.setAttribute('text-anchor', 'middle');

    svg.appendChild(text);

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
        svg.removeChild(text);
    }

    return {
        text,
        value,
        update,
        setLeft,
        destroy
    }
}
