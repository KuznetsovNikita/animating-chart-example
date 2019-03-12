import { TimeRange } from "src/data/models";
import { DataService } from "src/data/service";


export function drawLens(
    element: HTMLDivElement,
    settings: DataService,
) {
    const lens = document.createElement('div');
    element.appendChild(lens);
    lens.className = 'lens';

    const left = document.createElement('span');
    lens.appendChild(left);
    left.style.left = '0px';

    const right = document.createElement('span');
    lens.appendChild(right);
    right.style.right = '0px';

    const [_, ...timestamps] = settings.jsonData.columns.find(([type]) => type === 'x');

    const start = timestamps[0];
    const end = timestamps[timestamps.length - 1];

    const { miniMap: { width }, timeRange } = settings;

    const dX = width / (end - start);

    const setStyle = (range: TimeRange) => {
        lens.style.width = Math.floor((range.end - range.start) * dX) + 'px';
        lens.style.left = Math.floor((range.start - start) * dX) + 'px';
    }
    // set initial style
    setStyle(timeRange);

    // update style on change
    settings.onTimeRangeChange(setStyle);

    lens.onmousedown = (startEvent) => {
        const target = startEvent.target;
        const startX = startEvent.clientX;
        const startWidth = (settings.timeRange.end - settings.timeRange.start) * dX;
        const startLeft = (settings.timeRange.start - start) * dX;

        const moveAt = (event: MouseEvent) => {
            switch (target) {
                case left: {
                    const left = Math.min(Math.max(startLeft + event.clientX - startX, 0), startLeft + startWidth);
                    if (left === startLeft) return;

                    settings.setTimeRange({
                        start: Math.floor(start + left / dX),
                        end: settings.timeRange.end,
                    });
                    break;
                }
                case right: {
                    const newWidth = Math.min(width - startLeft, Math.max(0, startWidth + event.clientX - startX))
                    if (newWidth === startWidth) return;

                    settings.setTimeRange({
                        start: settings.timeRange.start,
                        end: Math.floor(start + (startLeft + newWidth) / dX),
                    });
                    break;
                }
                default: {
                    const left = Math.min(Math.max(startLeft + event.clientX - startX, 0), width - startWidth);
                    if (left === startLeft) return;

                    settings.setTimeRange({
                        start: Math.floor(start + left / dX),
                        end: Math.floor(start + (left + startWidth) / dX),
                    });
                    break;
                }
            }
        }

        let lastUpdateCall: number;
        document.onmousemove = (event) => {
            if (lastUpdateCall) cancelAnimationFrame(lastUpdateCall)
            lastUpdateCall = requestAnimationFrame(() => moveAt(event));
        }

        lens.onmouseup = () => {
            document.onmousemove = null;
            lens.onmouseup = null;
        }
    }
}

