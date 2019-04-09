import { DataService } from 'src/data/service';

export function toMenu(
    container: HTMLDivElement,
    settings: DataService,
) {
    if (settings.jsonData.columns.length > 2) {
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

    element.innerHTML += `<span>${name}</span>`;
    requestAnimationFrame(() => {
        element.appendChild(drawIcon(color, element.clientWidth));
    });

    element.onclick = () => {
        settings.toggleVisibility(key);
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
    svg.innerHTML += `<circle class="shadow" cx="22" cy="21" r="${width}" style="fill: ${color};"></circle><circle cx="22" cy="21" r="13" style="fill: ${color};"></circle>`;
    svg.innerHTML += '<polyline class="check-mark" points="16,21.5 20,25.5 27,17.5"></polyline><circle class="cover" cx="22" cy="21" r="12"></circle>';
    return svg;
}
