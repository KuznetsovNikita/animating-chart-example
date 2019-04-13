
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

export type ItemDrawFunction = (
    use: UseDataFunction, context: CanvasRenderingContext2D,
    index: number, min: number, max: number, viewport: Viewport,
) => void;

export interface ChartItem {
    drw: ItemDrawFunction;
    set: (value: boolean) => void;
    sc: ItemDrawFunction;
}

export interface ScalableChartItem {
    drw: (
        use: UseDataFunction, context: CanvasRenderingContext2D,
        index: number, min: number, max: number, viewport: Viewport,
        scale: number[], opacity?: number,
    ) => void;
}

export type ChartDrawFunction = (
    use: UseDataFunction, context: CanvasRenderingContext2D, index: Range,
    toMax: (index: number) => MaxMin, viewport: Viewport, opacity?: number,
) => void;

export interface ChartItemsFactory {
    draw: ChartDrawFunction;
    setVisible: (visible: boolean[]) => void;
    setRange: (indexRange: Range) => void;
    setHover: (hovers: number[]) => void;
    scale: ChartDrawFunction;
}

export interface JsonData {
    columns: [TimeColumn, ...Array<Column>];
    types: Dict<string>;
    names: Dict<string>;
    colors: Dict<string>;
    y_scaled?: boolean;
    stacked?: boolean;
    percentage?: boolean;
}