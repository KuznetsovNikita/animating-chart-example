import { Column, Range, Times, Viewport } from "src/data/models";



export class Polyline {
    constructor(
        color: string,
        className: string,
        public polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline"),
    ) {
        polyline.classList.add('polyline');
        polyline.classList.add(className);
        polyline.style.stroke = color;
    }

    setPoints(
        max: number, values: Column, times: Times,
        indexRange: Range, timeRange: Range, viewport: Viewport,
    ) {
        const { start, end } = timeRange;
        const { height, width } = viewport;

        const dx = height / max;
        const dy = width / (end - start);

        let points = '';
        for (let i = indexRange.start; i <= indexRange.end; i++) {
            if (i != 0) points += ' ';
            points += `${((times[i] as number) - start) * dy},${height - (values[i] as number) * dx}`;
        }
        this.polyline.setAttribute("points", points);
    }
}

