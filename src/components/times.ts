import { ChangeKind, DataService } from 'src/data/service';
import { month } from '../data/const';
import { Range } from '../data/models';

export interface Times {
    rdt: (kind: ChangeKind) => void;
}

export function toTimes(
    context: CanvasRenderingContext2D,
    settings: DataService,
): Times {
    const devicePixelRatio = window.devicePixelRatio;
    context.font = (10 * devicePixelRatio) + 'px Arial';

    const viewportSpace = 30;
    const minSpace = 70;
    const firstSpace = 20;

    let startIndex: number;
    let endIndex: number;
    let delta = 0;

    let dy: number;

    const { viewport: { height, width } } = settings;
    let jsonData = settings.jsonData;

    settings.onChangeStyle(() => redraw());

    let globalAlpha = 1;
    settings.onZoomStart((data, endIndexRanage, endTimeRange) => {
        jsonData = data;
        dy = width / (endTimeRange.end - endTimeRange.start);
        globalAlpha = 0;
        countIndexes(endIndexRanage, endTimeRange);
    });

    settings.onZoom((range) => {
        dy = width / (range.end - range.start);
        redraw();
    });


    countIndexes(settings.indexRange, settings.timeRange);
    redraw();

    function hasValue(index: number) {
        return jsonData.columns[0][index] !== undefined;
    }

    function toValue(index: number) {
        return jsonData.columns[0][index] as number;
    }

    function toLeftByIndex(index: number) {
        return toLeftByIndexAndRange(index, settings.timeRange);
    }

    function toLeftByIndexAndRange(index: number, timeRange: Range) {
        return (toValue(index) - timeRange.start) * (width / (timeRange.end - timeRange.start));
    }

    function formatValue(date: Date): string {
        return settings.isZoom
            ? `${("0" + (date.getUTCHours())).slice(-2)}:00`
            : `${date.getDate()} ${month[date.getMonth()]}`
    }

    function drawTime(index: number) {
        context.fillText(
            formatValue(new Date(toValue(index))),
            toLeftByIndex(index) * devicePixelRatio,
            (height + 15) * devicePixelRatio,
        );
    }

    function redraw() {
        globalAlpha = Math.min(globalAlpha + 0.05, 1);
        context.clearRect(0, height * devicePixelRatio, width * devicePixelRatio, 20 * devicePixelRatio);
        context.fillStyle = settings.style.text;
        context.globalAlpha = globalAlpha;
        for (let i = startIndex; i <= endIndex; i += delta) {
            drawTime(i);
        }
    }
    let lastUpdate = null;
    function rdt(kind: ChangeKind) {
        if (lastUpdate !== null) cancelAnimationFrame(lastUpdate);
        lastUpdate = requestAnimationFrame(() => {
            switch (kind) {
                case 'left': return moveOnScale(() => {
                    maybeLeftScaleIn();
                    maybeLeftScaleOut();
                });
                case 'right': return moveOnScale(() => {
                    maybeRightScaleIn();
                    maybeRightScaleOut();
                });
                case 'move': return move();
                default: return;
            }
        });
    }

    function moveOnScale(scale: () => void) {
        const { timeRange } = settings;

        dy = width / (timeRange.end - timeRange.start);

        scale();
        maybeAddOrRemoveItem();
        redraw();
    }

    function maybeAddOrRemoveItem() {
        const start = startIndex - delta;
        if (hasValue(start) && toLeftByIndex(start) > -viewportSpace) {
            startIndex = start;
        }

        const leftStart = toLeftByIndex(startIndex);
        if (leftStart < -viewportSpace) {
            startIndex = startIndex + delta;
        }

        const end = endIndex + delta;
        if (hasValue(end) && toLeftByIndex(end) < width + viewportSpace
        ) {
            endIndex = end;
        }

        const leftEnd = toLeftByIndex(endIndex);
        if (leftEnd > width + viewportSpace) {
            endIndex = endIndex - delta;
        }
    }

    function maybeLeftScaleIn() {
        if (delta === 1) return;
        const newDelta = delta / 2;
        let index = endIndex - newDelta;
        if (
            hasValue(index) &&
            (toValue(endIndex) - toValue(index)) * dy > minSpace
        ) {
            let newStart = index;
            while (toLeftByIndex(newStart) >= -viewportSpace) {
                newStart -= newDelta;
            }

            startIndex = newStart;
            delta = newDelta;
        }
    }

    function maybeLeftScaleOut() {
        const newDelta = delta * 2;
        const index = endIndex - delta;
        if (
            hasValue(index) &&
            (toValue(endIndex) - toValue(index)) * dy < minSpace
        ) {

            let newStart = endIndex;
            while (toLeftByIndex(newStart) >= -viewportSpace) {
                newStart -= delta;
            }

            startIndex = newStart;
            delta = newDelta;
        }
    }

    function maybeRightScaleIn() {

        if (delta === 1) return;
        const newDelta = delta / 2;
        let index = startIndex + newDelta;
        if (
            hasValue(index) &&
            (toValue(index) - toValue(startIndex)) * dy > minSpace
        ) {
            let newEnd = index;
            while (toLeftByIndex(newEnd) <= width + viewportSpace) {
                newEnd += newDelta;
            }

            endIndex = newEnd;
            delta = newDelta;
        }
    }

    function maybeRightScaleOut() {
        const newDelta = delta * 2;
        const index = startIndex + delta;
        if (
            hasValue(index) &&
            (toValue(index) - toValue(startIndex)) * dy < minSpace
        ) {
            let newEnd = startIndex;
            while (toLeftByIndex(newEnd) <= width + viewportSpace) {
                newEnd += newDelta;
            }

            endIndex = newEnd;
            delta = newDelta;
        }
    }

    function maybeMoveStart() {
        const start = startIndex - delta;
        if (
            hasValue(start) &&
            toLeftByIndex(start) > -viewportSpace
        ) {
            endIndex -= delta;
            startIndex = start;

            maybeMoveStart();
        }
    }

    function maybeMoveEnd() {
        const end = endIndex + delta;
        if (
            hasValue(end) &&
            toLeftByIndex(end) < width + viewportSpace
        ) {
            startIndex += delta;
            endIndex = end;

            maybeMoveEnd();
        }
    }

    function move() {
        maybeMoveStart();
        maybeMoveEnd();
        redraw();
    }

    function countIndexes(indexRange: Range, timeRange: Range) {
        dy = width / (timeRange.end - timeRange.start);

        startIndex = indexRange.start;
        while (toLeftByIndexAndRange(startIndex, timeRange) < firstSpace) {
            startIndex++;
        }
        delta = 1;
        while (toLeftByIndexAndRange(startIndex + delta, timeRange) < minSpace + firstSpace) {
            delta *= 2;
        }
        startIndex -= delta;
        endIndex = startIndex;
        while (
            hasValue(endIndex + delta) &&
            toLeftByIndexAndRange(endIndex, timeRange) <= width
        ) {
            endIndex += delta;
        }
    }

    return {
        rdt,
    };
}
