import { days, month, toDiv } from '../data/const';
import { DataService } from '../data/service';

export interface PopUpBlock {
    setData: (time: number, index: number, positionX: number) => void;
}

export function toPopUpBlock(
    setting: DataService,
    container: HTMLDivElement,
): PopUpBlock {

    const {
        jsonData: { columns, colors, names },
        viewport: { width },
    } = setting;

    const panel = toDiv(container, 'panel');
    const date = toDiv(panel, 'date');

    const [_, ...lines] = columns;

    const values = lines.map(item => {
        const block = toDiv(panel, 'block');
        const name = toDiv(block, 'name');
        const value = toDiv(block, 'value');
        name.innerHTML = names[item[0]];
        value.style.color = colors[item[0]];
        return {
            block,
            value,
            name,
            key: item[0],
        };
    });

    setting.onVisibilityChange(key => {
        values.forEach(item => {
            if (item.key === key) item.block.classList.toggle('invisible');
        });
    });

    function setData(time: number, index: number, positionX: number) {

        const d = new Date(time);
        date.innerHTML = `${days[d.getDay()]}, ${d.getDate()} ${month[d.getMonth()]}`;

        values.forEach((item, i) => {
            let value = lines[i][index].toString();
            item.value.innerHTML = value.length > 6
                ? value.substr(0, value.length - 6) + '.' + value.substr(value.length - 6, 1) + 'M'
                : value.length > 4
                    ? value.substr(0, value.length - 3) + 'K'
                    : value;
        });

        const x = Math.min(Math.max(positionX - 70, 0), width - 140);
        panel.style.transform = `translate(${x}px ,20px)`;
    }

    return {
        setData,
    };
}
