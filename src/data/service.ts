import { Column, Dict, Range, TimeColumn, Viewport } from "./models";

export interface JsonData {
    columns: [TimeColumn, ...Array<Column>];
    types: Dict<string>;
    names: Dict<string>;
    colors: Dict<string>;
}

interface MiniMap {
    viewport: Viewport;
    indexRange: Range;
    timeRange: Range;
}

export type ChangeKind = 'left' | 'right' | 'move' | 'visible';

export class DataService {

    public animationSpeed = 0.15; // % per frame

    public lines = 5;

    public timeRange: Range;
    public indexRange: Range;
    public viewport: Viewport;
    public miniMap: MiniMap;
    public visibility: Dict<boolean> = {};

    constructor(
        width: number,
        public jsonData: JsonData,

    ) {
        const time = jsonData.columns[0];
        this.timeRange = {
            start: time[Math.max(Math.round(time.length * 0.8), 1)] as number,
            end: time[time.length - 1] as number,
        };
        this.indexRange = this.toIndexRange(this.timeRange);

        this.viewport = {
            width,
            height: Math.round(width * 0.8),
        };

        this.miniMap = {
            viewport: {
                width: width - 10,
                height: 46,
            },
            indexRange: { start: 1, end: time.length - 1 },
            timeRange: {
                start: time[1],
                end: time[time.length - 1] as number
            }
        }

        for (let key in jsonData.names) {
            this.visibility[key] = true;
        }


    }

    private timeChangeWatchers: ((kind: ChangeKind, timeRange: Range) => void)[] = [];
    onTimeRangeChange(act: (kind: ChangeKind, timeRange: Range) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(kind: ChangeKind, timeRange: Range) {

        this.timeRange = timeRange;
        this.indexRange = this.toIndexRange(timeRange);

        this.timeChangeWatchers.forEach(act => act(kind, timeRange))
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



