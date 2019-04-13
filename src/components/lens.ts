import { Range } from 'src/data/models';
import { DataService } from 'src/data/service';
import { toDiv } from '../data/common';

export function drawLens(
    element: HTMLDivElement,
    settings: DataService,
) {
    const lens = toDiv(element, 'lens');
    const coverLeft = toDiv(element, 'cover');
    coverLeft.style.left = '0px';
    const coverRight = toDiv(element, 'cover');
    coverRight.style.right = '0px';

    const left = document.createElement('span');
    lens.appendChild(left);
    left.style.left = '-5px';
    const right = document.createElement('span');
    lens.appendChild(right);
    right.style.right = '-5px';

    const {
        miniMap,
        miniMap: { viewport: { width } },
    } = settings;

    let dX = width / (miniMap.timeRange.end - miniMap.timeRange.start);

    function zoomin(range: Range) {
        dX = width / (miniMap.timeRange.end - miniMap.timeRange.start);

        setStyle(range);
    }
    settings.onZoom(zoomin);
    settings.onPieZoom(zoomin);

    let disabled = false;
    function toggleDisable() {
        disabled = !disabled;
    }
    settings.onZoomStart(toggleDisable);
    settings.onDrawPersent(toggleDisable);
    settings.onDrawPie(toggleDisable);

    const setStyle = (range: Range) => {
        const width = Math.floor((range.end - range.start) * dX);
        const left = Math.floor((range.start - miniMap.timeRange.start) * dX);
        lens.style.width = width + 'px';
        lens.style.left = left + 'px';

        coverLeft.style.width = left + 'px';
        coverRight.style.left = left + width + 'px';
    };
    // set initial style
    setStyle(settings.timeRange);

    // update style on change
    settings.onTimeRangeChange((_, range) => setStyle(range));

    function onMousedown(target: EventTarget, startX: number) {
        settings.isMove = true;
        const startWidth = (settings.timeRange.end - settings.timeRange.start) * dX;
        const startLeft = (settings.timeRange.start - miniMap.timeRange.start) * dX;

        function moveAt(clientX: number) {
            switch (target) {
                case left: {
                    if (disabled) return;
                    const newLeft = Math.min(Math.max(startLeft + clientX - startX, 0), startLeft + startWidth - 20);
                    if (newLeft === startLeft) return;

                    settings.setTimeRange('left', {
                        start: Math.floor(miniMap.timeRange.start + newLeft / dX),
                        end: settings.timeRange.end,
                    });
                    break;
                }
                case right: {
                    if (disabled) return;
                    const newWidth = Math.min(width - startLeft, Math.max(20, startWidth + clientX - startX));
                    if (newWidth === startWidth) return;

                    settings.setTimeRange('right', {
                        start: settings.timeRange.start,
                        end: Math.floor(miniMap.timeRange.start + (startLeft + newWidth) / dX),
                    });
                    break;
                }
                default: {
                    const newLeft = Math.min(Math.max(startLeft + clientX - startX, 0), width - startWidth);
                    if (newLeft === startLeft) return;

                    settings.setTimeRange('move', {
                        start: Math.floor(miniMap.timeRange.start + newLeft / dX),
                        end: Math.floor(miniMap.timeRange.start + (newLeft + startWidth) / dX),
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
            settings.isMove = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('touchmove', onTouchMove);
            document.removeEventListener('mouseup', onEnd);
            lens.removeEventListener('touchend', onEnd);
        }

        document.addEventListener('mouseup', onEnd);
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

}

