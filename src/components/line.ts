
const padding = 5;

export interface Line {
    line: SVGLineElement,
    text: SVGTextElement,
    setValue: (value: number, height: number) => void,
}

export function createLine(
    value: number,
    height: number,
    width: number,
): Line {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.classList.add('line');
    line.setAttribute('x1', padding.toString());
    line.setAttribute('x2', (width - padding).toString());
    line.setAttribute('y1', height.toString());
    line.setAttribute('y2', height.toString());

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.classList.add('line-text');
    text.setAttribute('x', padding.toString());
    text.setAttribute('y', (height - 10).toString());
    text.textContent = value.toString();

    function setValue(newValue: number, newHeight: number) {
        line.setAttribute('y1', newHeight.toString());
        line.setAttribute('y2', newHeight.toString());
        text.textContent = newValue.toString();
        text.setAttribute('y', (newHeight - 8).toString());
    }

    return {
        line, text, setValue,
    }
}