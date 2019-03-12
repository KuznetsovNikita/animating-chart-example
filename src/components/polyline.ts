import { TimeRange, Viewport } from "src/data/models";

export interface Polyline {
    polyline: SVGPolylineElement,
    setPoints: (
        max: number, values: number[], times: number[],
        imeRange: TimeRange, viewport: Viewport,
    ) => void,
}

export function createPolyline(color: string): Polyline {
    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    polyline.classList.add('main-chart');
    polyline.style.stroke = color;

    function setPoints(
        max: number, values: number[], times: number[],
        timeRange: TimeRange, viewport: Viewport,
    ) {
        const { start, end } = timeRange;
        const { height, width } = viewport;

        const dx = toDeltaX(height, max);
        const dy = width / (end - start);

        let points: string[] = [];
        for (let i = 0; i < values.length; i++) {
            points.push(`${(times[i] - start) * dy},${height - values[i] * dx}`);
        }
        polyline.setAttribute("points", points.join(' '));
    }

    return {
        polyline,
        setPoints,
    }
}


function toDeltaX(height: number, max: number) {
    // padding top
    return (height - 20) / max;
}