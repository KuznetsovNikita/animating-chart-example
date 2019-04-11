import { ar } from '../components/area';
import { plg } from '../components/poligon';
import { pl } from '../components/polyline';
import { devicePixelRatio } from '../data/const';
import { ChartItem, ChartsItem, Column, Dict, MaxMin, Range, ScalesChartItem, TimeColumn, UseDataFunction, Viewport } from './models';

export interface JsonData {
    columns: [TimeColumn, ...Array<Column>];
    types: Dict<string>;
    names: Dict<string>;
    colors: Dict<string>;
    y_scaled?: boolean;
    stacked?: boolean;
    percentage?: boolean;
}

interface MiniMap {
    viewport: Viewport;
    indexRange: Range;
    timeRange: Range;
}

export type ChangeKind = 'left' | 'right' | 'move' | 'visible';

export function toScalesItemOver(jsonData: JsonData, toItem: (color: string) => ScalesChartItem): ChartsItem {
    const items: ScalesChartItem[] = [];
    const scales: number[] = [];
    const actions: ('none' | 'in' | 'out')[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        const key = jsonData.columns[i][0];
        items.push(toItem(jsonData.colors[key]));
        scales.push(1);
        actions.push('none');
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport,
        opacity?: number,
    ) {
        items.forEach((item, index) => {
            item.drw(
                use, context, index + 1, toMax(index + 1)[1],
                toMax(index + 1)[0], viewport, scales, opacity,
            );
        });
    }

    function set(visible: boolean[]) {
        for (let i = 1; i < visible.length; i++) {
            actions[i - 1] = visible[i] ? 'in' : 'out';
        }
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport, opacity?: number,
    ) {
        actions.forEach((action, index) => {
            if (action === 'in') {
                scales[index] = Math.min(1, scales[index] + 0.1);
                if (scales[index] === 1) action = 'none';
            }

            if (action === 'out') {
                scales[index] = Math.max(0, scales[index] - 0.1);
                if (scales[index] === 0) action = 'none';
            }
        });
        items.forEach((item, index) => {
            if (scales[index] !== 0) {
                item.drw(
                    use, context, index + 1, toMax(index + 1)[1],
                    toMax(index + 1)[0], viewport, scales, opacity,
                );
            }
        });
    }

    return {
        drw,
        set,
        sc,
        setRange: () => { },
    };
}

function toItemsOver(
    jsonData: JsonData,
    toItem: (color: string, lineWidth?: number, opacity?: number) => ChartItem,
    lineWidth?: number,
    opacity?: number,
): ChartsItem {
    const items: ChartItem[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        const key = jsonData.columns[i][0];
        items.push(toItem(jsonData.colors[key], lineWidth, opacity));
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.drw(use, context, index + 1, toMax(index + 1)[1], toMax(index + 1)[0], viewport);
        });
    }

    function set(visible: boolean[]) {
        for (let i = 1; i < visible.length; i++) {
            items[i - 1].set(visible[i]);
        }
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.sc(use, context, index + 1, toMax(index + 1)[1], toMax(index + 1)[0], viewport);
        });
    }

    return {
        drw,
        set,
        sc,
        setRange: () => { },
    };
}

export interface Adapter {
    use: (
        jsonData: JsonData,
        index: number, visibility: boolean[], indexRange: Range, timeRange: Range,
        vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
        scales?: number[],
    ) => void;
    toMax: (jsonData: JsonData, visibility: boolean[], indexRange: Range) => MaxMin[];
}

function recountAndUseSimplePintsChart(
    jsonData: JsonData,
    index: number, _visibility: boolean[], indexRange: Range, timeRange: Range,
    vp: Viewport, min: number, max: number,

    use: (topX: number, topY: number, botX: number, botY: number) => void
) {
    const times = jsonData.columns[0];
    const dy = vp.height / (max - min);
    const dx = vp.width / (timeRange.end - timeRange.start);

    let botX = 0
    for (let i = indexRange.start; i <= indexRange.end; i++) {
        const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;
        const y = (vp.height - (jsonData.columns[index][i] as number - min) * dy) * devicePixelRatio;
        use(x, y, botX == 0 ? x : botX, vp.height * devicePixelRatio);
        botX = x;
    }
}

