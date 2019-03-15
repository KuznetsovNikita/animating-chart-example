import { Column, Dict, Range, Times, Viewport } from "./models";

export interface JsonData {
    columns: [Times, ...Array<Column>];
    types: Dict<string>;
    names: Dict<string>;
    colors: Dict<string>;
}

interface MiniMap {
    viewport: Viewport;
    indexRange: Range;
    timeRange: Range;
}

export class DataService {

    public animationSpeed = 0.15; // % per frame

    public lines = 5;

    public indexRange: Range;
    public viewport: Viewport;
    public miniMap: MiniMap;
    public visibility: Dict<boolean> = {};

    constructor(
        width: number,
        public timeRange: Range,
        public jsonData: JsonData,

    ) {
        this.viewport = {
            width,
            height: Math.round(width * 0.9),
        };

        this.miniMap = {
            viewport: {
                width,
                height: 46,
            },
            indexRange: { start: 1, end: jsonData.columns[0].length - 1 },
            timeRange: {
                start: jsonData.columns[0][1],
                end: jsonData.columns[0][jsonData.columns[0].length - 1] as number
            }
        }

        for (let key in jsonData.names) {
            this.visibility[key] = true;
        }

        this.indexRange = this.toIndexRange(timeRange);
    }

    private timeChangeWatchers: ((timeRange: Range) => void)[] = [];
    onTimeRangeChange(act: (timeRange: Range) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(timeRange: Range) {

        this.timeRange = timeRange;
        this.indexRange = this.toIndexRange(timeRange);

        this.timeChangeWatchers.forEach(act => act(timeRange))
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
        this.visibilityWatchers.forEach(act => act(key, this.visibility[key]))
    }

    onVisibilityChange(act: (key: string, value: boolean) => void) {
        this.visibilityWatchers.push(act);
    }

    toMaxVisibleValue(indexRange: Range) {
        let max = 0;
        const { start, end } = indexRange;
        const { jsonData: { columns }, visibility } = this;
        for (let i = 1; i < columns.length; i++) {
            if (visibility[columns[i][0]]) {
                for (let j = start; j <= end; j++) {
                    max = Math.max(max, columns[i][j] as number);
                }
            }
        }
        return max;
    }
}



