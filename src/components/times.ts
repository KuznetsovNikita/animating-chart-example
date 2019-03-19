import { ChangeKind, DataService } from "src/data/service";
import { Time, toTime } from "./time";


export class Times {
    minSpace = 80;

    startIndex: number;
    endIndex: number;
    delta = 0;

    times: Time[];

    dy: number;

    constructor(
        private gDates: SVGGElement,
        private settings: DataService,
    ) {
        const { viewport: { height }, jsonData: { columns } } = this.settings;
        this.gDates.setAttribute('transform', `translate(0,${height})`);

        this.times = new Array(columns[0].length);

        this.drawTimes();
    }

    redrawTimes(kind: ChangeKind) {
        switch (kind) {
            case 'left': return this.moveOnScale(() => {
                this.maybeLeftScaleIn();
                this.maybeLeftScaleOut();
            });
            case 'right': return this.moveOnScale(() => {
                this.maybeRightScaleIn();
                this.maybeRightScaleOut();
            });
            case 'move': return this.move()
            default: return;
        }
    }

    moveOnScale(scale: () => void) {
        const {
            viewport: { width },
            timeRange: { start, end }
        } = this.settings;

        this.dy = width / (end - start);

        scale();
        this.maybeAddOrRemoveItem();

        for (let i = this.startIndex; i <= this.endIndex; i += this.delta) {
            this.times[i].setLeft(this.toLeftByIndex(i));
        }
    }

    hasValue = (index: number) =>
        this.settings.jsonData.columns[0][index] != undefined;

    toValue = (index: number) =>
        this.settings.jsonData.columns[0][index] as number;

    toLeftByIndex = (index: number) =>
        this.toLeftByValue(this.toValue(index));

    toLeftByValue = (value: number) =>
        (value - this.settings.timeRange.start) * this.dy;

    destroy = (index: number) => {
        this.times[index].destroy();
        this.times[index] = undefined;
    }

    drawTime = (index: number) => {
        this.times[index] = toTime(
            this.gDates,
            this.toValue(index),
            this.toLeftByIndex(index),
        );
    }


    maybeAddOrRemoveItem() {
        const { viewport: { width } } = this.settings;

        const start = this.startIndex - this.delta;
        if (
            this.hasValue(start) &&
            this.toLeftByIndex(start) > 0
        ) {
            this.drawTime(start);
            this.startIndex = start;
            return;
        }

        const leftStart = this.toLeftByIndex(this.startIndex);
        if (leftStart < 0) {
            this.destroy(this.startIndex);
            this.startIndex = this.startIndex + this.delta;
            return;
        }

        const end = this.endIndex + this.delta;
        if (
            this.hasValue(end) &&
            this.toLeftByIndex(end) < width
        ) {
            this.drawTime(end);
            this.endIndex = end;
            return;
        }

        const leftEnd = this.toLeftByIndex(this.endIndex);
        if (leftEnd > width) {
            this.destroy(this.endIndex);
            this.endIndex = this.endIndex - this.delta;
            return;
        }
    }

    maybeLeftScaleIn() {
        const delta = Math.max(1, this.delta / 2);
        let index = this.endIndex - delta;
        if (
            this.hasValue(index) &&
            (this.toValue(this.endIndex) - this.toValue(index)) * this.dy > this.minSpace
        ) {
            let newStart = 0;
            while (index >= this.startIndex) {
                const left = this.toLeftByIndex(index);

                if (this.times[index]) {
                    if (left < 0) {
                        this.destroy(index);
                    }
                    else {
                        newStart = index;
                    }
                }
                else {
                    if (left > 0) {
                        this.drawTime(index);
                        newStart = index;
                    }
                }

                index -= delta;
            }

            this.startIndex = newStart;
            this.delta = delta;
        }
    }