function toFastVisibleValue(jsonData: JsonData, visibility: boolean[], index: number): number {
    for (let i = 1; i < jsonData.columns.length; i++) {
        if (visibility[i]) {
            return jsonData.columns[i][index] as number;
        }
    }
    return 0;
}

function recountSimpleMax(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    let max = 10;
    for (let i = 1; i < jsonData.columns.length; i++) {
        if (visibility[i]) {
            for (let j = indexRange.start; j <= indexRange.end; j++) {
                max = Math.max(max, jsonData.columns[i][j] as number);
            }
        }
    }
    return [[Math.ceil(max / 10) * 10, 0]];
}

function recountSimpleMaxAndMin(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    let max = 10;
    let min = toFastVisibleValue(jsonData, visibility, indexRange.start);
    for (let i = 1; i < jsonData.columns.length; i++) {
        if (visibility[i]) {
            for (let j = indexRange.start; j <= indexRange.end; j++) {
                max = Math.max(max, jsonData.columns[i][j] as number);
                min = Math.min(min, jsonData.columns[i][j] as number);
            }
        }
    }
    return [[Math.ceil(max / 10) * 10, Math.floor(min / 10) * 10]];
}

function recountDoubleMax(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    const result: MaxMin[] = [];
    for (let i = 1; i < jsonData.columns.length; i++) {
        let max = 10;
        let min = 0;
        if (visibility[i]) {
            min = jsonData.columns[i][indexRange.start] as number;
            for (let j = indexRange.start; j <= indexRange.end; j++) {
                max = Math.max(max, jsonData.columns[i][j] as number);
                min = Math.min(min, jsonData.columns[i][j] as number)
            }
        }
        result.push([Math.ceil(max / 10) * 10, Math.floor(min / 10) * 10]);
    }
    let [[oneMax, oneMin], [twoMax, twoMin]] = result;
    oneMax > twoMax ? twoMax *= 1.2 : oneMax *= 1.2;
    return [[oneMax, oneMin], [twoMax, twoMin]];
}

function recountAndUseChartBySumm(
    jsonData: JsonData,
    index: number, _visibility: boolean[], indexRange: Range, timeRange: Range,
    vp: Viewport, min: number, max: number,

    use: (topX: number, topY: number, botX: number, botY: number) => void,
    scales?: number[],
) {
    const times = jsonData.columns[0];
    const dy = vp.height / (max - min);
    const dx = vp.width / (timeRange.end - timeRange.start);
    let botX = 0
    for (let i = indexRange.start; i <= indexRange.end; i++) {

        const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;

        let botY = 0;
        for (let j = 1; j < index; j++) {
            botY += (jsonData.columns[j][i] as number - min) * dy * scales[j - 1];
        }

        const y = botY + (jsonData.columns[index][i] as number - min) * dy * scales[index - 1];
        use(x, (vp.height - y) * devicePixelRatio, botX === 0 ? x : botX, (vp.height - botY) * devicePixelRatio);
        botX = x;
    }
}

function recountMaxBySumm(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    let max = 10;
    for (let j = indexRange.start; j <= indexRange.end; j++) {
        let summ = 0;
        for (let i = 1; i < jsonData.columns.length; i++) {
            if (visibility[i]) {
                summ += jsonData.columns[i][j] as number;
            }
        }
        max = Math.max(max, summ);
    }
    return [[Math.ceil(max / 10) * 10, 0]];
}

function recountAndUsePercentChart(
    jsonData: JsonData,
    index: number, _visibility: boolean[], indexRange: Range, timeRange: Range,
    vp: Viewport, _min: number, _max: number,

    use: (topX: number, topY: number, botX: number, botY: number) => void,
    scales?: number[],
) {
    const times = jsonData.columns[0];
    const dx = vp.width / (timeRange.end - timeRange.start);

    for (let i = indexRange.start; i <= indexRange.end; i++) {
        const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;

        let botY = 0;
        let totalY = 0;
        let y = 0;

        for (let j = 1; j < jsonData.columns.length; j++) {
            const line = jsonData.columns[j][i] as number * scales[j - 1];
            if (j < index) {
                botY += line;
            }
            if (j <= index) {
                y += line;
            }
            totalY += line;
        }

        use(x, (y / totalY * vp.height) * devicePixelRatio, x, (botY / totalY * vp.height) * devicePixelRatio);
    }
}

