import { DataService } from "src/data/service";
import { nsu } from '../data/const';

export function toMenu(
    container: HTMLDivElement,
    settings: DataService,
) {
    const element = document.createElement('div');

    container.appendChild(element);
    element.classList.add('menu');

    for (let key in settings.visibility) {
        element.appendChild(drawCheckbox(
            key, settings.visibility[key],
            settings.jsonData.colors[key],
            settings.jsonData.names[key],
            settings
        ));
    }

    settings.onDestroy(() => {
        container.removeChild(element);
    });
}

function drawCheckbox(
    key: string,
    value: boolean,
    color: string,
    name: string,
    settings: DataService,
) {
    const element = document.createElement('div');
    element.classList.add('checkbox');
    if (value) element.classList.add('as-check');

    element.innerHTML += name;
    requestAnimationFrame(() => {
        element.appendChild(drawIcon(color, element.clientWidth));
    });

    let lastUpdate: number;
    element.onclick = () => {
        settings.toggleVisibility(key);

        element.classList.add('as-click');
        if (lastUpdate) clearTimeout(lastUpdate);
        lastUpdate = setTimeout(() => {
            element.classList.remove('as-click');
        }, 300);
    };

    settings.onVisibilityChange(item => {
        if (item === key) {
            element.classList.toggle('as-check')
        };
    });

    settings.onDestroy(() => {
        element.onclick = null;
    });

    return element;
}

function drawIcon(color: string, width: number) {
    const svg = document.createElementNS(nsu, "svg");

    const shadow = document.createElementNS(nsu, "circle");
    shadow.classList.add('shadow');
    shadow.setAttribute("cx", '22');
    shadow.setAttribute("cy", '21');
    shadow.setAttribute("r", width.toString());
    svg.appendChild(shadow);

    const circle = document.createElementNS(nsu, "circle");
    svg.appendChild(circle);
    circle.style.fill = color;
    circle.setAttribute("cx", '22');
    circle.setAttribute("cy", '21');
    circle.setAttribute("r", '13');

    const polyline = document.createElementNS(nsu, "polyline");
    svg.appendChild(polyline);
    polyline.classList.add('check-mark');
    polyline.setAttribute("points", '16,21.5 20,25.5 27,17.5');

    const cover = document.createElementNS(nsu, "circle");
    svg.appendChild(cover);
    cover.classList.add('cover');
    cover.setAttribute("cx", '22');
    cover.setAttribute("cy", '21');
    cover.setAttribute("r", '12');

    return svg;
}
