import { drawContainer } from './components/container';
import { DataService } from './data/service';
import './style/index.css';

function init() {
    const width = Math.min(window.innerWidth, 500);

    const settings = [
        new DataService(width, '1'),
        new DataService(width, '2'),
        new DataService(width, '3'),
        new DataService(width, '4'),
        new DataService(width, '5'),
    ];

    drawContainer(settings, width);
}

window.onload = init;
