import { DataService } from "src/data/service";
import Chart from "./chart";
import { Menu } from "./menu";
import { MiniMap } from "./mini-map";

export class Container {
    constructor(
        settings: DataService,
        public container = document.createElement('div'),
        public header = new Header(container),
        public chart = new Chart(container, settings),
        public miniMap = new MiniMap(container, settings),
        public menu = new Menu(container, settings),
    ) {
        document.body.append(container);
        container.id = 'app';
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