import { JsonData, MaxMin, Range, Viewport } from './models';



export function recountAndUseSimplePintsChart(
    jsonData: JsonData,
    index: number, _visibility: boolean[], indexRange: Range, timeRange: Range,
    vp: Viewport, min: number, max: number,

    use: (topX: number, topY: number, botX: number, botY: number) => void,
) {
    const times = jsonData.columns[0];
    const dy = vp.height / (max - min);
    const dx = vp.width / (timeRange.end - timeRange.start);

    let botX = 0;
    for (let i = indexRange.start; i <= indexRange.end; i++) {
        const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;
        const y = (vp.height - (jsonData.columns[index][i] as number - min) * dy) * devicePixelRatio;
        use(x, y, botX === 0 ? x : botX, vp.height * devicePixelRatio);
        botX = x;
    }
}


export function recountDoubleMax(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    const result: MaxMin[] = [];
    for (let i = 1; i < jsonData.columns.length; i++) {
        let max = 10;
        let min = jsonData.columns[i][indexRange.start] as number;
        for (let j = indexRange.start; j <= indexRange.end; j++) {
            max = Math.max(max, jsonData.columns[i][j] as number);
            min = Math.min(min, jsonData.columns[i][j] as number);
        }

        result.push([Math.ceil(max / 10) * 10, Math.floor(min / 10) * 10]);
    }

    let [[oneMax, oneMin], [twoMax, twoMin]] = result;
    if (visibility[1] && visibility[2]) {
        oneMax > twoMax ? twoMax *= 1.2 : oneMax *= 1.2;
    }
    return [[oneMax, oneMin], [twoMax, twoMin]];
}

function toFastVisibleValue(jsonData: JsonData, visibility: boolean[], index: number): number {
    for (let i = 1; i < jsonData.columns.length; i++) {
        if (visibility[i]) {
            return jsonData.columns[i][index] as number;
        }
    }
    return 0;
}

export function recountSimpleMax(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    let max = 10;
    for (let i = 1; i < jsonData.columns.length; i++) {
        if (visibility[i]) {
            for (let j = indexRange.start; j <= indexRange.end; j++) {
                max = Math.max(max, jsonData.columns[i][j] as number);
            }
        }
    }
    return [[Math.ceil(max / 10) * 10, 0]];
}

export function recountSimpleMaxAndMin(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    let max = 10;
    let min = toFastVisibleValue(jsonData, visibility, indexRange.start);
    for (let i = 1; i < jsonData.columns.length; i++) {
        if (visibility[i]) {
            for (let j = indexRange.start; j <= indexRange.end; j++) {
                max = Math.max(max, jsonData.columns[i][j] as number);
                min = Math.min(min, jsonData.columns[i][j] as number);
            }
        }
    }
    return [[Math.ceil(max / 10) * 10, Math.floor(min / 10) * 10]];
}

export function recountAndUseChartBySumm(
    jsonData: JsonData,
    index: number, _visibility: boolean[], indexRange: Range, timeRange: Range,
    vp: Viewport, min: number, max: number,

    use: (topX: number, topY: number, botX: number, botY: number) => void,
    scales?: number[],
) {
    const times = jsonData.columns[0];
    const dy = vp.height / (max - min);
    const dx = vp.width / (timeRange.end - timeRange.start);
    let botX = 0;
    for (let i = indexRange.start; i <= indexRange.end; i++) {

        const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;

        let botY = 0;
        for (let j = 1; j < index; j++) {
            botY += (jsonData.columns[j][i] as number - min) * dy * scales[j - 1];
        }

        const y = botY + (jsonData.columns[index][i] as number - min) * dy * scales[index - 1];
        use(x, (vp.height - y) * devicePixelRatio, botX === 0 ? x : botX, (vp.height - botY) * devicePixelRatio);
        botX = x;
    }
}

export function recountMaxBySumm(jsonData: JsonData, visibility: boolean[], indexRange: Range): MaxMin[] {
    let max = 10;
    for (let j = indexRange.start; j <= indexRange.end; j++) {
        let summ = 0;
        for (let i = 1; i < jsonData.columns.length; i++) {
            if (visibility[i]) {
                summ += jsonData.columns[i][j] as number;
            }
        }
        max = Math.max(max, summ);
    }
    return [[Math.ceil(max / 10) * 10, 0]];
}

export function recountAndUsePercentChart(
    jsonData: JsonData,
    index: number, _visibility: boolean[], indexRange: Range, timeRange: Range,
    vp: Viewport, _min: number, _max: number,

    use: (topX: number, topY: number, botX: number, botY: number) => void,
    scales?: number[],
) {
    const times = jsonData.columns[0];
    const dx = vp.width / (timeRange.end - timeRange.start);

    for (let i = indexRange.start; i <= indexRange.end; i++) {
        const x = ((times[i] as number) - timeRange.start) * dx * devicePixelRatio;

        let botY = 0;
        let totalY = 0;
        let y = 0;

        for (let j = 1; j < jsonData.columns.length; j++) {
            const line = jsonData.columns[j][i] as number * scales[j - 1];
            if (j < index) {
                botY += line;
            }
            if (j <= index) {
                y += line;
            }
            totalY += line;
        }

        use(x, (y / totalY * vp.height) * devicePixelRatio, x, (botY / totalY * vp.height) * devicePixelRatio);
    }
}

export function recountPercent(
    jsonData: JsonData,
    startIndex: number,
    scales: number[],
) {
    const result: number[] = [];

    for (let j = 1; j < jsonData.columns.length; j++) {
        result.push(jsonData.columns[j][startIndex] as number * scales[j - 1]);
    }

    const total = result.reduce((t, i) => t + i, 0);
    return result.map(item => item / total * 100);
}
