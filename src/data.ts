
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

export interface Settings {
    viewport: Viewport,
    miniMap: Viewport,
    lines: number,
    timeRange: TimeRange,
}


export type Action = ChangeTimeRangeAction;

interface ChangeTimeRangeAction {
    kind: 'time-range';
    data: TimeRange;
}


