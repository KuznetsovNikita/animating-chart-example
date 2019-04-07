import { drawContainer } from './components/container';
import { DataService, JsonData } from './data/service';
import './style/index.css';

function init() {
    const width = Math.min(window.innerWidth, 500);

    const rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType('application/json');
    rawFile.open('GET', './chart_data.json', true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status === 200) {
            const jsonData: JsonData[] = JSON.parse(rawFile.responseText);
            const settings = jsonData.map(item => new DataService(width, item));

            drawContainer(settings, width);
        }
    };
    rawFile.send(null);
}

window.onload = init;