    maybeLeftScaleOut() {

        const delta = this.delta * 2;
        const index = this.endIndex - this.delta;
        if (
            this.hasValue(index) &&
            (this.toValue(this.endIndex) - this.toValue(index)) * this.dy < this.minSpace
        ) {
            let i = this.endIndex;
            let isRemove = false;
            let newStart = 0;
            while (this.toLeftByIndex(i) >= 0) {

                if (isRemove) {
                    if (this.times[i]) {
                        this.destroy(i);
                    }
                }
                else {
                    if (!this.times[i]) {
                        this.drawTime(i);
                    }
                    newStart = i;
                }

                isRemove = !isRemove;
                i -= this.delta;
            }

            this.startIndex = newStart;
            this.delta = delta;
        }
    }

    maybeRightScaleIn() {
        const { viewport: { width } } = this.settings;

        const delta = Math.max(1, this.delta / 2);
        let index = this.startIndex + delta;
        if (
            this.hasValue(index) &&
            (this.toValue(index) - this.toValue(this.startIndex)) * this.dy > this.minSpace
        ) {
            let newEnd = 0;
            while (index <= this.endIndex) {
                const left = this.toLeftByIndex(index);

                if (this.times[index]) {
                    if (left > width) {
                        this.destroy(index);
                    }
                    else {
                        newEnd = index;
                    }
                }
                else {
                    if (left < width) {
                        this.drawTime(index);
                        newEnd = index;
                    }
                }

                index += delta;
            }

            this.endIndex = newEnd;
            this.delta = delta;
        }
    }

    maybeRightScaleOut() {
        const { viewport: { width } } = this.settings;

        const delta = this.delta * 2;
        const index = this.startIndex + this.delta
        if (
            this.hasValue(index) &&
            (this.toValue(index) - this.toValue(this.startIndex)) * this.dy < this.minSpace
        ) {

            let i = this.startIndex;
            let isRemove = false;
            let newEnd = 0;
            while (this.toLeftByIndex(i) <= width) {
                if (isRemove) {
                    if (this.times[i]) {
                        this.destroy(i);
                    }
                }
                else {
                    if (!this.times[i]) {
                        this.drawTime(i);
                    }
                    newEnd = i;
                }

                isRemove = !isRemove;
                i += this.delta;
            }

            this.endIndex = newEnd;
            this.delta = delta;
        }
    }

    maybeMoveStart() {
        const start = this.startIndex - this.delta;
        if (
            this.hasValue(start) &&
            this.toLeftByIndex(start) > 0
        ) {
            this.drawTime(start);
            this.destroy(this.endIndex);
            this.endIndex -= this.delta;
            this.startIndex = start;

            this.maybeMoveStart();
        }
    }

    maybeMoveEnd() {
        const { viewport: { width } } = this.settings;
        const end = this.endIndex + this.delta;
        if (
            this.hasValue(end) &&
            this.toLeftByIndex(end) < width
        ) {
            this.drawTime(end);
            this.destroy(this.startIndex);
            this.startIndex += this.delta;
            this.endIndex = end;

            this.maybeMoveEnd();
        }
    }

    move() {
        this.maybeMoveStart();
        this.maybeMoveEnd();

        for (let i = this.startIndex; i <= this.endIndex; i += this.delta) {
            this.times[i].setLeft(this.toLeftByIndex(i));
        }
    }

    drawTimes() {
        const {
            viewport: { width },
            indexRange, timeRange
        } = this.settings;

        this.dy = width / (timeRange.end - timeRange.start);

        const firstSpace = 20;
        this.startIndex = indexRange.start;
        while (this.toLeftByIndex(this.startIndex) < firstSpace) {
            this.startIndex++;
        }

        let deltaIndex = -1;
        while (this.toLeftByIndex(this.startIndex + this.delta) < this.minSpace + firstSpace) {
            deltaIndex++;
            this.delta = Math.pow(2, deltaIndex);
        }

        this.endIndex = this.startIndex;
        while (
            this.hasValue(this.endIndex + this.delta) &&
            this.toLeftByIndex(this.endIndex) <= width
        ) {
            this.endIndex += this.delta;
        }

        for (let i = this.startIndex; i <= this.endIndex; i += this.delta) {
            this.drawTime(i);
        }
    }
}
