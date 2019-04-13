import { JsonData, Range } from './models';



export function toIndexRange(
    jsonData: JsonData, timeRange: Range,
    //kind: ChangeKind = 'visible',
    // oldTime?: Range, oldIndex?: Range,
): Range {

    const time = jsonData.columns[0];

    // test.start();

    let start = 1;
    while (time[start] < timeRange.start) {
        start++;
    }
    start = Math.max(start - 1, 1);

    let end = time.length - 1;
    while (time[end] > timeRange.end) {
        end--;
    }
    end = Math.min(end + 1, time.length - 1);

    return {
        start,
        end,
    };

    // test.end();

    // test2.start();

    // switch (kind) {
    //     case 'visible': {
    //         let start = 1;
    //         while (time[start] < timeRange.start) {
    //             start++;
    //         }
    //         start = Math.max(start - 1, 1);

    //         let end = time.length - 1;
    //         while (time[end] > timeRange.end) {
    //             end--;
    //         }
    //         end = Math.min(end + 1, time.length - 1);
    //         // break;
    //         return { start, end };
    //     }
    //     case 'right': {
    //         let start = oldIndex.start;
    //         let end = oldIndex.end;

    //         if (timeRange.end > oldTime.end) {
    //             const max = time.length - 1;
    //             while (end < max && time[end] < timeRange.end) {
    //                 start += 1;
    //             }
    //         }
    //         else {
    //             while (time[end] > timeRange.end) {
    //                 start -= 1;
    //             }
    //         }
    //         //break;
    //         return { start, end };
    //     }
    //     case 'left': {
    //         let start = oldIndex.start;
    //         if (timeRange.start > oldTime.start) {
    //             while (time[start] < timeRange.start) {
    //                 start += 1;
    //             }
    //         }
    //         else {
    //             while (start > 1 && time[start] > timeRange.start) {
    //                 start -= 1;
    //             }
    //         }
    //         let end = oldIndex.end;
    //         // break;
    //         return { start, end };
    //     }
    //     case 'move': {
    //         let start = oldIndex.start;
    //         const length = oldIndex.end - oldIndex.start;
    //         if (timeRange.start > oldTime.start) {
    //             const max = time.length - length - 1;
    //             while (start < max && time[start] < timeRange.start) {
    //                 start += 1;
    //             }
    //         }
    //         else {
    //             while (start > 1 && time[start] > timeRange.start) {
    //                 start -= 1;
    //             }
    //         }

    //         let end = start + length;
    //         //break;
    //         return { start, end };
    //     }
    // }
    // test2.end();
    // return {
    //     start,
    //     end,
    // };
}
