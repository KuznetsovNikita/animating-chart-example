
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

export interface Viewport {
    width: number;
    height: number;
}

export interface TimeRange {
    start: number;
    end: number;
}

export class DataService {

    private timeChangeWatchers: ((timeRange: TimeRange) => void)[] = [];
    private visibilityWatchers: ((key: string, value: boolean) => void)[] = [];

    constructor(
        public viewport: Viewport,
        public miniMap: Viewport,
        public lines: number,
        public timeRange: TimeRange,
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

    onVisibilityChange(act: (key: string) => void) {
        this.visibilityWatchers.push(act);
    }
}