export function recountPercent(
    jsonData: JsonData,
    startIndex: number,
    scales?: number[],
) {
    const result: number[] = [];

    for (let j = 1; j < jsonData.columns.length; j++) {
        result.push(jsonData.columns[j][startIndex] as number * scales[j - 1]);
    }

    const total = result.reduce((t, i) => t + i, 0);
    return result.map(item => item / total * 100);
}

// function recountAndUsePercent(
//     jsonData: JsonData,
//     index: number, _visibility: boolean[], indexRange: Range, _timeRange: Range,
//     vp: Viewport, _min: number, _max: number,

//     use: (topX: number, topY: number, botX: number, botY: number) => void,
//     scales?: number[],
// ) {
//     index = jsonData.columns.length - index;
//     let last = 0;
//     const persent = recountPercent(jsonData, indexRange.start, scales).reverse();
//     for (let i = 1; i < index; i++) {
//         last += persent[i - 1];
//     }
//     use(last, last + persent[index - 1], vp.width / 2, vp.height / 2);
// }

const dayStyle = {
    text: 'rgba(37, 37, 41, 0.5)',
    line: 'rgba(24, 45, 59, 0.1)',
}
const nightStyle = {
    text: 'rgba(163, 177, 194, 0.6)',
    line: 'rgba(255, 255, 255, 0.1)',
}

export const day = 1000 * 60 * 60 * 24;

export class DataService {
    public lines = 5;

    public timeRange: Range;
    public indexRange: Range;
    public viewport: Viewport;
    public miniMap: MiniMap;
    public visibility: boolean[] = [];

    public isMove = false;
    public isBars = false;
    public isPercentage = false;
    public isSingleton = false;

    public zIndex: string;
    public cr: (jsonData: JsonData, lineWidth: number, opacity: number) => ChartsItem;
    public adapter: Adapter;

    public jsonData: JsonData;

    public asSoonAsReady: Promise<this>;

    constructor(
        width: number,
        public url: string,
    ) {
        this.asSoonAsReady = fetch(`./json/${url}/overview.json`)
            .then(response => response.json())
            .then(jsonData => this.setDate(width, jsonData))
            .then(() => this);
    }

    private styleWatchers: (() => void)[] = [];
    public style: { text: string, line: string };
    changeStyle(day: 'day' | 'night') {
        this.style = day === 'day'
            ? dayStyle : nightStyle;
        this.styleWatchers.forEach(act => act());
    }

    onChangeStyle(act: () => void) {
        this.styleWatchers.push(act);
    }

