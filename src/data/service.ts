import { ar } from '../components/area';
import { plg } from '../components/poligon';
import { pl } from '../components/polyline';
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
        use: UseDataFunction, context: CanvasRenderingContext2D,
        toMax: (index: number) => MaxMin, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.drw(
                use, context, index + 1, toMax(index + 1)[1],
                toMax(index + 1)[0], viewport, scales,
            );
        });
    }

    function set(key: string, value: boolean) {
        jsonData.columns.forEach((column, index) => {
            if (column[0] === key) {
                actions[index - 1] = value ? 'in' : 'out';
            }
        });
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        toMax: (index: number) => MaxMin, viewport: Viewport,
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
                item.drw(use, context, index + 1, toMax(index + 1)[1], toMax(index + 1)[0], viewport, scales);
            }
        });
    }

    return {
        drw,
        set,
        sc,
    };
}

function toItemsOver(
    jsonData: JsonData,
    toItem: (color: string, lineWidth?: number) => ChartItem,
    lineWidth?: number
): ChartsItem {
    const items: ChartItem[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        const key = jsonData.columns[i][0];
        items.push(toItem(jsonData.colors[key], lineWidth));
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D,
        toMax: (index: number) => MaxMin, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.drw(use, context, index + 1, toMax(index + 1)[1], toMax(index + 1)[0], viewport);
        });
    }

    function set(key: string, value: boolean) {
        jsonData.columns.forEach((column, index) => {
            if (column[0] === key) {
                items[index - 1].set(value);
            }
        });
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D,
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
    };
}

export interface Adapter {
    use: (
        jsonData: JsonData,
        index: number, visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
        vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
        scales?: number[],
    ) => void;
    toMax: (jsonData: JsonData, visibility: Dict<boolean>, indexRange: Range) => MaxMin[];
}

