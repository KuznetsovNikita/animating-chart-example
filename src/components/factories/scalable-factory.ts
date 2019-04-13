import { ChartItemsFactory, JsonData, MaxMin, Range, ScalableChartItem, UseDataFunction, Viewport } from '../../data/models';

export function toScalableFactory(
    jsonData: JsonData,
    toItem: (color: string) => ScalableChartItem,
    scales: number[],
): ChartItemsFactory {
    const items: ScalableChartItem[] = [];
    // const scales: number[] = [];
    const actions: ('none' | 'in' | 'out')[] = [];

    for (let i = 1; i < jsonData.columns.length; i++) {
        const key = jsonData.columns[i][0];
        items.push(toItem(jsonData.colors[key]));
        //   scales.push(1);
        actions.push('none');
    }

    function drw(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport,
        opacity?: number,
    ) {
        items.forEach((item, index) => {
            item.drw(
                use, context, index + 1, toMax(index + 1)[1],
                toMax(index + 1)[0], viewport, scales, opacity,
            );
        });
    }

    function setVisible(visible: boolean[]) {
        for (let i = 1; i < visible.length; i++) {
            actions[i - 1] = visible[i] ? 'in' : 'out';
        }
    }

    function sc(
        use: UseDataFunction, context: CanvasRenderingContext2D, _indexRange: Range,
        toMax: (index: number) => MaxMin, viewport: Viewport, opacity?: number,
    ) {
        actions.forEach((action, index) => {
            if (action === 'in') {
                scales[index] = Math.min(1, scales[index] + 0.1);
                if (scales[index] === 1) actions[index] = 'none';
            }

            if (action === 'out') {
                scales[index] = Math.max(0, scales[index] - 0.1);
                if (scales[index] === 0) actions[index] = 'none';
            }
        });

        items.forEach((item, index) => {
            if (scales[index] !== 0) {
                item.drw(
                    use, context, index + 1, toMax(index + 1)[1],
                    toMax(index + 1)[0], viewport, scales, opacity,
                );
            }
        });
    }

    return {
        draw: drw,
        setVisible: setVisible,
        scale: sc,
        setRange: () => { },
        setHover: () => { },
    };
}
