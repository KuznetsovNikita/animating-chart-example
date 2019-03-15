
export interface Viewport {
    width: number;
    height: number;
}

export interface Range {
    start: number;
    end: number;
}

export type Column = [string, ...Array<number>];
export type Times = ['x', ...Array<number>];

export interface Dict<T> {
    [key: string]: T;
}