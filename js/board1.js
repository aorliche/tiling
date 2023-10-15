
import {$, $$} from './util.js';
import {noFillFn, Board} from './board.js';
import {Point, Edge, Polygon, randomEdgePoint} from './primitives.js';

window.addEventListener('load', () => {
    const canvas = $('#canvas');
    const board = new Board(canvas);
    board.loop([(a,b) => board.fill(a,6,b)]);
    board.loop([(a,b) => board.fill(a,3,b)]);
    board.loop([(a,b) => board.fill(a,4,b)]);
    board.loop([(a,b) => board.fill(a,3,b)]);
    board.loop([(a,b) => board.fill(a,4,b)]);
    board.loop([(a,b) => board.fill(a,3,b)]);
    board.loop([noFillFn, (a,b) => board.fill(a,4,b)]);
    board.loop([(a,b) => board.placeOne(a,3,b)]);
    board.loop([(a,b) => board.fill(a,6,b)]);
    board.loop([(a,b) => board.fill(a,3,b)]);
    board.loop([(a,b) => board.fill(a,3,b)]);
    board.repaint();
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
