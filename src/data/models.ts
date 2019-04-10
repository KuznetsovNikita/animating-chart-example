
export interface Viewport {
    width: number;
    height: number;
}

export interface Range {
    start: number;
    end: number;
}

export type Column = [string, ...Array<number>];
export type TimeColumn = ['x', ...Array<number>];


export type MaxMin = [number, number];


export interface Dict<T> {
    [key: string]: T;
}

export type UseDataFunction = (
    index: number, vp: Viewport, min: number, max: number,
    use: (topX: number, topY: number, botX: number, botY: number) => void,
    scales?: number[],
) => void;

export type ChartItemFunction = (
    use: UseDataFunction, context: CanvasRenderingContext2D,
    index: number, min: number, max: number, viewport: Viewport,
) => void;

export interface ChartItem {
    drw: ChartItemFunction;
    set: (value: boolean) => void;
    sc: ChartItemFunction;
}

export interface ScalesChartItem {
    drw: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
        scale: number[],
    ) => void;
}

export type ChartsItemFunction = (
    use: UseDataFunction, context: CanvasRenderingContext2D,
    toMax: (index: number) => MaxMin, viewport: Viewport,
) => void;

export interface ChartsItem {
    drw: ChartsItemFunction;
    set: (visible: boolean[]) => void;
    sc: ChartsItemFunction;
}