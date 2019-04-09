import { days, month, toDiv } from '../data/const';
import { DataService } from '../data/service';

export interface PopUpBlock {
    setData: (time: number, index: number, positionX: number) => void;
}

export function toPopUpBlock(
    setting: DataService,
    container: HTMLDivElement,
    cleanUp: Function,
): PopUpBlock {

    const {
        jsonData: { columns, colors, names },
        viewport: { width },
    } = setting;

    const panel = toDiv(container, 'panel');

    panel.onclick = (_event: MouseEvent) => {
        setting.zoom();
        event.stopPropagation();
        cleanUp();
    };

    setting.onDestroy(() => {
        panel.onclick = null;
    });

    const date = toDiv(panel, 'date');

    const icon = toDiv(panel, 'icon');
    icon.innerHTML = '&#10095;';

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
            num: 0,
            name,
            nameVal: names[item[0]],
            key: item[0],
            isShow: true,
        };
    });

    if (setting.isBars && values.length > 1) {
        const block = toDiv(panel, 'block');
        const name = toDiv(block, 'name');
        const value = toDiv(block, 'value');
        name.innerHTML = 'All';
        values.push({
            block,
            value,
            num: 0,
            name,
            nameVal: 'All',
            key: 'all',
            isShow: true,
        });
    }

    setting.onVisibilityChange(key => {
        values.forEach(item => {
            if (item.key === key) {
                item.isShow = !item.isShow;
                item.block.classList.toggle('invisible');
            }
        });

        if (setting.isPercentage) {
            updatePersent();
        }
    });

    function updatePersent() {
        const total = values.reduce((s, i) => i.isShow ? s + i.num : s, 0);
        values.forEach(item => {
            if (item.isShow) {
                item.name.innerHTML = `<b>${Math.round(item.num / total * 100)}%</b> ${item.nameVal}`;
            }
        });
    }

    function setData(time: number, index: number, positionX: number) {

        const d = new Date(time);
        date.innerHTML = `${days[d.getDay()]}, ${d.getDate()} ${month[d.getMonth()]}`;

        values.forEach((item, i) => {
            if (item.key !== 'all') {
                item.num = lines[i][index] as number;
                item.value.innerHTML = format(item.num);
            }
        });

        if (setting.isPercentage) {
            updatePersent();
        }

        if (setting.isBars && values.length > 1) {
            const item = values[values.length - 1];
            const filtered = values.filter(item => item.key !== 'all' && item.isShow);
            if (filtered.length > 1) {
                item.isShow = true; 
                item.num = filtered.reduce((s, i) => s + i.num, 0);
                item.value.innerHTML = format(item.num);
                item.block.classList.remove('invisible');
            }
            else {
                item.isShow = false;
                item.block.classList.add('invisible');
            }
        }
        panel.style.transform = `translate(${positionX + (positionX > width / 2 ? -160 : 10)}px, 10px)`;
    }

    function format(value: number): string {
        const str = value.toString();
        return str.length > 6
            ? str.substr(0, str.length - 6) + '.' + str.substr(str.length - 6, 1) + 'M'
            : str.length > 4
                ? str.substr(0, str.length - 3) + 'K'
                : str;
    }

    return {
        setData,
    };
}



