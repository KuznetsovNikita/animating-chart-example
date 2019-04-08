
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

export interface Adapter {
    use: (
        index: number, indexRange: Range, timeRange: Range,
        vp: Viewport, min: number, max: number,
        use: (topX: number, topY: number, botX: number, botY: number) => void
    ) => void;
    toMax: (visibility: Dict<boolean>, indexRange: Range) => number[];
}

export type UseDataFunction = (
    index: number, vp: Viewport, min: number, max: number,
    use: (topX: number, topY: number, botX: number, botY: number) => void
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