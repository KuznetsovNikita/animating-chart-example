import { days, month, toDiv, toggleClass } from '../data/const';
import { DataService } from '../data/service';

export interface PopUpBlock {
    setPersent: (persents: number[], hovers: number[], offsetX: number, offsetY: number) => void;
    setData: (time: number, index: number, positionX: number) => void;
    setVisibility: (vision: boolean[]) => void;
    destroy: () => void;
    panel: HTMLDivElement;
}

interface Row {
    block: HTMLDivElement;
    value: HTMLDivElement;
    num: number;
    name: HTMLDivElement;
    nameVal: string;
    key: string;
    isShow: boolean;
}

export function toPopUpBlock(
    setting: DataService,
    container: HTMLDivElement,
): PopUpBlock {

    const { viewport: { width }, } = setting;

    const panel = toDiv(container, 'panel');

    panel.onclick = (_event: MouseEvent) => {
        setting.isZoom ? setting.unzoom() : setting.zoom();
        event.stopPropagation();
    };


    function destroy() {
        panel.onclick = null;
    }

    let date: HTMLDivElement;
    if (!setting.isZoom || !setting.isPercentage) {

        date = toDiv(panel, 'date');

        const icon = toDiv(panel, 'icon');
        icon.innerHTML = '&#10095;';
    }


    const { columns: [_, ...lines], names, colors } = setting.jsonData;

    let values = lines.map<Row>(item => {
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

    function setShow(row: Row, value: boolean) {
        row.isShow = value;
        toggleClass(row.block, !value, 'invisible');
    }


    function setVisibility(visible: boolean[]) {
        for (let i = 1; i < visible.length; i++) {
            setShow(values[i - 1], visible[i]);
        }

        if (setting.isPercentage) {
            updatePersent();
        }
    }

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
        date.innerHTML = `${days[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${month[d.getMonth()].slice(0, 3)}`;
        if (setting.isZoom) {
            if (setting.isSingleton) {
                date.innerHTML = `${('0' + (d.getUTCHours())).slice(-2)}:${('0' + d.getMinutes()).slice(-2)}`;
            }
            else {
                date.innerHTML += ` ${('0' + (d.getUTCHours())).slice(-2)}:00`;
            }
        }

        const [_, ...lines] = setting.jsonData.columns;

        values.forEach((item, i) => {
            if (item.key !== 'all') {
                item.num = lines[i][index] as number;
                item.value.innerHTML = formatDateToShortString(item.num);
            }
        });

        if (setting.isPercentage) {
            updatePersent();
        }

        if (setting.isBars && values.length > 1) {
            const item = values[values.length - 1];
            const filtered = values.filter(item => item.key !== 'all' && item.isShow);

            if (filtered.length > 1) {
                
                item.num = filtered.reduce((s, i) => s + i.num, 0);
                item.value.innerHTML = formatDateToShortString(item.num);
                setShow(item, true);
            }
            else {
                setShow(item, false);
            }
        }
        panel.style.transform = `translate(${positionX + (positionX > width / 2 ? -170 : 10)}px, 10px)`;
    }

    function setPersent(persents: number[], hovers: number[], offsetX: number, offsetY: number) {

        values.forEach((item, i) => {
            setShow(item, !!hovers[values.length - i - 1]);
            item.num = persents[i];
            item.value.innerHTML = `${Math.round(item.num * 10) / 10}%`;
        });

        panel.style.transform = `translate(${offsetX + 10}px, ${offsetY - 50}px)`;
    }


    return {
        setData,
        setPersent,
        setVisibility,
        destroy,
        panel,
    };
}

function formatDateToShortString(value: number): string {
    const str = value.toString();
    return str.length > 6
        ? str.substr(0, str.length - 6) + '.' + str.substr(str.length - 6, 1) + 'M'
        : str.length > 4
            ? str.substr(0, str.length - 3) + 'K'
            : str;
}



