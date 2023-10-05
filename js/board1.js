
import {$, $$} from './util.js';
import {Board} from './board.js';
import {Point, Edge, Polygon, randomEdgePoint} from './primitives.js';

window.addEventListener('load', () => {
    const canvas = $('#canvas');
    const board = new Board(canvas);
    const cp = new Point(200, 200);
    const ep = randomEdgePoint(cp, 4);
    const p = new Polygon(cp, ep, 4);
    board.addPoly(p);
    board.repaint();
});
