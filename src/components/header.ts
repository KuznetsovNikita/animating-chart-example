import { day, days, month, toDiv } from '../data/common';
import { DataService } from '../models/service';

function formatTime(settings: DataService): string {
    if (settings.isZoom) {
        const d = new Date(settings.timeRange.start + (settings.isPercentage ? 0 : day / 2));
        return `${days[d.getUTCDay()]}, ${d.getUTCDate()} ${month[d.getMonth()]} ${d.getFullYear()}`;
    }
    else {
        const s = new Date(settings.timeRange.start);
        const e = new Date(settings.timeRange.end);
        return `${s.getUTCDate()} ${month[s.getMonth()]} ${s.getFullYear()} - ${e.getUTCDate()} ${month[e.getMonth()]} ${e.getFullYear()}`;
    }
}

export function toHeader(
    container: HTMLDivElement,
    settings: DataService,
    width: number,
) {
    const header = toDiv(container, 'header');
    header.innerHTML = `<h1>Chart ${settings.url}</h1>`;

    if (width < 400) header.classList.add('double');

    const zoomOut = toDiv(header, 'zoom');
    zoomOut.innerHTML = '<svg class="loupe" height="27" width="27"><circle cx="12" cy="12" r="9"></circle><line x1="7" x2="17" y1="12" y2="12"></line><line x1="19" x2="27" y1="19" y2="27"></line></svg><span>Zoom Out</span>';

    const dateRange = toDiv(header, 'range');

    function changeTime() {
        set(formatTime(settings));
    }

    settings.onTimeRangeChange(changeTime);
    settings.onZoom(changeTime);
    settings.onPieZoom(changeTime);

    let shouldUpdateZooming = false;
    function toggleZoom() {
        shouldUpdateZooming = true;
    }
    settings.onZoomStart(toggleZoom);
    settings.onDrawPie(toggleZoom);
    settings.onDrawPersent(toggleZoom);


    zoomOut.onclick = () => {
        if (!shouldUpdateZooming) {
            settings.unzoom();
        }
    };

    settings.onDestroy(() => {
        zoomOut.onclick = null;
    });

    const one = toDiv(dateRange, 'changer');
    one.innerHTML = formatTime(settings);
    const two = toDiv(dateRange, 'changer');
    two.classList.add('hide');

    let isActiveFirst = true;
    let isActive = false;
    let shouldUpdate = false;
    let value = '';

    let timer = null;
    function set(newValue: string) {
        if (value === newValue) return;
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
            value = newValue;
            if (isActive) {
                shouldUpdate = true;
            }
            else {
                update();
            }
        }, 35);
    }

    function update() {
        isActiveFirst ? change(one, two) : change(two, one);
    }

    function change(hide: HTMLDivElement, show: HTMLDivElement) {
        isActive = true;
        isActiveFirst = !isActiveFirst;

        show.innerHTML = value;

        show.classList.add('animation');
        hide.classList.add('animation');

        show.classList.remove('hide');
        hide.classList.add('hiding');

        const isUpdatedZoom = shouldUpdateZooming;
        if (shouldUpdateZooming) {
            header.classList.toggle('in-zoom');
            shouldUpdateZooming = false;
        }

        setTimeout(() => {

            hide.classList.add('hide');
            hide.classList.remove('hiding', 'animation');
            show.classList.remove('animation');

            if (isUpdatedZoom) {
                show.classList.toggle('reverse');
                hide.classList.toggle('reverse');
            }

            setTimeout(() => {
                isActive = false;
                if (shouldUpdate) {
                    shouldUpdate = false;
                    update();
                }
            }, 50);
        }, 300);

    }
}
