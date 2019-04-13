import { toScalableFactory } from '../components/factories/scalable-factory';
import { toChartItemsFactory } from '../components/factories/simple-factory';
import { toAreaItemOver } from '../components/items/area-item';
import { toPoligonItemOver } from '../components/items/poligon-item';
import { toPolylineItemOver } from '../components/items/polyline-item';
import { recountAndUseChartBySumm, recountAndUsePercentChartOver, recountAndUseSimplePintsChart, recountDoubleMax, recountMaxBySumm, recountPercent, recountSimpleMax, recountSimpleMaxAndMin } from '../data/adapters';
import { copyRange, toScales } from '../data/common';
import { toIndexRange } from '../data/index-range';
import { mergeJsonForSimpleZoomOver } from '../data/merge-simple-zoom';
import { ChartItemsFactory, JsonData, MaxMin, Range, UseDataFunction, Viewport } from '../data/models';
import { dayStyle, nightStyle } from '../data/style';

interface MiniMap {
    viewport: Viewport;
    indexRange: Range;
    timeRange: Range;
}

interface YearsData {
    yearData: JsonData;
    timeRange: Range;
    indexRange: Range;
    miniMapTimeRange: Range;
    miniMapIndexRange: Range;
}

export type ChangeKind = 'left' | 'right' | 'move' | 'visible';

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
    public itemsFactory: (jsonData: JsonData, lineWidth: number, opacity: number) => ChartItemsFactory;
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
            height: Math.round(width * (jsonData.percentage ? 0.7 : 0.6)),
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
            this.itemsFactory = (jsonData, lineWidth, opacity) => toChartItemsFactory(jsonData, toPolylineItemOver, lineWidth, opacity);
            this.adapter = {
                use: recountAndUseSimplePintsChart,
                toMax: recountDoubleMax,
            };
        }
        else if (jsonData.percentage) {
            this.zIndex = '1';
            this.itemsFactory = jsonData => toScalableFactory(jsonData, toAreaItemOver, toScales(this.visibility));
            this.adapter = {
                use: recountAndUsePercentChartOver(true),
                toMax: () => [[100, 0]],
            };
        }
        else if (jsonData.stacked) {
            this.zIndex = '1';
            this.itemsFactory = jsonData => toScalableFactory(jsonData, toPoligonItemOver, toScales(this.visibility));
            this.adapter = {
                use: recountAndUseChartBySumm,
                toMax: recountMaxBySumm,
            };
        }
        else if (this.isSingleton) {
            this.zIndex = '1';
            this.itemsFactory = jsonData => toScalableFactory(jsonData, toPoligonItemOver, toScales(this.visibility));
            this.adapter = {
                use: recountAndUseSimplePintsChart,
                toMax: recountSimpleMax,
            };
        }
        else {
            this.zIndex = '-1';
            this.itemsFactory = (jsonData, lineWidth, opacity) => toChartItemsFactory(jsonData, toPolylineItemOver, lineWidth, opacity);
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

        this.indexRange = toIndexRange(this.jsonData, timeRange); //, kind, this.timeRange, this.indexRange);
        this.timeRange = timeRange;


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
        );
    }

    useMin: UseDataFunction = (
        index: number, vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
        scales?: number[],
    ) => {
        this.adapter.use(
            this.jsonData, index, this.visibility, this.miniMap.indexRange, this.miniMap.timeRange,
            vp, min, max, use, scales,
        );
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

        const { yearData, miniMapTimeRange, timeRange, indexRange } = this.yearDatas;

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
        };

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
                    this.itemsFactory = jsonData => toScalableFactory(jsonData, toPoligonItemOver, toScales(this.visibility));

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
        };

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
        };

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
        };

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
            };

            if (this.isSingleton) {
                this.zoomStart(weekData, endIndexRange, endTimeRange, weekData.columns.map(() => true));
                this.singletonZoomin(weekData, increment);
            }
            else {
                this.zoomStart(weekData, endIndexRange, endTimeRange, this.visibility);
                this.simpleZooming(endTimeRange, this.jsonData, weekData, increment);
            }
        });
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
                    this.itemsFactory = (jsonData, lineWidth, opacity) => toChartItemsFactory(jsonData, toPolylineItemOver, lineWidth, opacity);
                    this.changeFactoryWatchers.forEach(act => act(true));
                    return;
                }

                zooming(index + 1);
            });
        };

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
        );
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
        };

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
        this.zoomStartWatchers.forEach(act => act(data, indexRange, timeRange, vision));
    }

    percentageZoom() {
        this.yearDatas = {
            yearData: this.jsonData,
            indexRange: copyRange(this.indexRange),
            timeRange: copyRange(this.timeRange),
            miniMapIndexRange: copyRange(this.miniMap.indexRange),
            miniMapTimeRange: copyRange(this.miniMap.timeRange),
        };

        this.isZoom = true;

        const endTimeRange = { start: this.zoomedTime, end: this.zoomedTime + day };
        const endIndexRange = toIndexRange(this.jsonData, endTimeRange);

        const { columns: [time] } = this.jsonData;

        const endTimeMiniMapRange = {
            start: Math.max(this.zoomedTime - 3 * day, time[1]),
            end: Math.min(this.zoomedTime + 4 * day, time[time.length - 1] as number),
        };

        const percents = recountPercent(this.jsonData, endIndexRange.start, toScales(this.visibility));
        this.drawPieWatchers.forEach(act => act(percents, endIndexRange));

        this.pieZoomingMiniMap(endTimeRange, endTimeMiniMapRange);
    }

    pieZoomingMiniMap(endTimeRange: Range, endTimeMiniMapRange: Range) {
        const frames = 16;
        const dSr = (endTimeRange.start - this.timeRange.start) / frames;
        const dEr = (endTimeRange.end - this.timeRange.end) / frames;

        const dMSr = (endTimeMiniMapRange.start - this.miniMap.timeRange.start) / frames;
        const dMEr = (endTimeMiniMapRange.end - this.miniMap.timeRange.end) / frames;

        const increment = () => {
            this.timeRange.start += dSr;
            this.timeRange.end += dEr;

            this.miniMap.timeRange.start += dMSr;
            this.miniMap.timeRange.end += dMEr;
        };

        const zooming = (index: number) => {
            requestAnimationFrame(() => {

                increment();

                this.indexRange = toIndexRange(this.jsonData, this.timeRange);
                this.miniMap.indexRange = toIndexRange(this.jsonData, this.miniMap.timeRange);
                this.pieZoomWatchers.forEach(act => act(this.timeRange));

                if (index === 16) return;

                zooming(index + 1);
            });
        };

        zooming(1);
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
        this.isZoom = false;
        const percents = recountPercent(this.jsonData, this.indexRange.start, toScales(this.visibility));
        this.drawPersentsWatchers.forEach(act => act(percents));

        this.pieZoomingMiniMap(this.yearDatas.timeRange, this.yearDatas.miniMapTimeRange);
    }

    private pieZoomWatchers: ((timeRange: Range) => void)[] = [];
    onPieZoom(act: (timeRange: Range) => void) {
        this.pieZoomWatchers.push(act);
    }


    hover(persents: number[], hovers: number[], offsetX: number, offsetY: number, shouldClose: boolean) {
        this.hoverWatchers.forEach(act => act(persents, hovers, offsetX, offsetY, shouldClose));
    }

    private hoverWatchers: ((persents: number[], hovers: number[], offsetX: number, offsetY: number, shouldClose: boolean) => void)[] = [];
    onHover(act: (persents: number[], hovers: number[], offsetX: number, offsetY: number, shouldClose: boolean) => void) {
        this.hoverWatchers.push(act);
    }
}

type Increment = (freezer: number) => void;

type ZoomFunc = (data: JsonData, indexRange: Range, timeRange: Range, vision: boolean[]) => void;

function toUrl(url: string, time: number): string {
    const d = new Date(time);
    return `./json/${url}/${d.getUTCFullYear()}-${('0' + (d.getMonth() + 1)).slice(-2)}/${('0' + d.getDate()).slice(-2)}.json`;
}
