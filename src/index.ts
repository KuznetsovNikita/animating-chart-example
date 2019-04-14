import { drawContainer } from './components/container';
import { DataService } from './models/service';
import './polyfills/promise/polyfill';
import './style/index.css';

function init() {
    const width = Math.min(window.innerWidth, 600);
    const settings = ['1', '2', '3', '4', '5'];
    drawContainer(settings.map(url => new DataService(width, url)), width);
}

window.onload = init;
