import { DataService } from 'src/data/service';

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
            settings,
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
            element.classList.toggle('as-check');
        }
    });

    settings.onDestroy(() => {
        element.onclick = null;
    });

    return element;
}

function drawIcon(color: string, width: number) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML += `<circle class="shadow" cx="22" cy="21" r="${width}"></circle><circle cx="22" cy="21" r="13" style="fill: ${color};"></circle>`;
    svg.innerHTML += '<polyline class="check-mark" points="16,21.5 20,25.5 27,17.5"></polyline><circle class="cover" cx="22" cy="21" r="12"></circle>';
    return svg;
}
