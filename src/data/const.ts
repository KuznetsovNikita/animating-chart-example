
export const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const nsu = 'http://www.w3.org/2000/svg';


export function drawConvas(
    element: HTMLDivElement,
    width: number,
    height: number,
) {
    const canvas = document.createElement('canvas');

    canvas.setAttribute('width', (width * window.devicePixelRatio).toString());
    canvas.setAttribute('height', (height * window.devicePixelRatio).toString());

    canvas.style.height = height + 'px';
    canvas.style.width = width + 'px';

    element.appendChild(canvas);

    return canvas;
}