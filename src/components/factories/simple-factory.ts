import { ChartItem, ChartItemsFactory, JsonData, MaxMin, Range, UseDataFunction, Viewport } from '../../data/models';

export function toChartItemsFactoryOver(
    jsonData: JsonData,
    toItem: (color: string, lineWidth?: number, opacity?: number) => ChartItem,
    lineWidth?: number,
    opacity?: number,
): ChartItemsFactory {
    const items: ChartItem[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        const key = jsonData.columns[i][0];
        items.push(toItem(jsonData.colors[key], lineWidth, opacity));
    }


    function draw(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.drw(use, context, index + 1, toMax(index + 1)[1], toMax(index + 1)[0], viewport);
        });
    }

    function setVisible(visible: boolean[]) {
        for (let i = 1; i < visible.length; i++) {
            items[i - 1].set(visible[i]);
        }
    }


    function scale(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport,
    ) {
        items.forEach((item, index) => {
            item.sc(use, context, index + 1, toMax(index + 1)[1], toMax(index + 1)[0], viewport);
        });
    }

    return {
        draw,
        setVisible,
        scale,
        setRange: () => { },
        setHover: () => { },
    };
}
