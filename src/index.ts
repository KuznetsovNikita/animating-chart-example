import { Container } from './components/container';
import * as chart_data from './data/chart_data.json';
import { DataService, JsonData } from './data/service';
import './style/index.css';

function init() {
    const jsonData = (chart_data as any as JsonData[])[0];

    const w = window,
        d = document,
        e = d.documentElement,
        g = d.getElementsByTagName('body')[0],
        x = w.innerWidth || e.clientWidth || g.clientWidth;
    const width = Math.min(x, 500);

    const settings = new DataService(width, jsonData);

    new Container(settings);
}

window.onload = init;