    private setDate(width, jsonData: JsonData) {
        this.changeStyle('day');
        this.jsonData = jsonData;
        const time = jsonData.columns[0];
        this.timeRange = {
            start: time[Math.max(Math.round(time.length * 0.8), 1)] as number,
            end: time[time.length - 1] as number,
        };
        this.indexRange = toIndexRange(this.jsonData, this.timeRange);

        this.viewport = {
            width,
            height: Math.round(width * 0.6),
        };

        this.miniMap = {
            viewport: {
                width: width - 10,
                height: 46,
            },
            indexRange: { start: 1, end: time.length - 1 },
            timeRange: {
                start: time[1] - day * 2,
                end: time[time.length - 1] as number + day * 2,
            },
        };

        this.visibility = jsonData.columns.map(() => true);

        this.isBars = (jsonData.types[jsonData.columns[1][0]] === 'bar' || jsonData.stacked) && !jsonData.percentage;
        this.isPercentage = jsonData.percentage;
        this.isSingleton = jsonData.columns.length === 2;

        if (jsonData.y_scaled) {
            this.zIndex = '-1';
            this.cr = (jsonData, lineWidth, opacity) => toItemsOver(jsonData, pl, lineWidth, opacity);
            this.adapter = {
                use: recountAndUseSimplePintsChart,
                toMax: recountDoubleMax,
            };
        }
        else if (jsonData.percentage) {
            this.zIndex = '1';
            this.cr = jsonData => toScalesItemOver(jsonData, ar);
            this.adapter = {
                use: recountAndUsePercentChart,
                toMax: () => [[100, 0]],
            };
        }
        else if (jsonData.stacked) {
            this.zIndex = '1';
            this.cr = jsonData => toScalesItemOver(jsonData, plg);
            this.adapter = {
                use: recountAndUseChartBySumm,
                toMax: recountMaxBySumm,
            };
        }
        else if (this.isSingleton) {
            this.zIndex = '1';
            this.cr = jsonData => toScalesItemOver(jsonData, plg);
            this.adapter = {
                use: recountAndUseSimplePintsChart,
                toMax: recountSimpleMax,
            };
        }
        else {
            this.zIndex = '-1';
            this.cr = (jsonData, lineWidth, opacity) => toItemsOver(jsonData, pl, lineWidth, opacity);
            this.adapter = {
                use: recountAndUseSimplePintsChart,
                toMax: recountSimpleMaxAndMin,
            };
        }
    }
    private timeChangeWatchers: ((kind: ChangeKind, timeRange: Range) => void)[] = [];
    onTimeRangeChange(act: (kind: ChangeKind, timeRange: Range) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(kind: ChangeKind, timeRange: Range) {

        this.timeRange = timeRange;
        this.indexRange = toIndexRange(this.jsonData, timeRange);

        this.timeChangeWatchers.forEach(act => act(kind, timeRange));
    }

    private visibilityWatchers: ((vis: boolean[]) => void)[] = [];

    uncheckOther(index: number) {
        this.visibility = this.visibility.map((_, i) => i === index);
        this.visibilityWatchers.forEach(act => act(this.visibility));
    }
    toggleVisibility(index: number) {
        this.visibility[index] = !this.visibility[index];
        this.visibilityWatchers.forEach(act => act(this.visibility));
    }

    onVisibilityChange(act: (vis: boolean[]) => void) {
        this.visibilityWatchers.push(act);
    }

    private destroyWatchers: (() => void)[] = [];
    onDestroy(act: () => void) {
        this.destroyWatchers.push(act);
    }

    toMaxVisibleValue(indexRange: Range): MaxMin[] {
        return this.adapter.toMax(this.jsonData, this.visibility, indexRange);
    }

    use: UseDataFunction = (
        index: number, vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
        scales?: number[],
    ) => {
        this.adapter.use(
            this.jsonData, index, this.visibility, this.indexRange, this.timeRange,
            vp, min, max, use, scales,
        )
    }

    useMin: UseDataFunction = (
        index: number, vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
        scales?: number[],
    ) => {
        this.adapter.use(
            this.jsonData, index, this.visibility, this.miniMap.indexRange, this.miniMap.timeRange,
            vp, min, max, use, scales,
        )
    }

    asSoonAsLoading: Promise<JsonData>;
    zoomedTime: number;
    loadingData(time: number) {

        this.zoomedTime = time;

        if (this.isPercentage) return;
        this.asSoonAsLoading = fetch(toUrl(this.url, time))
            .then(response => response.json());
    }

    isZoom = false;
    yearDatas: YearsData = null;

    unzoom() {
        if (this.isPercentage) return this.percentageUnZoom();
        this.isZoom = false;

        const { yearData, miniMapTimeRange, timeRange, indexRange } = this.yearDatas

        const frames = 16;

        const dSr = (timeRange.start - this.timeRange.start) / frames;
        const dEr = (timeRange.end - this.timeRange.end) / frames;

        const dMSr = (miniMapTimeRange.start - this.miniMap.timeRange.start) / frames;
        const dMEr = (miniMapTimeRange.end - this.miniMap.timeRange.end) / frames;

        const increment = (freezer: number) => {
            this.timeRange.start += dSr / freezer;
            this.timeRange.end += dEr / freezer;

            this.miniMap.timeRange.start += dMSr / freezer;
            this.miniMap.timeRange.end += dMEr / freezer;
        }

        if (this.isSingleton) {
            this.zoomStart(yearData, indexRange, timeRange, yearData.columns.map(() => true));
            this.singletonUnzooming(frames, yearData, increment);

        }
        else {
            this.zoomStart(yearData, indexRange, timeRange, this.visibility);
            this.simpleUnzooming(yearData, this.jsonData, increment);
        }

    }

    singletonUnzooming(
        frames: number,
        yearData: JsonData,
        increment: Increment,
    ) {
        const zooming = (index: number) => {
            requestAnimationFrame(() => {

                increment(1);

                if (index === 16) {
                    this.jsonData = yearData;
                    this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                    this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);
                    this.visibility = yearData.columns.map(() => true);

                    this.isBars = true;
                    this.cr = jsonData => toScalesItemOver(jsonData, plg);

                    this.changeFactoryWatchers.forEach(act => act(false));
                }
                else {

                    this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                    this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);
                    this.zoomWatchers.forEach(act => act(this.timeRange, (frames - index) / 10));

                    if (index === 1) return;
                }

                zooming(index - 1);
            });
        }

