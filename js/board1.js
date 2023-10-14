
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
    board.fillLoop([(a,b) => board.fill3(a,b)]);
    board.placeLoop([(a,b) => board.place666(a,b)]);
    board.repaint();
    /*const poly = new Polygon(new Point(0,0), new Point(100, 100), 6);
    console.log(poly.points);
    console.log(poly.contains(new Point(10,10)));*/
    $$('button.fill').forEach(b => {
        b.addEventListener('click', e => {
            if (!board.selpoint) {
                return;
            }
            switch (b.innerText) {
                case 'Triangle': board.fill3(board.selpoint) && board.fill3(board.selpoint, true); break;
                case 'Hexagon': board.fill6(board.selpoint) && board.fill6(board.selpoint, true); break;
            }
            board.repaint();
        }); 
    });
});
