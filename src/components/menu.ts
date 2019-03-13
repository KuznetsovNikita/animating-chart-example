import { DataService } from "src/data/service";


export class Menu {
    constructor(
        container: HTMLDivElement,
        settings: DataService,
        public element = document.createElement('div')
    ) {
        container.appendChild(element);
        element.id = 'menu';

        for (let key in settings.visibility) {
            element.appendChild(drawCheckbox(
                key, settings.visibility[key],
                settings.jsonData.colors[key],
                settings.jsonData.names[key],
                settings
            ));
        }

    }
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
    element.appendChild(drawIcon(color));
    element.innerHTML += name;

    element.onclick = () => {
        settings.toggleVisibility(key);
    };

    settings.onVisibilityChange(item => {
        if (item === key) {
            element.classList.toggle('as-check')
        };
    });

    return element;
}

function drawIcon(color: string) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("height", "30");
    svg.setAttribute("width", "30");

    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.appendChild(circle);
    circle.style.fill = color;
    circle.setAttribute("cx", '15');
    circle.setAttribute("cy", '15');
    circle.setAttribute("r", '13');

    const polyline = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    svg.appendChild(polyline);
    polyline.classList.add('check-mark');
    polyline.setAttribute("points", '9,15.5 13,19.5 20,11.5');

    const cover = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    svg.appendChild(cover);
    cover.classList.add('cover');
    cover.setAttribute("cx", '15');
    cover.setAttribute("cy", '15');
    cover.setAttribute("r", '12');

    return svg;
}
