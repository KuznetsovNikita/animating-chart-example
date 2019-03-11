
type Tuple = [string, ...Array<number>];

interface Dict {
    [key: string]: string;
}

export interface JsonData {
    columns: Tuple[];
    types: Dict;
    names: Dict;
    colors: Dict;
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

    constructor(
        public viewport: Viewport,
        public miniMap: Viewport,
        public lines: number,
        public timeRange: TimeRange,
    ) {

    }

    onTimeTangeChange(act: (timeRange: TimeRange) => void) {
        this.timeChangeWatchers.push(act);
    }

    setTimeRange(timeRange: TimeRange) {
        this.timeRange = timeRange;
        this.timeChangeWatchers.forEach(act => act(timeRange))
    }
}


