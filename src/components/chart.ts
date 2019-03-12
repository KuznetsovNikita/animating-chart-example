import { ChartData, DataService } from '../data/service';

export default class Chart {

    private currntMax: number;
    private targetMax: number;

    private deltaMax: number;

    private lastUpdateCall: number;

    constructor(
        private settings: DataService,
        private canvas = document.createElement('canvas'),
    ) {
        document.body.appendChild(this.canvas);

        const { width, height } = this.settings.viewport;
        canvas.setAttribute('width', width.toString());
        canvas.setAttribute('height', height.toString());

        const data = this.settings.toChartData();
        this.currntMax = data.max;
        this.drawCharts(data);

        settings.onTimeRangeChange(this.redraw);
        settings.onVisibilityChange(this.redraw);
    }

    redraw = () => {
        const data = this.settings.toChartData();
        this.drawCharts(data);
    }

    drawCharts(data: ChartData) {
        if (this.lastUpdateCall) {
            cancelAnimationFrame(this.lastUpdateCall);
        }
        if (Object.keys(data.columns).length === 0) {
            return this.clean();
        }

        this.targetMax = data.max;

        this.deltaMax = this.targetMax - this.currntMax;

        this.draw(data);
    }

    draw(data: ChartData) {
        this.lastUpdateCall = requestAnimationFrame(() => {

            const context = this.canvas.getContext('2d');
            context.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.drawX(this.currntMax);

            for (let key in data.columns) {
                this.drawChart(this.currntMax, data.columns[key], data.times, data.colors[key]);
            }

            if (this.currntMax === this.targetMax) return;

            const absMax = Math.abs(this.deltaMax);
            for (let i = 0; i < absMax * 0.1; i++) {
                this.currntMax += this.deltaMax / absMax;
                if (this.currntMax === this.targetMax) break;
            }
            return this.draw(data);
        });
    }

    drawChart(max: number, values: number[], times: number[], color: string) {
        var ctx = this.canvas.getContext('2d');

        ctx.lineWidth = 2;
        ctx.strokeStyle = color;

        const { start, end } = this.settings.timeRange;
        const { height, width } = this.settings.viewport;

        const dx = toDeltaX(height, max);
        const dy = width / (end - start);

        ctx.beginPath();
        ctx.moveTo((times[0] - start) * dy, height - values[0] * dx);
        for (let i = 1; i < values.length; i++) {
            ctx.lineTo((times[i] - start) * dy, height - values[i] * dx);
        }
        ctx.stroke();
    }

    clean() {
        const ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const { height, width } = this.settings.viewport;

        ctx.lineWidth = 1;
        ctx.strokeStyle = "#f2f4f5";

        ctx.beginPath();
        ctx.moveTo(0, height);
        ctx.lineTo(width, height);
        ctx.stroke();

        ctx.font = "normal 13px Open Sans";
        ctx.fillStyle = "#a6b1b8";

        ctx.fillText('0', 4, height - 4);
    }

    drawX(max: number) {

        const last = Math.floor(max / 10) * 10;

        const { height, width } = this.settings.viewport;

        const dy = last / this.settings.lines;
        const dx = toDeltaX(height, max);

        const ctx = this.canvas.getContext('2d');
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#f2f4f5";


        for (let label = 0; label <= last; label += dy) {
            const x = height - label * dx;
            ctx.beginPath();
            ctx.moveTo(0, x);
            ctx.lineTo(width, x);
            ctx.stroke();

            ctx.font = "normal 300 13px sans-serif";
            ctx.fillStyle = "#a6b1b8";
            ctx.fillText(label.toString(), 4, x - 4);
        }
    }
}

function toDeltaX(height: number, max: number) {
    // padding top
    return (height - 20) / max;
}