import { toDiv } from '../data/common';
import { DataService } from '../data/service';
import { toChart } from './chart';
import { toHeader } from './header';
import { toMenu } from './menu';
import { toMiniMap } from './mini-map';

export function drawContainer(
    servicies: DataService[],
    width: number,
) {
    const container = document.createElement('div');
    document.body.append(container);
    container.id = 'app';
    container.style.width = width + 'px';

    toModeButton(container, servicies);

    Promise
        .all(servicies.map(item => item.asSoonAsReady))
        .then(charts => charts.forEach(item => drawChart(item, container, width)));
}


function drawChart(settings: DataService, container: HTMLDivElement, width: number) {

    toHeader(container, settings, width);

    const chart = toDiv(container, 'chart');
    if (settings.isSingleton) chart.classList.add('as-sg');

    toChart(chart, settings);
    toMiniMap(chart, settings);
    toMenu(chart, settings);
}


function toModeButton(
    container: HTMLDivElement,
    settings: DataService[],
) {
    let isDay: boolean;
    let button = document.createElement('div');

    container.appendChild(button);
    button.classList.add('mode');
    setDay();

    button.onclick = () => {
        isDay ? setNight() : setDay();
    };

    settings[0].onDestroy(() => {
        button.onclick = null;
        container.removeChild(button);
        button = null;
        container = null;
    });

    function setDay() {
        isDay = true;
        document.body.classList.remove('night');
        button.innerHTML = 'Switch to Night Mode';
        settings.map(item => item.changeStyle('day'));
    }

    function setNight() {
        isDay = false;
        document.body.classList.add('night');
        button.innerHTML = 'Switch to Day Mode';
        settings.map(item => item.changeStyle('night'));
    }
}
