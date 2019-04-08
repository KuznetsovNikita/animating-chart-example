import { ChangeKind, DataService } from 'src/data/service';
import { month } from '../data/const';

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

    drawTimes();

    function hasValue(index: number) {
        return settings.jsonData.columns[0][index] !== undefined;
    }

    function toValue(index: number) {
        return settings.jsonData.columns[0][index] as number;
    }

    function toLeftByIndex(index: number) {
        return toLeftByValue(toValue(index));
    }

    function toLeftByValue(value: number) {
        return (value - settings.timeRange.start) * dy;
    }

    function drawTime(index: number) {
        const date = new Date(toValue(index));
        context.fillText(
            `${date.getDate()} ${month[date.getMonth()]}`,
            toLeftByIndex(index) * devicePixelRatio,
            (height + 15) * devicePixelRatio,
        );
    }

    function redraw() {
        context.clearRect(0, height * devicePixelRatio, width * devicePixelRatio, 20 * devicePixelRatio);
        context.fillStyle = 'rgba(37, 37, 41, 0.5)';
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

    function drawTimes() {
        const { indexRange, timeRange } = settings;
        dy = width / (timeRange.end - timeRange.start);

        startIndex = indexRange.start;
        while (toLeftByIndex(startIndex) < firstSpace) {
            startIndex++;
        }

        let deltaIndex = -1;
        while (toLeftByIndex(startIndex + delta) < minSpace + firstSpace) {
            deltaIndex++;
            delta = Math.pow(2, deltaIndex);
        }
        startIndex -= delta;
        endIndex = startIndex;
        while (
            hasValue(endIndex + delta) &&
            toLeftByIndex(endIndex) <= width
        ) {
            endIndex += delta;
        }
        redraw();
    }

    return {
        rdt,
    };
}
