import { DataService } from 'src/data/service';
import { toDiv, toggleClass } from '../data/const';

export function toMenu(
    container: HTMLDivElement,
    settings: DataService,
) {
    if (settings.jsonData.columns.length > 2) {
        const element = document.createElement('div');

        container.appendChild(element);
        element.classList.add('menu');

        const checkboxes: Checkbox[] = [];
        settings.jsonData.columns.forEach(([key], index) => {
            if (key === 'x') {
                checkboxes.push({ setValue: () => { } });
            }
            else {
                const checkbox = drawCheckbox(
                    index,
                    settings.visibility[index],
                    settings.jsonData.colors[key],
                    settings.jsonData.names[key],
                    settings,
                    container,
                );
                checkboxes.push(checkbox);
            }
        });

        settings.onVisibilityChange(items => items.forEach(
            (value, index) => checkboxes[index].setValue(value),
        ));

        settings.onDestroy(() => {
            container.removeChild(element);
        });
    }
}

interface Checkbox {
    setValue: (value: boolean) => void;
}
function drawCheckbox(
    index: number,
    value: boolean,
    color: string,
    name: string,
    settings: DataService,
    container: HTMLDivElement,
): Checkbox {
    const element = toDiv(container, 'checkbox');

    element.innerHTML += name;
    requestAnimationFrame(() => {
        element.appendChild(drawIcon(color, element.clientWidth));
    });

    let isLongPress = false;
    let timer = null;
    element.onmousedown = element.ontouchstart = () => {
        timer = setTimeout(() => {
            isLongPress = true;
            settings.uncheckOther(index);
        }, 500);
    };

    element.onmouseup = element.ontouchend = (event: Event) => {
        if (timer) clearTimeout(timer);
    };

    element.onclick = () => {
        if (!isLongPress) {
            settings.toggleVisibility(index);
        }
        isLongPress = false;
    };

    function setValue(newValue: boolean) {
        value = newValue;
        toggleClass(element, value, 'as-check');
    }

    setValue(value);

    settings.onDestroy(() => {
        element.onclick = null;
        element.onmousedown = null;
        element.onmouseup = null;
        element.ontouchstart = null;
        element.ontouchend = null;
    });

    return {
        setValue,
    };
}

function drawIcon(color: string, width: number) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML += `<circle class="shadow" cx="22" cy="21" r="${width}" style="fill: ${color};"></circle><circle cx="22" cy="21" r="13" style="fill: ${color};"></circle>`;
    svg.innerHTML += '<polyline class="check-mark" points="16,21.5 20,25.5 27,17.5"></polyline><circle class="cover" cx="22" cy="21" r="12"></circle>';
    return svg;
}
