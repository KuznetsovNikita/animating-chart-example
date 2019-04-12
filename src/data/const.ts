import { MaxMin } from "./models";

export const month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const devicePixelRatio = window.devicePixelRatio;

export function drawConvas(
    element: HTMLDivElement,
    width: number,
    height: number,
    className?: string,
) {
    const canvas = document.createElement('canvas');
    className && canvas.classList.add(className);

    canvas.setAttribute('width', (width * devicePixelRatio).toString());
    canvas.setAttribute('height', (height * devicePixelRatio).toString());

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


export function toRadian(a: number) {
    return a * Math.PI / 180;
}

export function scaleAngle(alfa: number, persent: number) {
    return persent * alfa * 360 / 100;
}

export function toAngle(alfa: number, persent: number) {
    const a = 90 + 60 + scaleAngle(alfa, persent);
    return toRadian(a);
}

export function toPieAngle(persent: number) {
    return toAngle(1, persent);
}

export function speedTest(prefix: string, count: number) {
    let t0: number;

    let result = [];

    return {
        start: () => {
            t0 = performance.now();
        },
        end: () => {
            let t1 = performance.now();
            result.push(t1 - t0);

            if (result.length >= count) {
                const sum = result.reduce((s, i) => s + i, 0);
                console.log(prefix, sum / result.length);
                result = []
            }
        }
    }
}

export function toScales(vision: boolean[]) {
    return vision.reduce((acc, item, index) => {
        if (index !== 0) acc.push(item ? 1 : 0);
        return acc;
    }, [])
}