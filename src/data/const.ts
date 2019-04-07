
export const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function drawConvas(
    element: HTMLDivElement,
    width: number,
    height: number,
    className?: string,
) {
    const canvas = document.createElement('canvas');
    className && canvas.classList.add(className);

    canvas.setAttribute('width', (width * window.devicePixelRatio).toString());
    canvas.setAttribute('height', (height * window.devicePixelRatio).toString());

    canvas.style.height = height + 'px';
    canvas.style.width = width + 'px';

    element.appendChild(canvas);

    return canvas;
}

export function toDiv(parent: HTMLElement, className?: string): HTMLDivElement {
    const div = document.createElement('div');
    className && div.classList.add(className);
    parent.appendChild(div);
    return div;
}