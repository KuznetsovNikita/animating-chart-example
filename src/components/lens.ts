import { TimeRange } from "src/data/models";
import { DataService } from "src/data/service";


export function drawLens(
    element: HTMLDivElement,
    settings: DataService,
) {
    const lens = document.createElement('div');
    element.appendChild(lens);
    lens.className = 'lens';

    const coverLeft = document.createElement('div');
    element.appendChild(coverLeft);
    coverLeft.className = 'cover';
    coverLeft.style.left = '0px';

    const coverRight = document.createElement('div');
    element.appendChild(coverRight);
    coverRight.className = 'cover';
    coverRight.style.right = '0px';

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
        const width = Math.floor((range.end - range.start) * dX);
        const left = Math.floor((range.start - start) * dX);
        lens.style.width = width + 'px';
        lens.style.left = left + 'px';

        coverLeft.style.width = left + 'px';
        coverRight.style.left = left + width + 'px';
    }
    // set initial style
    setStyle(timeRange);

    // update style on change
    settings.onTimeRangeChange(setStyle);

    function onMousedown(target: EventTarget, startX: number) {
        const startWidth = (settings.timeRange.end - settings.timeRange.start) * dX;
        const startLeft = (settings.timeRange.start - start) * dX;

        function moveAt(clientX: number) {
            switch (target) {
                case left: {
                    const left = Math.min(Math.max(startLeft + clientX - startX, 0), startLeft + startWidth);
                    if (left === startLeft) return;

                    settings.setTimeRange({
                        start: Math.floor(start + left / dX),
                        end: settings.timeRange.end,
                    });
                    break;
                }
                case right: {
                    const newWidth = Math.min(width - startLeft, Math.max(0, startWidth + clientX - startX))
                    if (newWidth === startWidth) return;

                    settings.setTimeRange({
                        start: settings.timeRange.start,
                        end: Math.floor(start + (startLeft + newWidth) / dX),
                    });
                    break;
                }
                default: {
                    const left = Math.min(Math.max(startLeft + clientX - startX, 0), width - startWidth);
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
        function onMove(clientX: number) {
            if (lastUpdateCall) cancelAnimationFrame(lastUpdateCall)
            lastUpdateCall = requestAnimationFrame(() => moveAt(clientX));
        }

        function onMouseMove(event: MouseEvent) {
            event.stopPropagation();
            event.preventDefault();
            onMove(event.clientX);
        }
        function onTouchMove(event: TouchEvent) {
            if (event.targetTouches.length == 1) {
                event.stopPropagation();
                event.preventDefault();
                onMove(event.targetTouches[0].clientX);
            }
        }

        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("touchmove", onTouchMove);

        function onEnd() {
            document.removeEventListener("mousemove", onMouseMove);
            document.removeEventListener("touchmove", onTouchMove);
            lens.removeEventListener("mouseup", onEnd);
            lens.removeEventListener("touchend", onEnd);
        }

        lens.addEventListener("mouseup", onEnd);
        lens.addEventListener("touchend", onEnd);
    }

    lens.addEventListener("mousedown", event => {
        event.stopPropagation();
        event.preventDefault();
        onMousedown(event.target, event.clientX);
    }

    );
    lens.addEventListener("touchstart", event => {
        if (event.targetTouches.length == 1) {
            event.stopPropagation();
            event.preventDefault();
            onMousedown(event.targetTouches[0].target, event.targetTouches[0].clientX);
        }
    });
}

