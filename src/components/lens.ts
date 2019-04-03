import { Range } from 'src/data/models';
import { DataService } from 'src/data/service';

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
    left.style.left = '-5px';

    const right = document.createElement('span');
    lens.appendChild(right);
    right.style.right = '-5px';

    const {
        miniMap: {
            viewport: { width },
            timeRange: { start, end },
        },
        timeRange,
    } = settings;

    const dX = width / (end - start);

    const setStyle = (range: Range) => {
        const width = Math.floor((range.end - range.start) * dX);
        const left = Math.floor((range.start - start) * dX);
        lens.style.width = width + 'px';
        lens.style.left = left + 'px';

        coverLeft.style.width = left + 'px';
        coverRight.style.left = left + width + 'px';
    };
    // set initial style
    setStyle(timeRange);

    // update style on change
    settings.onTimeRangeChange((_, range) => setStyle(range));

    function onMousedown(target: EventTarget, startX: number) {
        const startWidth = (settings.timeRange.end - settings.timeRange.start) * dX;
        const startLeft = (settings.timeRange.start - start) * dX;

        function moveAt(clientX: number) {
            switch (target) {
                case left: {
                    const newLeft = Math.min(Math.max(startLeft + clientX - startX, 0), startLeft + startWidth - 20);
                    if (newLeft === startLeft) return;

                    settings.setTimeRange('left', {
                        start: Math.floor(start + newLeft / dX),
                        end: settings.timeRange.end,
                    });
                    break;
                }
                case right: {
                    const newWidth = Math.min(width - startLeft, Math.max(20, startWidth + clientX - startX));
                    if (newWidth === startWidth) return;

                    settings.setTimeRange('right', {
                        start: settings.timeRange.start,
                        end: Math.floor(start + (startLeft + newWidth) / dX),
                    });
                    break;
                }
                default: {
                    const newLeft = Math.min(Math.max(startLeft + clientX - startX, 0), width - startWidth);
                    if (newLeft === startLeft) return;

                    settings.setTimeRange('move', {
                        start: Math.floor(start + newLeft / dX),
                        end: Math.floor(start + (newLeft + startWidth) / dX),
                    });
                    break;
                }
            }
        }

        let lastUpdateCall: number;
        function onMove(clientX: number) {
            if (lastUpdateCall) cancelAnimationFrame(lastUpdateCall);
            lastUpdateCall = requestAnimationFrame(() => moveAt(clientX));
        }

        function onMouseMove(event: MouseEvent) {
            event.stopPropagation();
            event.preventDefault();
            onMove(event.clientX);
        }
        function onTouchMove(event: TouchEvent) {
            if (event.targetTouches.length === 1) {
                event.stopPropagation();
                event.preventDefault();
                onMove(event.targetTouches[0].clientX);
            }
        }

        document.addEventListener(
            'mousemove', onMouseMove,
        );
        document.addEventListener(
            'touchmove', onTouchMove,
            { passive: false },
        );

        function onEnd() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
            lens.removeEventListener('mouseup', onEnd);
            element.addEventListener('mouseleave', onEnd);
            lens.removeEventListener('touchend', onEnd);
        }

        lens.addEventListener('mouseup', onEnd);
        element.addEventListener('mouseleave', onEnd);
        lens.addEventListener('touchend', onEnd);
    }

    lens.addEventListener('mousedown', event => {
        event.stopPropagation();
        event.preventDefault();
        onMousedown(event.target, event.clientX);
    });

    lens.addEventListener('touchstart', event => {
        if (event.targetTouches.length === 1) {
            event.stopPropagation();
            event.preventDefault();
            onMousedown(event.targetTouches[0].target, event.targetTouches[0].clientX);
        }
    }, { passive: false });


    // function disableEvent(e: Event) {
    //     e.stopPropagation();
    //     e.preventDefault();
    // }
    // coverLeft.addEventListener('touchmove', disableEvent, { passive: false });
    // coverLeft.addEventListener('touchstart', disableEvent, { passive: false });
    // coverRight.addEventListener('touchmove', disableEvent, { passive: false });
    // coverRight.addEventListener('touchstart', disableEvent, { passive: false });
}

