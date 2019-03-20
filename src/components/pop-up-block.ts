import { days, month, nsu } from "../data/const";
import { DataService } from "../data/service";

interface Value {
    block: SVGGElement;
    name: SVGTextElement;
    value: SVGTextElement;
    key: string;
}

export interface PopUpBlock {
    setData: (time: number, index: number, positionX: number, offsetY: number) => void;
}

export function toPopUpBlock(
    setting: DataService,
    g: SVGGElement
): PopUpBlock {
    const panel = document.createElementNS(nsu, "g");
    const rect = document.createElementNS(nsu, "rect");
    const shadow = document.createElementNS(nsu, "rect");
    const date = document.createElementNS(nsu, "text");

    const {
        jsonData: { columns, colors, names },
        viewport: { height, width },
    } = setting;
    const [_, ...lines] = columns;
    g.appendChild(panel);

    panel.appendChild(shadow);
    panel.appendChild(rect);

    let panelHeight = (25 + Math.ceil(lines.length / 2) * 40);
    rect.setAttribute('height', panelHeight.toString());
    rect.setAttribute('width', '120');
    rect.setAttribute('rx', '10');
    rect.setAttribute('ry', '10');
    rect.classList.add('rect');

    shadow.setAttribute('height', panelHeight.toString());
    shadow.setAttribute('width', '120');
    shadow.setAttribute('x', '1');
    shadow.setAttribute('y', '1');
    shadow.setAttribute('rx', '10');
    shadow.setAttribute('ry', '10');
    shadow.classList.add('shadow');

    panel.appendChild(date);

    date.setAttribute('x', '10');
    date.setAttribute('y', '18');
    date.classList.add('date');

    function blockPosition(block: SVGGElement, index: number) {
        block.setAttribute('transform', `translate(${10 + index % 2 * 50},${20 + 40 * Math.floor(index / 2)})`);
    }

    const values = lines.map((item, index) => {

        const block = document.createElementNS(nsu, "g");
        panel.appendChild(block);
        blockPosition(block, index);

        const value = document.createElementNS(nsu, "text");
        const name = document.createElementNS(nsu, "text");
        block.appendChild(value);
        block.appendChild(name);

        value.setAttribute('x', '0');
        value.setAttribute('y', '20');
        value.classList.add('value');

        name.setAttribute('x', '0');
        name.setAttribute('y', '38');
        name.innerHTML = names[item[0]];

        value.style.fill = colors[item[0]];
        name.style.fill = colors[item[0]];

        return {
            block,
            value,
            name,
            key: item[0],
        }
    });

    setting.onVisibilityChange(key => {
        const filtered: Value[] = [];
        values.forEach(item => {
            if (item.key === key) item.block.classList.toggle('invisible');
            if (setting.visibility[item.key]) filtered.push(item);
        });
        if (filtered.length === 0) {
            panel.classList.add('invisible');
        }
        else {
            panel.classList.remove('invisible');
            filtered.forEach((item, i) => blockPosition(item.block, i));
            panelHeight = (25 + Math.ceil(filtered.length / 2) * 40);
            rect.setAttribute('height', panelHeight.toString());
            shadow.setAttribute('height', panelHeight.toString());
        }
    });

    setting.onDestroy(() => {
        g.removeChild(panel);
        g.removeChild(rect);
        g.removeChild(shadow);
        g.removeChild(date);
        values.forEach(item => g.removeChild(item.block));
    });

    function setData(time: number, index: number, positionX: number, offsetY: number) {

        const value = new Date(time);
        date.innerHTML = `${days[value.getDay()]}, ${value.getDate()} ${month[value.getMonth()]}`;

        values.forEach((item, i) => {
            let value = lines[i][index].toString();
            item.value.innerHTML = value.length > 6
                ? value.substr(0, value.length - 6) + '.' + value.substr(value.length - 6, 1) + 'M'
                : value.length > 4
                    ? value.substr(0, value.length - 3) + 'K'
                    : value;
        });

        const y = offsetY > height / 2 ? 20 : height - 20 - panelHeight;
        const x = Math.min(Math.max(positionX - 20, 0), width - 120);
        panel.setAttribute('transform', `translate(${x},${y})`);
    }

    return {
        setData,
    }
}
