import { DataService } from 'src/models/service';
import { toDiv, toggleClass } from '../data/common';

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

    settings.onSingletonZoom(shouldRender => {
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

    const point = toDiv(element, 'point');
    const outer = toDiv(point, 'outer');
    outer.style.backgroundColor = color;
    const border = toDiv(point, 'border');
    border.style.borderColor = color;
    const inner = toDiv(point, 'inner');
    inner.style.backgroundColor = color;
    toDiv(point, 'icon');

    element.innerHTML += name;

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
