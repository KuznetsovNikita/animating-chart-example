import { days, month, toDiv } from '../data/const';
import { DataService, day } from '../data/service';
import { toChart } from './chart';
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
        .then(charts => charts.forEach(item => drawChart(item, container)));
}


function formatTime(settings: DataService): string {
    if (settings.isZoom) {
        const d = new Date(settings.timeRange.start + day / 2);
        return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${month[d.getMonth()]} ${d.getFullYear()}`;
    }
    else {
        const s = new Date(settings.timeRange.start);
        const e = new Date(settings.timeRange.end);
        return `${s.getUTCDate()} ${month[s.getMonth()]} ${s.getFullYear()} - ${e.getUTCDate()} ${month[e.getMonth()]} ${e.getFullYear()}`;
    }
}
function drawChart(settings: DataService, container: HTMLDivElement) {
    const header = toDiv(container, 'header');
    header.innerHTML = `<h1>Chart ${settings.url}</h1>`;

    const zoomOut = toDiv(header, 'zoom');
    zoomOut.innerHTML = '<svg class="loupe" height="27" width="27"><circle cx="12" cy="12" r="9"></circle><line x1="7" x2="17" y1="12" y2="12"></line><line x1="19" x2="27" y1="19" y2="27"></line></svg><span>Zoom Out</span>';

    const dateRange = toDiv(header, 'range');
    function update() {
        dateRange.innerHTML = formatTime(settings);
    }
    update();

    settings.onTimeRangeChange(update);
    settings.onZoom(update);
    settings.onPieZoom(update);

    function toggleZoom() {
        header.classList.toggle('in-zoom');
    }
    settings.onZoomStart(toggleZoom);
    settings.onDrawPie(toggleZoom);
    settings.onDrawPersent(toggleZoom);


    zoomOut.onclick = () => {
        settings.unzoom();
    }

    settings.onDestroy(() => {
        zoomOut.onclick = null;
    })

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
