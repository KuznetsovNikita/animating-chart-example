import { DataService } from "src/data/service";
import Chart from "./chart";
import { toMenu } from "./menu";
import { toMiniMap } from "./mini-map";

export class Container {
    constructor(
        settings: DataService,
        public container = document.createElement('div'),
        public header = new Header(container),
        public chart = new Chart(container, settings),
    ) {
        document.body.append(container);
        container.id = 'app';

        toMiniMap(container, settings);
        toMenu(container, settings);
    }
}


class Header {
    constructor(
        container: HTMLDivElement,
        public element = document.createElement('div'),
    ) {
        container.appendChild(element);
        element.id = 'header';
        element.innerHTML = '<h1>Followers</h1>';
    }
}