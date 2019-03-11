import * as chart_data from './chart_data.json';
import Chart from './components/chart';
import MiniMap from './components/mini-map';
import { Action, JsonData, Settings } from './data';
import './style.css';


class Container {
    chart: Chart;
    miniMap: MiniMap;

    constructor(
        private settings: Settings,
        jsonData: JsonData,
    ) {
        this.chart = new Chart(jsonData, settings)
        this.miniMap = new MiniMap(jsonData, settings, this.dispatcher)

    }

    dispatcher = (action: Action) => {
        this.settings.timeRange = action.data;
        this.chart.setTimeRange(action.data);
    }
}

function init() {
    const jsonData = (chart_data as any as JsonData[])[4];
    const [_, ...timestamps] = jsonData.columns.find(([type]) => type === 'x');

    const settings: Settings = {
        viewport: {
            width: 300,
            height: 300,
        },
        miniMap: {
            width: 300,
            height: 50,
        },
        lines: 5,
        timeRange: {
            start: timestamps[Math.round(timestamps.length * 0.8)],
            end: timestamps[timestamps.length - 1],
        },
    };
    new Container(settings, jsonData);
}

window.onload = init;