        zooming(frames);
    }
    simpleUnzooming(
        yearData: JsonData,
        weekData: JsonData,
        increment: Increment,
    ) {
        const initTimeRange = copyRange(this.miniMap.timeRange);
        const mergeJsonForSimpleZoom = mergeJsonForSimpleZoomOver(
            yearData, weekData, this.miniMap.timeRange, initTimeRange,
        );

        const zooming = (index: number) => {
            requestAnimationFrame(() => {

                increment(index > 14 ? 3 : 1);

                if (index === 19) {
                    this.jsonData = mergeJsonForSimpleZoom(3);
                }

                if (index === 16) {
                    this.jsonData = mergeJsonForSimpleZoom(6);
                }

                if (index === 14) {
                    this.jsonData = mergeJsonForSimpleZoom(12);
                }

                if (index === 10) {
                    this.jsonData = yearData;
                }

                this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);

                this.zoomWatchers.forEach(act => act(this.timeRange));

                if (index === 1) return;
                zooming(index - 1);
            });
        }

        zooming(20);
    }
    zoom() {

        if (this.isPercentage) return this.percentageZoom();

        this.yearDatas = {
            yearData: this.jsonData,
            indexRange: copyRange(this.indexRange),
            timeRange: copyRange(this.timeRange),
            miniMapIndexRange: copyRange(this.miniMap.indexRange),
            miniMapTimeRange: copyRange(this.miniMap.timeRange),
        }

        this.asSoonAsLoading.then(weekData => {
            this.isZoom = true;

            const time = weekData.columns[0];
            const firstTime = time[1];
            const lastTime = time[time.length - 1] as number;

            const endTimeRange = { start: this.zoomedTime, end: this.zoomedTime + day };
            const endIndexRange = toIndexRange(weekData, endTimeRange);

            const frames = 16;

            const dSr = (endTimeRange.start - this.timeRange.start) / frames;
            const dEr = (endTimeRange.end - this.timeRange.end) / frames;

            const dMSr = (firstTime - this.miniMap.timeRange.start) / frames;
            const dMEr = (lastTime - this.miniMap.timeRange.end) / frames;

            const increment = (freezer: number) => {
                this.timeRange.start += dSr / freezer;
                this.timeRange.end += dEr / freezer;

                this.miniMap.timeRange.start += dMSr / freezer;
                this.miniMap.timeRange.end += dMEr / freezer;
            }

            if (this.isSingleton) {
                this.zoomStart(weekData, endIndexRange, endTimeRange, weekData.columns.map(() => true));
                this.singletonZoomin(weekData, increment);
            }
            else {
                this.zoomStart(weekData, endIndexRange, endTimeRange, this.visibility);
                this.simpleZooming(endTimeRange, this.jsonData, weekData, increment);
            }
        })
    }

    singletonZoomin(
        weekData: JsonData,
        increment: Increment,
    ) {
        const zooming = (index: number) => {
            requestAnimationFrame(() => {

                increment(1);

                this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);
                this.zoomWatchers.forEach(act => act(this.timeRange, (16 - index) / 10));

                if (index === 16) {
                    this.jsonData = weekData;
                    this.visibility = weekData.columns.map(() => true);

                    this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                    this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);

                    this.isBars = false;
                    this.cr = (jsonData, lineWidth, opacity) => toItemsOver(jsonData, pl, lineWidth, opacity);
                    this.changeFactoryWatchers.forEach(act => act(true));
                    return;
                }

                zooming(index + 1);
            });
        }

        zooming(1);
    }

    simpleZooming(
        endTimeRange: Range,
        yearData: JsonData,
        weekData: JsonData,
        increment: Increment,
    ) {
        const mergeJsonForSimpleZoom = mergeJsonForSimpleZoomOver(
            yearData, weekData, this.miniMap.timeRange, endTimeRange,
        )
        const zooming = (index: number) => {
            requestAnimationFrame(() => {

                increment(index > 14 ? 3 : 1);

                if (index === 11) {
                    this.jsonData = mergeJsonForSimpleZoom(12);
                }

                if (index === 14) {
                    this.jsonData = mergeJsonForSimpleZoom(6);
                }

                if (index === 17) {
                    this.jsonData = mergeJsonForSimpleZoom(3);
                }

                if (index === 20) {
                    this.jsonData = weekData;
                }

                this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);

                this.zoomWatchers.forEach(act => act(this.timeRange));

                if (index === 20) return;
                zooming(index + 1);
            });
        }

        zooming(1);
    }

    private zoomWatchers: ((timeRange: Range, opacity?: number) => void)[] = [];
    onZoom(act: (timeRange: Range, opacity?: number) => void) {
        this.zoomWatchers.push(act);
    }
    private zoomStartWatchers: ZoomFunc[] = [];
    onZoomStart(act: ZoomFunc) {
        this.zoomStartWatchers.push(act);
    }
    private changeFactoryWatchers: ((shouldRender: boolean) => void)[] = [];
    onChangeFactory(act: (shouldRender: boolean) => void) {
        this.changeFactoryWatchers.push(act);
    }

    zoomStart(data: JsonData, indexRange: Range, timeRange: Range, vision: boolean[]) {
        this.zoomStartWatchers.forEach(act => act(data, indexRange, timeRange, vision))
    }

    percentageZoom() {
        this.yearDatas = {
            yearData: this.jsonData,
            indexRange: copyRange(this.indexRange),
            timeRange: copyRange(this.timeRange),
            miniMapIndexRange: copyRange(this.miniMap.indexRange),
            miniMapTimeRange: copyRange(this.miniMap.timeRange),
        }

        const endTimeRange = { start: this.zoomedTime, end: this.zoomedTime + day };
        const endIndexRange = toIndexRange(this.jsonData, endTimeRange);

        const percents = recountPercent(this.jsonData, endIndexRange.start, toScales(this.visibility));
        this.drawPieWatchers.forEach(act => act(percents, endIndexRange));
    }

    private drawPieWatchers: ((percents: number[], endIndexRange: Range) => void)[] = [];
    onDrawPie(act: (percents: number[], endIndexRange: Range) => void) {
        this.drawPieWatchers.push(act);
    }

    private drawPersentsWatchers: ((percents: number[]) => void)[] = [];
    onDrawPersent(act: (percents: number[]) => void) {
        this.drawPersentsWatchers.push(act);
    }

    percentageUnZoom() {
        const percents = recountPercent(this.jsonData, this.indexRange.start, toScales(this.visibility));
        this.drawPersentsWatchers.forEach(act => act(percents));
    }
}

