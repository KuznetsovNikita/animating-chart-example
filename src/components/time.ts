import { month, nsu } from "../data/const";

export interface Time {
    value: number;
    setLeft: (left: number) => void;
    destroy: () => void;
}

export function toTime(
    svg: SVGGElement,
    value: number,
    left: number
): Time {
    const text = document.createElementNS(nsu, "text");
    const tspan = document.createElementNS(nsu, "tspan");

    text.classList.add('time');
    text.appendChild(tspan);

    const date = new Date(value);
    tspan.innerHTML = `${date.getDate()} ${month[date.getMonth()]}`;

    setLeft(left);
    tspan.setAttribute('y', '18');
    tspan.setAttribute('text-anchor', 'middle');

    svg.appendChild(text);

    function setLeft(left: number) {
        tspan.setAttribute('x', left.toString());
    }

    function destroy() {
        svg.removeChild(text);
    }

    return {
        value,
        setLeft,
        destroy
    }
}
