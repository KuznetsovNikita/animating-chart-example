import { DataService } from 'src/data/service';
import { toChart } from './chart';
import { toMenu } from './menu';
import { toMiniMap } from './mini-map';

export function drawContainer(
    charts: DataService[],
    width: number,
) {
    const container = document.createElement('div');
    document.body.append(container);
    container.id = 'app';
    container.style.width = width + 'px';

    charts.forEach(item => item.asSoonAsReady.then(() => {
        const header = document.createElement('div');
        container.appendChild(header);
        header.id = 'header';
        header.innerHTML = `<h1>Chart #${item.url}</h1>`;

        const chart = document.createElement('div');
        chart.classList.add('chart');
        container.appendChild(chart);
        toChart(chart, item);
        toMiniMap(chart, item);
        toMenu(chart, item);
    }));

    toModeButton(container, charts[0]);
}


function toModeButton(
    container: HTMLDivElement,
    settings: DataService,
) {
    let isDay: boolean;
    let button = document.createElement('div');

    container.appendChild(button);
    button.classList.add('mode');
    setDay();

    button.onclick = () => {
        isDay ? setNight() : setDay();
    };

    settings.onDestroy(() => {
        button.onclick = null;
        container.removeChild(button);
        button = null;
        container = null;
    });

    function setDay() {
        isDay = true;
        document.body.classList.remove('night');
        button.innerHTML = 'Switch to Night Mode';
    }

    function setNight() {
        isDay = false;
        document.body.classList.add('night');
        button.innerHTML = 'Switch to Day Mode';
    }
}