function toScales(vision: boolean[]) {
    return vision.reduce((acc, item, index) => {
        if (index !== 0) acc.push(item ? 1 : 0);
        return acc;
    }, [])
}

type Increment = (freezer: number) => void;

interface YearsData {
    yearData: JsonData;
    timeRange: Range;
    indexRange: Range;
    miniMapTimeRange: Range;
    miniMapIndexRange: Range;
}

type ZoomFunc = (data: JsonData, indexRange: Range, timeRange: Range, vision: boolean[]) => void

function copyRange(range: Range): Range {
    return { start: range.start, end: range.end };
}

function toScals(splitter: 3 | 6 | 12) {
    return splitter === 12 ? 2 : splitter === 6 ? 4 : 8;
}

function mergeJsonForSimpleZoomOver(
    yearData: JsonData,
    weekData: JsonData,
    currnetTimeRange: Range,
    weekTimeRange: Range
) {

    return function (splitter: 3 | 6 | 12): JsonData {
        const { start, end } = toIndexRange(yearData, currnetTimeRange);
        const columns = yearData.columns.map(column => column.slice(start, end) as number[]);

        const range = toIndexRangeZoom(columns[0], weekTimeRange);

        return {
            ...weekData,
            columns: columns.map((items, index) => {

                const [name, ...values] = weekData.columns[index];

                if (name === 'x') {

                    const values2 = values.reduce((acc, item, i) => {
                        if (i % splitter == 0) acc.push(item);
                        return acc;
                    }, []);

                    return [
                        name,
                        ...items.slice(0, range.start),
                        ...values2,
                        ...items.slice(range.end, items.length - 1),
                    ];
                }
                else {
                    const scale = toScals(splitter);

                    let values2 = values.reduce((acc, item, i) => {
                        if (i % splitter == 0) {
                            acc.push(item);
                        }
                        else {
                            acc[acc.length - 1] += item;
                        }
                        return acc;
                    }, [] as number[]);

                    if (splitter === 12) {
                        const prev = items[range.start] / scale;
                        values2 = values2.map(item => item > prev ? item / 1.5 : item * 1.5);
                    }
                    return [
                        name,
                        ...items.slice(0, range.start).map(item => item / scale),
                        ...values2,
                        ...items.slice(range.end, items.length - 1).map(item => item / scale),
                    ]
                }


            }) as any,
        }
    }

}

