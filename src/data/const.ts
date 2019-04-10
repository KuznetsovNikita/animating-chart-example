import { MaxMin } from "./models";

export const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

export function map2<A>(arr1: A[], arr2: A[], map: (a: A, b: A) => A): A[] {
    return arr1.reduce((result, item, index) => {
        result.push(map(item, arr2[index]));
        return result;
    }, []);
}


export function mapMaxMin(
    one: MaxMin[],
    map: (maxOrMin1: number) => number
): MaxMin[] {
    return one.map(
        ([maxOne, minOne]) => [map(maxOne), map(minOne)] as MaxMin
    );
}

export function map2MaxMin(
    one: MaxMin[], two: MaxMin[],
    map: (maxOrMin1: number, maxOrMin2: number) => number
): MaxMin[] {
    return map2(
        one, two,
        ([maxOne, minOne], [maxTwo, minTwo]) => [
            map(maxOne, maxTwo),
            map(minOne, minTwo),
        ] as MaxMin
    );
}

export function toggleClass(element: HTMLElement, value: boolean, className: string) {
    value ? element.classList.add(className) : element.classList.remove(className);
}
