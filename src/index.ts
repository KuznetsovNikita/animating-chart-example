import * as chart_data from './chart_data.json';
import Chart from './components/chart';
import { drawMiniMap } from './components/mini-map';
import { DataService, JsonData } from './data';
import './style.css';


class Container {
    chart: Chart;

    constructor(
        private settings: DataService,
        jsonData: JsonData,
    ) {
        this.chart = new Chart(jsonData, settings)
        drawMiniMap(jsonData, settings)
    }
}

function init() {
    const jsonData = (chart_data as any as JsonData[])[0];
    const [_, ...timestamps] = jsonData.columns.find(([type]) => type === 'x');

    const viewport = { width: 500, height: 500 };
    const miniMap = { width: 500, height: 50 };
    const timeRange = {
        start: timestamps[Math.round(timestamps.length * 0.8)],
        end: timestamps[timestamps.length - 1],
    };
    const settings = new DataService(viewport, miniMap, 5, timeRange);

    new Container(settings, jsonData);
}

window.onload = init;