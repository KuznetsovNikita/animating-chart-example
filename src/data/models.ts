
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

export interface Dict<T> {
    [key: string]: T;
}

export type UseDataFunction = (
    index: number, vp: Viewport, min: number, max: number,
    use: (topX: number, topY: number, botX: number, botY: number) => void,
    scales?: number[],
) => void;

export interface ChartItem {
    drw: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
    ) => void;
    set: (value: boolean) => void;
    sc: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
    ) => void;
}

export interface ChartsItem {
    drw: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        min: number, toMax: (index: number) => number, viewport: Viewport,
    ) => void;
    set: (key: string, value: boolean) => void;
    sc: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        min: number, toMax: (index: number) => number, viewport: Viewport,
    ) => void;
}