function toIndexRangeZoom(time: number[], timeRange: Range): Range {
    let start = 1;
    while (time[start] < timeRange.start) {
        start++;
    }
    start = Math.max(start - 2, 1);

    let end = time.length - 1;
    while (time[end] > timeRange.end) {
        end--;
    }
    end = Math.min(end + 3, time.length - 1);

    return {
        start,
        end,
    };
}

function toUrl(url: string, time: number): string {
    const d = new Date(time);
    return `./json/${url}/${d.getFullYear()}-${("0" + (d.getMonth() + 1)).slice(-2)}/${("0" + d.getDate()).slice(-2)}.json`;
}

function toIndexRange(jsonData: JsonData, timeRange: Range): Range {
    const time = jsonData.columns[0];

    let start = 1;
    while (time[start] < timeRange.start) {
        start++;
    }
    start = Math.max(start - 1, 1);

    let end = time.length - 1;
    while (time[end] > timeRange.end) {
        end--;
    }
    end = Math.min(end + 1, time.length - 1);

    return {
        start,
        end,
    };
}


// function toSinglton(
//     url: string,
//     setJson: (jsonData: JsonData) => void,
//     setIndexRange: (range: Range) => void,
//     setTimeRange: (range: Range) => void,
//     setMiniMapIndexRange: (range: Range) => void,
//     setMiniMapTimeRange: (range: Range) => void,
//     zoomStart: (data: JsonData, indexRange: Range, timeRange: Range) => void,
// ) {
//     let asSoonAsLoading: Promise<JsonData>;
//     let zoomedTime: number;
//     let yearsDataCopy: YearsData;

//     const frames = 50;

//     function loadingData(time: number) {
//         zoomedTime = time;
//         asSoonAsLoading = fetch(toUrl(url, time)).then(response => response.json());
//     }

//     function zoom(
//         yearsData: YearsData,
//     ) {
//         yearsDataCopy = {
//             yearData: yearsData.yearData,
//             indexRange: copyRange(yearsData.indexRange),
//             timeRange: copyRange(yearsData.timeRange),
//             miniMapIndexRange: copyRange(yearsData.miniMapIndexRange),
//             miniMapTimeRange: copyRange(yearsData.miniMapTimeRange),
//         }

//         asSoonAsLoading.then(jsonData => {

//             const time = jsonData.columns[0];
//             const firstTime = time[1];
//             const lastTime = time[time.length - 1] as number;

//             const endTimeRange = { start: zoomedTime, end: zoomedTime + day };
//             const endIndexRange = toIndexRange(jsonData, endTimeRange);

//             zoomStart(jsonData, endIndexRange, endTimeRange)
//             setMiniMapIndexRange({ start: 1, end: time.length - 1 });

//             const dSr = (endTimeRange.start - yearsData.timeRange.start) / frames;
//             const dEr = (endTimeRange.end - yearsData.timeRange.end) / frames;

//             const dMSr = (firstTime - yearsData.miniMapTimeRange.start) / frames;
//             const dMEr = (lastTime - yearsData.miniMapTimeRange.end) / frames;

//             const increment = () => {
//                 this.timeRange.start += dSr;
//                 this.timeRange.end += dEr;

//                 this.miniMap.timeRange.start += dMSr;
//                 this.miniMap.timeRange.end += dMEr;
//             }

//             const zoomin = (index: number) => {
//                 requestAnimationFrame(() => {
//                     increment();

//                     if (index === 25) {

//                     }
//                     else {

//                     }

//                     if (index > frames) return;
//                     zoomin(index + 1);
//                 });
//             };
//             zoomin(0);
//         });
//     }

//     function unzoom() {

//     }

//     return {
//         loadingData,
//         zoom,
//         unzoom,
//     }
// }