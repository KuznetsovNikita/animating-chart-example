import { ChangeKind, DataService } from "src/data/service";
import { Time, toTime } from "./time";

export interface Times {
    redrawTimes: (kind: ChangeKind) => void;
}
export function toTimes(
    gDates: SVGGElement,
    settings: DataService,
): Times {
    const minSpace = 80;
    let startIndex: number;
    let endIndex: number;
    let delta = 0;

    let dy: number;

    const { viewport: { height, width }, jsonData: { columns } } = settings;
    gDates.setAttribute('transform', `translate(0,${height})`);

    const times: Time[] = new Array(columns[0].length);

    settings.onDestroy(() => {
        times.forEach(item => item && item.destroy());
    });

    drawTimes();

    function hasValue(index: number) {
        return settings.jsonData.columns[0][index] != undefined;
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

    function destroy(index: number) {
        times[index].destroy();
        times[index] = undefined;
    }

    function drawTime(index: number) {
        times[index] = toTime(
            gDates,
            toValue(index),
            toLeftByIndex(index),
        );
    }

    function redrawTimes(kind: ChangeKind) {
        switch (kind) {
            case 'left': return moveOnScale(() => {
                maybeLeftScaleIn();
                maybeLeftScaleOut();
            });
            case 'right': return moveOnScale(() => {
                maybeRightScaleIn();
                maybeRightScaleOut();
            });
            case 'move': return move()
            default: return;
        }
    }

    function moveOnScale(scale: () => void) {
        const {
            timeRange: { start, end }
        } = settings;

        dy = width / (end - start);

        scale();
        maybeAddOrRemoveItem();

        for (let i = startIndex; i <= endIndex; i += delta) {
            times[i].setLeft(toLeftByIndex(i));
        }
    }

    function maybeAddOrRemoveItem() {
        const start = startIndex - delta;
        if (
            hasValue(start) &&
            toLeftByIndex(start) > 0
        ) {
            drawTime(start);
            startIndex = start;
            return;
        }

        const leftStart = toLeftByIndex(startIndex);
        if (leftStart < 0) {
            destroy(startIndex);
            startIndex = startIndex + delta;
            return;
        }

        const end = endIndex + delta;
        if (
            hasValue(end) &&
            toLeftByIndex(end) < width
        ) {
            drawTime(end);
            endIndex = end;
            return;
        }

        const leftEnd = toLeftByIndex(endIndex);
        if (leftEnd > width) {
            destroy(endIndex);
            endIndex = endIndex - delta;
            return;
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
            let newStart = 0;
            while (index >= startIndex) {
                const left = toLeftByIndex(index);

                if (times[index]) {
                    if (left < 0) {
                        destroy(index);
                    }
                    else {
                        newStart = index;
                    }
                }
                else {
                    if (left > 0) {
                        drawTime(index);
                        newStart = index;
                    }
                }

                index -= newDelta;
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
            let i = endIndex;
            let isRemove = false;
            let newStart = 0;
            while (toLeftByIndex(i) >= -20) {

                if (isRemove) {
                    if (times[i]) {
                        destroy(i);
                    }
                }
                else {
                    if (!times[i]) {
                        drawTime(i);
                    }
                    newStart = i;
                }

                isRemove = !isRemove;
                i -= delta;
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
            let newEnd = 0;
            while (index <= endIndex) {
                const left = toLeftByIndex(index);

                if (times[index]) {
                    if (left > width) {
                        destroy(index);
                    }
                    else {
                        newEnd = index;
                    }
                }
                else {
                    if (left < width) {
                        drawTime(index);
                        newEnd = index;
                    }
                }

                index += newDelta;
            }

            endIndex = newEnd;
            delta = newDelta;
        }
    }

    function maybeRightScaleOut() {
        const newDelta = delta * 2;
        const index = startIndex + delta
        if (
            hasValue(index) &&
            (toValue(index) - toValue(startIndex)) * dy < minSpace
        ) {

            let i = startIndex;
            let isRemove = false;
            let newEnd = 0;
            while (toLeftByIndex(i) <= width + 20) {
                if (isRemove) {
                    if (times[i]) {
                        destroy(i);
                    }
                }
                else {
                    if (!times[i]) {
                        drawTime(i);
                    }
                    newEnd = i;
                }

                isRemove = !isRemove;
                i += delta;
            }

            endIndex = newEnd;
            delta = newDelta;
        }
    }

    function maybeMoveStart() {
        const start = startIndex - delta;
        if (
            hasValue(start) &&
            toLeftByIndex(start) > -20
        ) {
            const time = times[endIndex];
            times[endIndex] = undefined;
            endIndex -= delta;

            time.update(toValue(start), toLeftByIndex(start));
            times[start] = time;
            startIndex = start;

            maybeMoveStart();
        }
    }

    function maybeMoveEnd() {
        const end = endIndex + delta;
        if (
            hasValue(end) &&
            toLeftByIndex(end) < width + 20
        ) {
            const time = times[startIndex];
            times[startIndex] = undefined;
            startIndex += delta;

            time.update(toValue(end), toLeftByIndex(end));
            times[end] = time;
            endIndex = end;

            maybeMoveEnd();
        }
    }

    function move() {
        maybeMoveStart();
        maybeMoveEnd();

        for (let i = startIndex; i <= endIndex; i += delta) {
            times[i].setLeft(toLeftByIndex(i));
        }
    }

    function drawTimes() {
        const { indexRange, timeRange } = settings;
        dy = width / (timeRange.end - timeRange.start);

        const firstSpace = 20;
        startIndex = indexRange.start;
        while (toLeftByIndex(startIndex) < firstSpace) {
            startIndex++;
        }

        let deltaIndex = -1;
        while (toLeftByIndex(startIndex + delta) < minSpace + firstSpace) {
            deltaIndex++;
            delta = Math.pow(2, deltaIndex);
        }

        endIndex = startIndex;
        while (
            hasValue(endIndex + delta) &&
            toLeftByIndex(endIndex) <= width
        ) {
            endIndex += delta;
        }

        for (let i = startIndex; i <= endIndex; i += delta) {
            drawTime(i);
        }
    }

    return {
        redrawTimes,
    }
}