function dataAdapter(
    kind: 'point' | 'y_scaled' | 'stacked' | 'percentage',

): Adapter {
    const devicePixelRatio = window.devicePixelRatio;


    function points(
        jsonData: JsonData,
        index: number, visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
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

    function toFastValue(jsonData: JsonData, visibility: Dict<boolean>, index: number): number {
        for (let i = 1; i < jsonData.columns.length; i++) {
            if (visibility[jsonData.columns[i][0]]) {
                return jsonData.columns[i][index] as number;
            }
        }
        return 0;
    }
    function pointsMax(jsonData: JsonData, visibility: Dict<boolean>, indexRange: Range): MaxMin[] {
        let max = 10;
        let min = toFastValue(jsonData, visibility, indexRange.start);
        for (let i = 1; i < jsonData.columns.length; i++) {
            if (visibility[jsonData.columns[i][0]]) {
                for (let j = indexRange.start; j <= indexRange.end; j++) {
                    max = Math.max(max, jsonData.columns[i][j] as number);
                    min = Math.min(min, jsonData.columns[i][j] as number);
                }
            }
        }
        return [[Math.ceil(max / 10) * 10, Math.floor(min / 10) * 10]];
    }

    function doubleMax(jsonData: JsonData, visibility: Dict<boolean>, indexRange: Range): MaxMin[] {
        const result: MaxMin[] = [];
        for (let i = 1; i < jsonData.columns.length; i++) {
            let max = 10;
            let min = 0;
            if (visibility[jsonData.columns[i][0]]) {
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

    function summ(
        jsonData: JsonData,
        index: number, _visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
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

    function summMax(jsonData: JsonData, visibility: Dict<boolean>, indexRange: Range): MaxMin[] {
        let max = 10;
        for (let j = indexRange.start; j <= indexRange.end; j++) {
            let summ = 0;
            for (let i = 1; i < jsonData.columns.length; i++) {
                if (visibility[jsonData.columns[i][0]]) {
                    summ += jsonData.columns[i][j] as number;
                }
            }
            max = Math.max(max, summ);
        }
        return [[Math.ceil(max / 10) * 10, 0]];
    }

    function percent(
        jsonData: JsonData,
        index: number, _visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
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
    switch (kind) {
        case 'point': return {
            use: points,
            toMax: pointsMax,
        };
        case 'y_scaled': return {
            use: points,
            toMax: doubleMax,
        }
        case 'stacked': return {
            use: summ,
            toMax: summMax,
        }
        case 'percentage': return {
            use: percent,
            toMax: () => [[100, 0]],
        }
    }
}
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
    public visibility: Dict<boolean> = {};

    public isMove = false;
    public isBars = false;
    public isPercentage = false;

    public zIndex: string;
    public cr: (jsonData: JsonData, lineWidth: number) => ChartsItem;
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

        for (let key in jsonData.names) {
            this.visibility[key] = true;
        }

        this.isBars = (jsonData.types[jsonData.columns[1][0]] === 'bar' || jsonData.stacked) && !jsonData.percentage;
        this.isPercentage = jsonData.percentage;

        if (jsonData.y_scaled) {
            this.zIndex = '-1';
            this.cr = (jsonData, lineWidth) => toItemsOver(jsonData, pl, lineWidth);
            this.adapter = dataAdapter('y_scaled');
        }
        else if (jsonData.percentage) {
            this.zIndex = '1';
            this.cr = jsonData => toScalesItemOver(jsonData, ar);
            this.adapter = dataAdapter('percentage');
        }
        else if (jsonData.stacked || jsonData.types[jsonData.columns[1][0]] === 'bar') {
            this.zIndex = '1';
            this.cr = jsonData => toScalesItemOver(jsonData, plg);
            this.adapter = dataAdapter('stacked');
        }
        else {
            this.zIndex = '-1';
            this.cr = (jsonData, lineWidth) => toItemsOver(jsonData, pl, lineWidth);
            this.adapter = dataAdapter('point');
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

    private visibilityWatchers: ((key: string, value: boolean) => void)[] = [];
    toggleVisibility(key: string) {
        this.visibility[key] = !this.visibility[key];
        this.visibilityWatchers.forEach(act => act(key, this.visibility[key]));
    }

    onVisibilityChange(act: (key: string, value: boolean) => void) {
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

    toMinValue() {
        // const { jsonData: { columns } } = this;
        // let min = columns[1][1] as number;
        // for (let i = 1; i < columns.length; i++) {
        //     for (let j = 1; j < columns[0].length; j++) {
        //         min = Math.min(min, columns[i][j] as number);
        //     }
        // }
        // if (min > 1000) {
        //     return min - min % 100;
        // }
        return 0;
    }

    asSoonAsLoading: Promise<JsonData>;
    zoomedTime: number;
    loadingData(time: number) {
        this.zoomedTime = time;
        this.asSoonAsLoading = fetch(toUrl(this.url, time))
            .then(response => response.json());
    }

    isZoom = false;

    yearDatas: YearsData = null;

    unzoom() {
        this.isZoom = false;
        const zoomer = dataZoomer('out');
        const weekData = this.jsonData;
        const { yearData, miniMapIndexRange, miniMapTimeRange, timeRange, indexRange } = this.yearDatas
        this.zoomStart(yearData, indexRange, timeRange);

        this.miniMap.indexRange = miniMapIndexRange;

        const frames = 50;

        const initTimeRange = copyRange(this.miniMap.timeRange);
        const dSr = (timeRange.start - this.timeRange.start) / frames;
        const dEr = (timeRange.end - this.timeRange.end) / frames;

        const dMSr = (miniMapTimeRange.start - this.miniMap.timeRange.start) / frames;
        const dMEr = (miniMapTimeRange.end - this.miniMap.timeRange.end) / frames;

        const increment = () => {
            this.timeRange.start += dSr;
            this.timeRange.end += dEr;

            this.miniMap.timeRange.start += dMSr;
            this.miniMap.timeRange.end += dMEr;
        }

        const zooming = (index: number) => {
            requestAnimationFrame(() => {

                increment();

                if (index > 5 && index < 35) {
                    increment();
                    index--;
                    increment();
                    index--;
                }

                this.jsonData = zoomer.merge(index, yearData, weekData, this.miniMap.timeRange, initTimeRange);
                this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);

                this.zoomWatchers.forEach(act => act(this.timeRange));

                if (index <= 1) return;
                zooming(index - 1);
            });
        }

        zooming(frames);

    }
    zoom() {
        this.asSoonAsLoading.then(weekData => {

            this.isZoom = true;

            const zoomer = dataZoomer('in');
            const yearData = this.jsonData;

            const time = weekData.columns[0];
            const firstTime = time[1];
            const lastTime = time[time.length - 1] as number;

            const endTimeRange = { start: this.zoomedTime, end: this.zoomedTime + day };
            const endIndexRange = toIndexRange(weekData, endTimeRange);

            this.yearDatas = {
                yearData,
                indexRange: copyRange(this.indexRange),
                timeRange: copyRange(this.timeRange),
                miniMapIndexRange: copyRange(this.miniMap.indexRange),
                miniMapTimeRange: copyRange(this.miniMap.timeRange),
            }

            this.zoomStart(weekData, endIndexRange, endTimeRange);

            this.miniMap.indexRange = { start: 1, end: time.length - 1 };

            const frames = 50;

            const dSr = (endTimeRange.start - this.timeRange.start) / frames;
            const dEr = (endTimeRange.end - this.timeRange.end) / frames;

            const dMSr = (firstTime - this.miniMap.timeRange.start) / frames;
            const dMEr = (lastTime - this.miniMap.timeRange.end) / frames;

            const increment = () => {
                this.timeRange.start += dSr;
                this.timeRange.end += dEr;

                this.miniMap.timeRange.start += dMSr;
                this.miniMap.timeRange.end += dMEr;
            }

            const zooming = (index: number) => {
                requestAnimationFrame(() => {

                    increment();

                    if (index < 15) {
                        increment();
                        index++;
                        increment();
                        index++;
                    }
                    if (index < 35) {
                        increment();
                        index++;
                        increment();
                        index++;
                    }

                    this.jsonData = zoomer.merge(index, yearData, weekData, this.miniMap.timeRange, endTimeRange);
                    this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                    this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);

                    this.zoomWatchers.forEach(act => act(this.timeRange));

                    if (index === frames) return;
                    zooming(index + 1);
                });
            }

            zooming(1);
        })
    }

    private zoomWatchers: ((timeRange: Range) => void)[] = [];
    onZoom(act: (timeRange: Range) => void) {
        this.zoomWatchers.push(act);
    }
    private zoomStartWatchers: ZoomFunc[] = [];
    onZoomStart(act: ZoomFunc) {
        this.zoomStartWatchers.push(act);
    }

    zoomStart(data: JsonData, indexRange: Range, timeRange: Range) {
        this.zoomStartWatchers.forEach(act => act(data, indexRange, timeRange))
    }
}

interface YearsData {
    yearData: JsonData;
    timeRange: Range;
    indexRange: Range;
    miniMapTimeRange: Range;
    miniMapIndexRange: Range;
}

type ZoomFunc = (data: JsonData, indexRange: Range, timeRange: Range) => void

function copyRange(range: Range): Range {
    return { start: range.start, end: range.end };
}

function toScals(splitter: number) {
    return splitter === 24
        ? 1
        : splitter === 12
            ? 2
            : splitter === 6
                ? 4
                : splitter === 3
                    ? 8
                    : 24
}

function toScals2(splitter: number) {
    return splitter === 24
        ? 2
        : splitter === 12
            ? 6
            : 2
}

function dataZoomer(kind: 'in' | 'out') {
    let splitterIndex = 0;
    let splitter = kind === 'in' ? 24 : 1;

    const splilltrRecount = kind === 'in'
        ? () => {
            if (splitterIndex > toScals2(splitter)) {
                splitterIndex = 0;
                if (splitter === 3) {
                    splitter = 1
                }
                else {
                    splitter /= 2;
                }
            }
        }
        : () => {
            if (splitterIndex > toScals2(splitter)) {
                splitterIndex = 0;

                if (splitter === 1) {
                    splitter = 3
                }
                else {
                    splitter *= 2;
                }
            }
        }

    function merge(frame: number, yearData: JsonData, weekData: JsonData, currnetTimeRange: Range, weekTimeRange: Range): JsonData {

        if (frame < 25) return yearData;

        if (kind === 'in' && splitter === 1) return weekData;
        if (kind === 'out' && splitter === 24) return yearData;

        splitterIndex++;
        splilltrRecount();

        if (kind === 'out' && splitter === 1) return weekData;

        const { start, end } = toIndexRange(yearData, currnetTimeRange);
        const columns = yearData.columns.map(column => column.slice(start, end) as number[]);

        const range = toIndexRangeIn(columns[0], weekTimeRange);

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

                    const values2 = values.reduce((acc, item, i) => {
                        if (i % splitter == 0) {
                            acc.push(item);
                        }
                        else {
                            acc[acc.length - 1] += item;
                        }
                        return acc;
                    }, []);

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

    function toIndexRangeOut(time: number[], timeRange: Range) {
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

    function toIndexRangeIn(time: number[], timeRange: Range): Range {
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

    return {
        merge,
    }
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

                    // (this.jsonData.columns as any) = this.jsonData.columns.map((item, index) => {
                    //     const result = item.slice(0, start);

                    //     const [_, ...items] = data.columns[index];
                    //     result.push(...items);

                    //     result.push(...item.slice(end + 1, oldTimes.length - 1))
                    //     return result;
                    // });