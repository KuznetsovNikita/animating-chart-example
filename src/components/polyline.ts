import { nsu } from "../data/const";
import { Column, Range, TimeColumn, Viewport } from "../data/models";

export interface Polyline {
    polyline: SVGPolylineElement,
    setPoints: (
        max: number, values: Column, times: TimeColumn,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) => void;
}
export function toPolyline(
    color: string,
    className: string,
) {
    const polyline = document.createElementNS(nsu, "polyline");
    polyline.classList.add('polyline');
    polyline.classList.add(className);
    polyline.style.stroke = color;

    function setPoints(
        max: number, values: Column, times: TimeColumn,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) {
        const { start, end } = timeRange;
        const { height, width } = viewport;

        const dx = (height - 10) / max;
        const dy = width / (end - start);

        let points = '';
        for (let i = indexRange.start; i <= indexRange.end; i++) {
            if (i != 0) points += ' ';
            points += `${((times[i] as number) - start) * dy},${height - (values[i] as number) * dx}`;
        }
        polyline.setAttribute("points", points);
    }

    return {
        polyline,
        setPoints,
    }
}
