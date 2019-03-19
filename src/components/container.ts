import { DataService } from "src/data/service";
import { toChart } from "./chart";
import { toMenu } from "./menu";
import { toMiniMap } from "./mini-map";

export function drawContainer(
    settings: DataService,
) {
    const container = document.createElement('div');
    document.body.append(container);
    container.id = 'app';

    const header = document.createElement('div');
    container.appendChild(header);
    header.id = 'header';
    header.innerHTML = '<h1>Followers</h1>';

    toChart(container, settings);
    toMiniMap(container, settings);
    toMenu(container, settings);
}
