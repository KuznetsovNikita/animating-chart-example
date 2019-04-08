import { ar } from '../components/area';
import { plg } from '../components/poligon';
import { pl } from '../components/polyline';
import { Adapter, ChartItem, Column, Dict, Range, TimeColumn, UseDataFunction, Viewport } from './models';

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

function dataAdapter(
    kind: 'point' | 'y_scaled' | 'stacked' | 'percentage',
    jsonData: JsonData,
): Adapter {
    const devicePixelRatio = window.devicePixelRatio;
    const times = jsonData.columns[0];

    function points(
        index: number, visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
        vp: Viewport, min: number, max: number,

        use: (topX: number, topY: number, botX: number, botY: number) => void
    ) {
        const dy = vp.height / (max - min);
        const dx = vp.width / (timeRange.end - timeRange.start);

        let botX = 0
        for (let i = indexRange.start; i <= indexRange.end; i++) {
            const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;
            const y = (vp.height - (jsonData.columns[index][i] as number - min) * dy) * devicePixelRatio;
            use(x, y, botX, vp.height * devicePixelRatio);
            botX = x;
        }
    }

    function pointsMax(visibility: Dict<boolean>, indexRange: Range) {
        let max = 10;
        for (let i = 1; i < jsonData.columns.length; i++) {
            if (visibility[jsonData.columns[i][0]]) {
                for (let j = indexRange.start; j <= indexRange.end; j++) {
                    max = Math.max(max, jsonData.columns[i][j] as number);
                }
            }
        }
        return [Math.ceil(max / 10) * 10];
    }

    function doubleMax(visibility: Dict<boolean>, indexRange: Range) {
        const result: number[] = [];
        for (let i = 1; i < jsonData.columns.length; i++) {
            let max = 10;
            if (visibility[jsonData.columns[i][0]]) {
                for (let j = indexRange.start; j <= indexRange.end; j++) {
                    max = Math.max(max, jsonData.columns[i][j] as number);
                }
            }
            result.push(Math.ceil(max / 10) * 10);
        }
        return result;
    }

    function summ(
        index: number, visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
        vp: Viewport, min: number, max: number,

        use: (topX: number, topY: number, botX: number, botY: number) => void,
    ) {
        const dy = vp.height / (max - min);
        const dx = vp.width / (timeRange.end - timeRange.start);
        let botX = 0
        for (let i = indexRange.start; i <= indexRange.end; i++) {

            const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;


            let botY = 0;
            for (let j = 1; j < index; j++) {
                if (visibility[jsonData.columns[j][0]]) {
                    botY += (jsonData.columns[j][i] as number - min) * dy;
                }
            }

            const y = botY + (jsonData.columns[index][i] as number - min) * dy;
            use(x, (vp.height - y) * devicePixelRatio, botX, (vp.height - botY) * devicePixelRatio);
            botX = x;
        }
    }

    function summMax(visibility: Dict<boolean>, indexRange: Range) {
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
        return [Math.ceil(max / 10) * 10];
    }

    function percent(
        index: number, visibility: Dict<boolean>, indexRange: Range, timeRange: Range,
        vp: Viewport, _min: number, _max: number,

        use: (topX: number, topY: number, botX: number, botY: number) => void
    ) {

        const dx = vp.width / (timeRange.end - timeRange.start);

        for (let i = indexRange.start; i <= indexRange.end; i++) {
            const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;

            let botY = 0;
            let totalY = 0;
            let y = 0;

            for (let j = 1; j < jsonData.columns.length; j++) {
                if (visibility[jsonData.columns[j][0]]) {
                    const line = jsonData.columns[j][i] as number;
                    if (j < index) {
                        botY += line;
                    }
                    if (j <= index) {
                        y += line;
                    }
                    totalY += line;
                }
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
            toMax: () => [100],
        }
    }
}
const dayStyle = {
    text: 'rgba(37, 37, 41, 0.5)',
    line: 'rgba(24, 45, 59, 0.1)',
}
const nightStyle = {
    text: 'rgba(37, 37, 41, 0.5)',
    line: 'rgba(24, 45, 59, 0.1)',
}

export class DataService {
    public lines = 5;
    public min: number;

    public timeRange: Range;
    public indexRange: Range;
    public viewport: Viewport;
    public miniMap: MiniMap;
    public visibility: Dict<boolean> = {};

    public isMove = false;

    public zIndex: string;
    public cr: (color: string, lineWidth: number) => ChartItem;
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

    public style: { text: string, line: string };
    changeStyle(day: 'day' | 'night') {
        this.style = day === 'day'
            ? dayStyle : nightStyle;
    }

    private setDate(width, jsonData: JsonData) {
        this.changeStyle('day');
        this.jsonData = jsonData;
        const time = jsonData.columns[0];
        this.timeRange = {
            start: time[Math.max(Math.round(time.length * 0.8), 1)] as number,
            end: time[time.length - 1] as number,
        };
        this.indexRange = this.toIndexRange(this.timeRange);

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
                start: time[1],
                end: time[time.length - 1] as number,
            },
        };

        for (let key in jsonData.names) {
            this.visibility[key] = true;
        }

        this.min = this.toMinValue();

        if (jsonData.y_scaled) {
            this.zIndex = '-1';
            this.cr = pl;
            this.adapter = dataAdapter('y_scaled', jsonData);
        }
        else if (jsonData.percentage) {
            this.zIndex = '1';
            this.cr = ar;
            this.adapter = dataAdapter('percentage', jsonData);
        }
        else if (jsonData.stacked) {
            this.zIndex = '1';
            this.cr = plg;
            this.adapter = dataAdapter('stacked', jsonData);
        }
        else if (jsonData.types[jsonData.columns[1][0]] === 'bar') {
            this.zIndex = '1';
            this.cr = plg;
            this.adapter = dataAdapter('point', jsonData);
        } else {
            this.zIndex = '-1';
            this.cr = pl;
            this.adapter = dataAdapter('point', jsonData);
        }
    }
    private timeChangeWatchers: ((kind: ChangeKind, timeRange: Range) => void)[] = [];
    onTimeRangeChange(act: (kind: ChangeKind, timeRange: Range) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(kind: ChangeKind, timeRange: Range) {

        this.timeRange = timeRange;
        this.indexRange = this.toIndexRange(timeRange);

        this.timeChangeWatchers.forEach(act => act(kind, timeRange));
    }

    toIndexRange(timeRange: Range): Range {
        const time = this.jsonData.columns[0];

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

    toMaxVisibleValue(indexRange: Range): number[] {
        return this.adapter.toMax(this.visibility, indexRange);
    }

    use: UseDataFunction = (
        index: number, vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
    ) => {
        this.adapter.use(
            index, this.visibility, this.indexRange, this.timeRange,
            vp, min, max, use,
        )
    }

    useMin: UseDataFunction = (
        index: number, vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void,
    ) => {
        this.adapter.use(
            index, this.visibility, this.miniMap.indexRange, this.miniMap.timeRange,
            vp, min, max, use,
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
}



