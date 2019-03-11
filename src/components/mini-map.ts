import { Action, JsonData, Settings } from '../data';
import Lens from './lens';


export default class MiniMap {
    constructor(
        jsonData: JsonData,
        settings: Settings,
        dispatcher: (action: Action) => void,
        private element = document.createElement('div'),
        private canvas = new MiniMapCanvas(jsonData, element, settings),
        private lens = new Lens(jsonData, element, settings, dispatcher),
    ) {
        document.body.appendChild(this.element);
        this.element.id = 'mini-map';
    }
}


class MiniMapCanvas {
    constructor(
        jsonData: JsonData,
        element: HTMLDivElement,
        private settings: Settings,
        private canvas = document.createElement('canvas'),
    ) {
        element.appendChild(this.canvas);

        const { width, height } = this.settings.miniMap;
        canvas.setAttribute('width', width.toString());
        canvas.setAttribute('height', height.toString());

        this.drawMiniMap(jsonData)
    }

    drawMiniMap(jsonData: JsonData) {

        let max = 0;
        let times: number[];
        const columns = jsonData.columns.reduce((result, [type, ...values]) => {
            if (type === 'x') {
                times = values;
                return result;
            }

            result[type] = values;

            max = Math.max(max, ...values);

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

