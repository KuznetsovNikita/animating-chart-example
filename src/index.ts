import { Container } from './components/container';
import * as chart_data from './data/chart_data.json';
import { DataService, Dict, JsonData } from './data/service';
import './style/index.css';

function init() {
    const jsonData = (chart_data as any as JsonData[])[0];
    const [_, ...timestamps] = jsonData.columns.find(([type]) => type === 'x');

    const w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth;
    const width = Math.min(x, 500);

    const viewport = { width: width, height: width };
    const miniMap = { width: width, height: 46 };

    const timeRange = {
        start: timestamps[Math.round(timestamps.length * 0.8)],
        end: timestamps[timestamps.length - 1],
    };
    const visibility: Dict<boolean> = {};
    for (let key in jsonData.names) {
        visibility[key] = true;
    }

    const settings = new DataService(viewport, miniMap, 5, timeRange, jsonData, visibility);

    new Container(settings);
}

window.onload = init;