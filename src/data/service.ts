import { TimeRange, Viewport } from "./models";

type Tuple = [string, ...Array<number>];

export interface Dict<T> {
    [key: string]: T;
}

export interface JsonData {
    columns: Tuple[];
    types: Dict<string>;
    names: Dict<string>;
    colors: Dict<string>;
}

export interface ChartData {
    max: number;
    columns: Dict<number[]>;
    times: number[];
    colors: Dict<string>;
    timeRange: TimeRange;
    viewport: Viewport;
}

export class DataService {

    public animationSpeed = 0.1;

    private timeChangeWatchers: ((timeRange: TimeRange) => void)[] = [];
    private visibilityWatchers: ((key: string, value: boolean) => void)[] = [];

    constructor(
        public viewport: Viewport,
        public miniMap: Viewport,
        public lines: number,
        public timeRange: TimeRange,
        public jsonData: JsonData,
        public visibility: Dict<boolean>,
    ) {

    }

    onTimeRangeChange(act: (timeRange: TimeRange) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(timeRange: TimeRange) {
        this.timeRange = timeRange;
        this.timeChangeWatchers.forEach(act => act(timeRange))
    }

    toggleVisibility(key: string) {
        this.visibility[key] = !this.visibility[key];
        this.visibilityWatchers.forEach(act => act(key, this.visibility[key]))
    }

    onVisibilityChange(act: (key: string, value: boolean) => void) {
        this.visibilityWatchers.push(act);
    }

    toMiniMapData(): ChartData {
        let max = 0;
        let times: number[];
        const columns = this.jsonData.columns
            .reduce((result, [type, ...values]) => {
                if (type === 'x') {
                    times = values;
                    return result;
                }
                if (this.visibility[type]) {
                    result[type] = values;

                    max = Math.max(max, ...values);
                }

                return result;
            }, {});

        return {
            max,
            columns,
            times,
            colors: this.jsonData.colors,
            timeRange: {
                start: times[0],
                end: times[times.length - 1],
            },
            viewport: this.miniMap,
        }
    }

    toChartData(): ChartData {
        const { start, end } = this.timeRange;

        const [_, ...timestamps] = this.jsonData.columns.find(([type]) => type === 'x');

        let startIndex = timestamps.findIndex(time => time >= start) - 1;
        if (startIndex === -1) startIndex = 0;
        let endIndex = timestamps.findIndex(time => time > end) + 1;
        if (endIndex === 0) endIndex = timestamps.length;

        const times = timestamps.slice(startIndex, endIndex);

        let max = 0;
        const columns = this.jsonData.columns.reduce((result, [type, ...values]) => {
            if (type === 'x') return result;

            if (this.visibility[type]) {
                result[type] = values.slice(startIndex, endIndex);

                max = Math.max(max, ...result[type]);
            }

            return result;
        }, {} as Dict<number[]>);

        return {
            max,
            columns,
            times,
            colors: this.jsonData.colors,
            timeRange: this.timeRange,
            viewport: this.viewport,
        }
    }

    useLines(
        max: number,
        use: (value: number, height: number, width: number, index: number) => void
    ): void {
        const last = Math.floor(max / 10) * 10;
        const { height, width } = this.viewport;
        const dy = last / this.lines;
        const dx = toDeltaX(height, max);

        let i = 0;
        for (let label = 0; label <= last; label += dy) {
            const x = height - label * dx;
            use(label, x, width, i);
            i++;
        }
    }
}

function toDeltaX(height: number, max: number) {
    // padding top
    return (height - 20) / max;
}


