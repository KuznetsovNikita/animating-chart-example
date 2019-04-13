import { toIndexRange } from './index-range';
import { JsonData, Range } from './models';


function toScals(splitter: 3 | 6 | 12) {
    return splitter === 12 ? 2 : splitter === 6 ? 4 : 8;
}

export function mergeJsonForSimpleZoomOver(
    yearData: JsonData,
    weekData: JsonData,
    currnetTimeRange: Range,
    weekTimeRange: Range,
) {

    return function (splitter: 3 | 6 | 12): JsonData {
        const { start, end } = toIndexRange(yearData, currnetTimeRange);
        const columns = yearData.columns.map(column => column.slice(start, end) as number[]);

        const range = toIndexRangeZoom(columns[0], weekTimeRange);

        return {
            ...weekData,
            columns: columns.map((items, index) => {

                const [name, ...values] = weekData.columns[index];

                if (name === 'x') {

                    const values2 = values.reduce((acc, item, i) => {
                        if (i % splitter === 0) acc.push(item);
                        return acc;
                    }, []);

                    return [
                        name,
                        ...items.slice(0, range.start),
                        ...values2,
                        ...items.slice(range.end, items.length - 1),
                    ];
                }
                else {
                    const scale = toScals(splitter);

                    let values2 = values.reduce((acc, item, i) => {
                        if (i % splitter === 0) {
                            acc.push(item);
                        }
                        else {
                            acc[acc.length - 1] += item;
                        }
                        return acc;
                    }, [] as number[]);

                    if (splitter === 12) {
                        const prev = items[range.start] / scale;
                        values2 = values2.map(item => item > prev ? item / 1.5 : item * 1.5);
                    }
                    return [
                        name,
                        ...items.slice(0, range.start).map(item => item / scale),
                        ...values2,
                        ...items.slice(range.end, items.length - 1).map(item => item / scale),
                    ];
                }


            }) as any,
        };
    };

}

function toIndexRangeZoom(time: number[], timeRange: Range): Range {
    let start = 1;
    while (time[start] < timeRange.start) {
        start++;
    }
    start = Math.max(start - 2, 1);

    let end = time.length - 1;
    while (time[end] > timeRange.end) {
        end--;
    }
    end = Math.min(end + 3, time.length - 1);

    return {
        start,
        end,
    };
}
