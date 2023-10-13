
import {$, $$} from './util.js';
import {Board} from './board.js';
import {Point, Edge, Polygon, randomEdgePoint} from './primitives.js';

window.addEventListener('load', () => {
    const canvas = $('#canvas');
    const board = new Board(canvas);
    /*const cp = new Point(400, 300);
    const ep = randomEdgePoint(cp, 6);
    const p = new Polygon(cp, ep, 6);
    board.addPoly(p);*/
    /*board.placeLoop([(a,b) => board.place4444(a,b)]);
    board.placeLoop([(a,b) => board.place4444(a,b)]);
    board.placeLoop([(a,b) => board.place4444(a,b)]);*/
    board.placeLoop([(a,b) => board.place666(a,b)]);
    board.placeLoop([(a,b) => board.place666(a,b)]);
    board.placeLoop([(a,b) => board.place666(a,b)]);
    board.placeLoop([(a,b) => board.place333333(a,b)]);
    board.placeLoop([(a,b) => board.place666(a,b)]);
    board.repaint();
});
