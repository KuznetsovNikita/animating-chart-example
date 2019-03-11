import { DataService, JsonData } from '../data';
import { drawLens } from './lens';


export function drawMiniMap(
    jsonData: JsonData,
    settings: DataService,
) {
    const element = document.createElement('div');
    document.body.appendChild(element);
    element.id = 'mini-map';

    new MiniMapCanvas(jsonData, element, settings);
    drawLens(jsonData, element, settings);
}


class MiniMapCanvas {
    constructor(
        private jsonData: JsonData,
        element: HTMLDivElement,
        private settings: DataService,
        private canvas = document.createElement('canvas'),
    ) {
        element.appendChild(this.canvas);

        const { width, height } = this.settings.miniMap;
        canvas.setAttribute('width', width.toString());
        canvas.setAttribute('height', height.toString());

        this.drawMiniMap(jsonData)

        settings.onVisibilityChange(this.redraw);
    }

    redraw = () => {
        const context = this.canvas.getContext('2d');
        context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawMiniMap(this.jsonData);
    }

    drawMiniMap(jsonData: JsonData) {

        let max = 0;
        let times: number[];
        const columns = jsonData.columns.reduce((result, [type, ...values]) => {
            if (type === 'x') {
                times = values;
                return result;
            }
            if (this.settings.visibility[type]) {
                result[type] = values;

                max = Math.max(max, ...values);
            }

            return result;
        }, {});


        for (let key in columns) {
            this.drawChart(
                max, columns[key], times,
                jsonData.colors[key],
            );
        }
    }

    drawChart(
        max: number, values: number[],
        times: number[], color: string,
    ) {
        const ctx = this.canvas.getContext('2d');

        ctx.lineWidth = 1;
        ctx.strokeStyle = color;

        const { height, width } = this.settings.miniMap;
        const start = times[0];
        const end = times[times.length - 1];

        const dx = height / max;
        const dy = width / (end - start);

        ctx.beginPath();
        ctx.moveTo((times[0] - start) * dy, height - values[0] * dx);
        for (let i = 1; i < values.length; i++) {
            ctx.lineTo((times[i] - start) * dy, height - values[i] * dx);
        }
        ctx.stroke();
    }
}

