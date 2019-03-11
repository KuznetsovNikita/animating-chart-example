import { Action, JsonData, Settings } from "../data";


export default class Lens {
    constructor(
        jsonData: JsonData,
        element: HTMLDivElement,
        settings: Settings,
        dispatcher: (action: Action) => void,
        private lens = document.createElement('div'),
    ) {
        element.appendChild(this.lens);
        lens.className = 'lens';

        const [_, ...timestamps] = jsonData.columns.find(([type]) => type === 'x');

        const start = timestamps[0];
        const end = timestamps[timestamps.length - 1];

        const { miniMap: { width }, timeRange } = settings;

        const dX = width / (end - start);


        let styleWidth = (timeRange.end - timeRange.start) * dX;
        let styleLeft = (timeRange.start - start) * dX;

        lens.style.width = Math.floor(styleWidth) + 'px';
        lens.style.left = Math.floor(styleLeft) + 'px';

        lens.onmousedown = function (startEvent) {
            const startX = startEvent.offsetX;

            function moveAt(event: MouseEvent) {
                if (event.target != lens) return;
                const newStyleLeft = Math.min(Math.max(styleLeft + event.offsetX - startX, 0), width - styleWidth);
                if (newStyleLeft === styleLeft) return;
                styleLeft = newStyleLeft;
                lens.style.left = Math.floor(styleLeft) + 'px';

                dispatcher({
                    kind: 'time-range', data: {
                        start: Math.floor(start + styleLeft / dX),
                        end: Math.floor(start + (styleLeft + styleWidth) / dX),
                    }
                })
            }

            let lastUpdateCall: number;
            document.onmousemove = (e) => {
                if (lastUpdateCall) cancelAnimationFrame(lastUpdateCall)
                lastUpdateCall = requestAnimationFrame(() => moveAt(e));
            }

            lens.onmouseup = lens.onmouseleave = function () {
                document.onmousemove = null;
                lens.onmouseup = null;
                lens.onmouseleave = null;
            }
        }

        const left = document.createElement('span');
        lens.appendChild(left);

        left.className = 'left';

        const right = document.createElement('span');
        lens.appendChild(right);

        right.className = 'right';
    }
}