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

    public animationSpeed = 0.15; // % per frame

    constructor(
        public viewport: Viewport,
        public miniMap: Viewport,
        public lines: number,
        public timeRange: TimeRange,
        public jsonData: JsonData,
        public visibility: Dict<boolean>,
    ) {

    }

    private timeChangeWatchers: ((timeRange: TimeRange) => void)[] = [];
    onTimeRangeChange(act: (timeRange: TimeRange) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(timeRange: TimeRange) {
        this.timeRange = timeRange;
        this.timeChangeWatchers.forEach(act => act(timeRange))
    }

    private visibilityWatchers: ((key: string, value: boolean) => void)[] = [];
    toggleVisibility(key: string) {
        this.visibility[key] = !this.visibility[key];
        this.visibilityWatchers.forEach(act => act(key, this.visibility[key]))
    }

    onVisibilityChange(act: (key: string, value: boolean) => void) {
        this.visibilityWatchers.push(act);
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

            const column = values.slice(startIndex, endIndex);

            result[type] = column

            if (this.visibility[type]) {
                max = Math.max(max, ...column);
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
}



