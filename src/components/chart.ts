import { ChartData, DataService, Dict, TimeRange, Viewport } from '../data/service';

export default class Chart {

    private currentMax: number;
    private targetMax: number;

    private deltaMax: number;

    private lastUpdateCall: number;

    constructor(
        private settings: DataService,
        private svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    ) {
        document.body.appendChild(this.svg);

        const { width, height } = this.settings.viewport;
        svg.setAttribute('width', width.toString());
        svg.setAttribute('height', height.toString());

        const data = this.settings.toChartData();
        this.currentMax = data.max;
        this.drawLine(this.currentMax);

        for (let key in data.columns) {
            this.drawPolyline(key, this.currentMax, data.columns[key], data.times, data.colors[key]);
        }

        settings.onTimeRangeChange(this.redraw);
        settings.onVisibilityChange(key => {
            this.polylines[key].polyline.classList.toggle('invisible');
            this.redraw()
        });
    }

    redraw = () => {
        const data = this.settings.toChartData();
        this.drawCharts(data);
    }

    drawCharts(data: ChartData) {

        if (this.lastUpdateCall) {
            cancelAnimationFrame(this.lastUpdateCall);
        }
        // if (Object.keys(data.columns).length === 0) {
        //     return this.clean();
        // }

        this.targetMax = data.max;

        this.deltaMax = this.targetMax - this.currentMax;

        this.draw(data);
    }

    draw(data: ChartData) {
        this.lastUpdateCall = requestAnimationFrame(() => {
            this.redrawLine(this.currentMax);

            for (let key in data.columns) {
                this.redrawPoliline(key, this.currentMax, data.columns[key], data.times);
            }

            if (this.currentMax === this.targetMax) return;

            const absMax = Math.abs(this.deltaMax);
            for (let i = 0; i < absMax * 0.07; i++) {
                this.currentMax += this.deltaMax / absMax;
                if (this.currentMax === this.targetMax) break;
            }
            return this.draw(data);
        });
    }

    polylines: Dict<Polyline> = {};

    drawPolyline(key: string, max: number, values: number[], times: number[], color: string) {
        const poliline = cratePolyline(color);

        this.svg.appendChild(poliline.polyline);
        poliline.setPoints(
            max, values, times,
            this.settings.timeRange,
            this.settings.viewport
        );

        this.polylines[key] = poliline;
    }

    redrawPoliline(key: string, max: number, values: number[], times: number[]) {
        this.polylines[key].setPoints(
            max, values, times,
            this.settings.timeRange,
            this.settings.viewport
        );
    }

    lines: Line[] = [];
    drawLine(max: number) {
        this.settings.useLines(max, (value, height, width) => {
            const line = createLine(value, height, width);
            this.lines.push(line);
            this.svg.appendChild(line.line);
            this.svg.appendChild(line.text);
        });
    }

    redrawLine(max: number) {
        this.settings.useLines(max, (value, height, _, i) => {
            this.lines[i].setValue(value, height)
        });
    }
}

const padding = 5;

interface Line {
    line: SVGLineElement,
    text: SVGTextElement,
    setValue: (value: number, height: number) => void,
}

function createLine(
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

interface Polyline {
    polyline: SVGPolylineElement,
    setPoints: (
        max: number, values: number[], times: number[],
        imeRange: TimeRange, viewport: Viewport,
    ) => void,
}

function cratePolyline(color: string): Polyline {
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