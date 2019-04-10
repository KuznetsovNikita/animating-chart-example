import { DataService } from 'src/data/service';
import { toDiv, toggleClass } from '../data/const';

export function toMenu(
    container: HTMLDivElement,
    settings: DataService,
) {

    const element = toDiv(container, 'menu');

    let checkboxes: Checkbox[] = [];

    function drawCheckboxes() {
        settings.jsonData.columns.forEach(([key], index) => {
            if (key === 'x') {
                checkboxes.push(fake);
            }
            else {
                checkboxes.push(drawCheckbox(
                    index,
                    settings.visibility[index],
                    settings.jsonData.colors[key],
                    settings.jsonData.names[key],
                    settings,
                    element,
                ));
            }
        });
    }

    if (!settings.isSingleton) {
        drawCheckboxes();
    }

    settings.onChangeFactory(shouldRender => {
        if (shouldRender) {
            drawCheckboxes();
        }
        else {
            checkboxes.forEach(item => item.destroy());
            checkboxes = [];
        }
    });

    settings.onVisibilityChange(items => items.forEach(
        (value, index) => checkboxes.length && checkboxes[index].setValue(value),
    ));

    settings.onDestroy(() => {
        checkboxes.forEach(item => item.destroy());
        container.removeChild(element);
    });
}

interface Checkbox {
    setValue: (value: boolean) => void;
    destroy: () => void;
}

const fake: Checkbox = {
    setValue: () => { },
    destroy: () => { },
};

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

    element.onmouseup = element.ontouchend = () => {
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

    function destroy() {
        element.onclick = null;
        element.onmousedown = null;
        element.onmouseup = null;
        element.ontouchstart = null;
        element.ontouchend = null;

        container.removeChild(element);
        container = null;
    }

    return {
        setValue,
        destroy,
    };
}

function drawIcon(color: string, width: number) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.innerHTML += `<circle class="shadow" cx="22" cy="21" r="${width}" style="fill: ${color};"></circle><circle cx="22" cy="21" r="13" style="fill: ${color};"></circle>`;
    svg.innerHTML += '<polyline class="check-mark" points="16,21.5 20,25.5 27,17.5"></polyline><circle class="cover" cx="22" cy="21" r="12"></circle>';
    return svg;
}
