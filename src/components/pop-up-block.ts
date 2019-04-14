import { days, devicePixelRatio, drawConvas, month, roundPercentageTotals, toDiv, toggleClass, toRadian } from '../data/common';
import { DataService } from '../models/service';

export interface PopUpBlock {
    setLoading: (loading: Promise<void>) => void;
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

interface Icon {
    start: () => void;
    end: () => void;
    destroy: () => void;
}

function toIcon(
    container: HTMLDivElement,
): Icon {

    const canvas = drawConvas(container, 20, 20, 'icon');
    const context = canvas.getContext('2d');
    context.strokeStyle = '#d2d5d7';
    context.lineWidth = 2 * devicePixelRatio;

    const { width, height } = canvas;
    const center = height / 2;
    const r = height / 2 - 2 * devicePixelRatio;
    const p = Math.sqrt(2) / 2 * r;

    let start = 315;
    let length = 90;

    let lastUpdate;
    function spin() {
        lastUpdate = setTimeout(() => {
            start += 5;
            if (start === 360) {
                start = 0;
            }
            drawLoading();
            spin();
        }, 20);
    }

    function drawLoading() {
        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.arc(center, center, r, toRadian(start), toRadian(start + length));
        context.stroke();
    }

    function draw() {
        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.moveTo(center + p, center - p);
        context.lineTo(center + r, center);
        context.lineTo(center + p, center + p);
        context.stroke();
    }

    draw();

    return {
        start: () => {
            spin();
        },
        end: () => {
            clearTimeout(lastUpdate);
            start = 315;
            draw();
        },
        destroy: () => {
            clearTimeout(lastUpdate);
            container.removeChild(canvas);
            container = null;
        },
    };
}


export function toPopUpBlock(
    setting: DataService,
    container: HTMLDivElement,
): PopUpBlock {

    const { viewport: { width }, } = setting;

    const panel = toDiv(container, 'panel');

    let isLoading = false;
    panel.onclick = (event: MouseEvent) => {
        setting.isZoom ? setting.unzoom() : setting.zoom();
        event.stopPropagation();

        if (isLoading && icon) {
            icon.start();
        }
    };


    function destroy() {
        panel.onclick = null;
        icon && icon.destroy();
    }

    let date: HTMLDivElement;
    let icon: Icon | null = null;
    if (!setting.isZoom || !setting.isPercentage) {

        date = toDiv(panel, 'date');
        icon = toIcon(panel);
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
        const persents = roundPercentageTotals(values.map(item => item.num / total * 100));
        values.forEach((item, i) => {
            if (item.isShow) {
                item.name.innerHTML = `<b>${persents[i]}%</b> ${item.nameVal}`;
            }
        });
    }

    function setLoading(loading: Promise<void>) {
        isLoading = true;
        loading.then(() => {
            isLoading = false;
            icon && icon.end();
        });
    }

    function setData(time: number, index: number, positionX: number) {

        const d = new Date(time);
        date.innerHTML = `${days[d.getUTCDay()].slice(0, 3)}, ${d.getUTCDate()} ${month[d.getUTCMonth()].slice(0, 3)}`;
        if (setting.isZoom) {
            if (setting.isSingleton) {
                date.innerHTML = `${('0' + (d.getUTCHours())).slice(-2)}:${('0' + d.getUTCMinutes()).slice(-2)}`;
            }
            else {
                date.innerHTML += ` ${('0' + (d.getUTCHours())).slice(-2)}:00`;
            }
        }
        else {
            date.innerHTML += ` ${d.getUTCFullYear()}`;
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
        panel.style.transform = `translate(${positionX + (positionX > width / 2 ? -190 : 20)}px, 10px)`;
    }

    function setPersent(persents: number[], hovers: number[], offsetX: number, offsetY: number) {
        const roundedPersents = roundPercentageTotals(persents);
        values.forEach((item, i) => {
            setShow(item, !!hovers[i]);
            item.num = roundedPersents[i];
            item.value.innerHTML = `${item.num}%`;
        });

        panel.style.transform = `translate(${offsetX - 85}px, ${offsetY - 70}px)`;
    }


    return {
        setLoading,
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



