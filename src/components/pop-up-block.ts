import { days, month } from "../data/const";
import { DataService } from "../data/service";

interface Value {
    block: SVGGElement;
    name: SVGTextElement;
    value: SVGTextElement;
    key: string;
}

export class PopUpBlock {
    values: Value[];
    panelHeight: number;

    constructor(
        private setting: DataService,
        private g: SVGGElement,
        private panel = document.createElementNS("http://www.w3.org/2000/svg", "g"),
        private rect = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
        private shadow = document.createElementNS("http://www.w3.org/2000/svg", "rect"),
        private date = document.createElementNS("http://www.w3.org/2000/svg", "text"),
    ) {
        const {
            jsonData: { columns, colors, names }
        } = this.setting;
        const [_, ...lines] = columns;
        this.g.appendChild(panel);

        panel.appendChild(shadow);
        panel.appendChild(rect);

        this.panelHeight = (25 + Math.ceil(lines.length / 2) * 40);
        rect.setAttribute('height', this.panelHeight.toString());
        rect.setAttribute('width', '120');
        rect.setAttribute('rx', '10');
        rect.setAttribute('ry', '10');
        rect.classList.add('rect');

        shadow.setAttribute('height', this.panelHeight.toString());
        shadow.setAttribute('width', '120');
        shadow.setAttribute('x', '1');
        shadow.setAttribute('y', '1');
        shadow.setAttribute('rx', '10');
        shadow.setAttribute('ry', '10');
        shadow.classList.add('shadow');

        panel.appendChild(date);

        date.setAttribute('x', '10');
        date.setAttribute('y', '18');
        date.classList.add('date')

        function blockPosition(block: SVGGElement, index: number) {
            block.setAttribute('transform', `translate(${10 + index % 2 * 50},${20 + 40 * Math.floor(index / 2)})`);
        }

        this.values = lines.map((item, index) => {

            const block = document.createElementNS("http://www.w3.org/2000/svg", "g");
            panel.appendChild(block);
            blockPosition(block, index);

            const value = document.createElementNS("http://www.w3.org/2000/svg", "text");
            const name = document.createElementNS("http://www.w3.org/2000/svg", "text");
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


        this.setting.onVisibilityChange(key => {
            const values: Value[] = [];
            this.values.forEach(item => {
                if (item.key === key) item.block.classList.toggle('invisible');
                if (this.setting.visibility[item.key]) values.push(item);
            });
            if (values.length === 0) {
                this.panel.classList.add('invisible');
            }
            else {
                this.panel.classList.remove('invisible');
                values.forEach((item, i) => blockPosition(item.block, i));
                this.panelHeight = (25 + Math.ceil(values.length / 2) * 40);
                rect.setAttribute('height', this.panelHeight.toString());
                shadow.setAttribute('height', this.panelHeight.toString());
            }
        })
    }

    setData(time: number, index: number, positionX: number, offsetY: number) {
        const { jsonData: { columns }, viewport: { height, width } } = this.setting;
        const [_, ...lines] = columns;

        const date = new Date(time);
        this.date.innerHTML = `${days[date.getDay()]}, ${date.getDate()} ${month[date.getMonth()]}`;

        this.values.forEach((item, i) => {
            let value = lines[i][index].toString();
            item.value.innerHTML = value.length > 4
                ? value.substr(0, value.length - 3) + 'k'
                : value;
        });

        const y = offsetY > height / 2 ? 20 : height - 20 - this.panelHeight;
        const x = Math.min(Math.max(positionX - 20, 0), width - 120);
        this.panel.setAttribute('transform', `translate(${x},${y})`);
    }

    destroy() {
        this.g.removeChild(this.panel);
        this.g.removeChild(this.rect);
        this.g.removeChild(this.shadow);
        this.g.removeChild(this.date);
        this.values.forEach(item => this.g.removeChild(item.block));
        this.g = null;
    }
}