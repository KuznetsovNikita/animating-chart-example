import { DataService, JsonData } from '../data';

export default class Chart {

    constructor(
        private jsonData: JsonData,
        private settings: DataService,
        private canvas = document.createElement('canvas'),
    ) {
        document.body.appendChild(this.canvas);

        const { width, height } = this.settings.viewport;
        canvas.setAttribute('width', width.toString());
        canvas.setAttribute('height', height.toString());

        this.drawCharts();

        settings.onTimeTangeChange(() => {
            const context = this.canvas.getContext('2d');
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.drawCharts();
        })
    }

    drawCharts() {
        const { start, end } = this.settings.timeRange;

        const [_, ...timestamps] = this.jsonData.columns.find(([type]) => type === 'x');

        let startIndex = timestamps.findIndex(time => time >= start) - 1;
        if (startIndex === -1) startIndex = 0;
        let endIndex = timestamps.findIndex(time => time > end) + 1;
        if (endIndex === 0) endIndex = timestamps.length;

        const times = timestamps.slice(startIndex, endIndex);

        let max = 0;
        const columns = this.jsonData.columns.reduce((result, [type, ...values]) => {
            if (type === 'x') return result;

            result[type] = values.slice(startIndex, endIndex);

            max = Math.max(max, ...result[type]);

            return result;
        }, {});

        this.drawX(max);

        for (let key in columns) {
            this.drawChart(
                max, columns[key], times,
                this.jsonData.names[key],
                this.jsonData.colors[key],
            );
        }
    }

    drawChart(
        max: number,
        values: number[],
        times: number[],
        _name: string,
        color: string,
    ) {
        var ctx = this.canvas.getContext('2d');

        ctx.lineWidth = 2;
        ctx.strokeStyle = color;

        const { start, end } = this.settings.timeRange;
        const { height, width } = this.settings.viewport;

        const dx = height / max;
        const dy = width / (end - start);

        ctx.beginPath();
        ctx.moveTo((times[0] - start) * dy, height - values[0] * dx);
        for (let i = 1; i < values.length; i++) {
            ctx.lineTo((times[i] - start) * dy, height - values[i] * dx);
        }
        ctx.stroke();
    }

    drawX(max: number) {

        const last = Math.ceil(max / 10) * 10;
        const { height, width } = this.settings.viewport;
        const dValue = last / this.settings.lines;
        let label = 0;

        const dX = height / (this.settings.lines + 1);

        const ctx = this.canvas.getContext('2d');
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'gray';
        ctx.font = "10px Arial";

        for (let x = height; x > 0; x -= dX) {
            ctx.beginPath();
            ctx.moveTo(0, x);
            ctx.lineTo(width, x);
            ctx.stroke();

            ctx.fillText(label.toString(), 2, x - 2);
            label += dValue;
        }
    }
}
