
export {Board};

import {Point, Edge, Polygon, randomEdgePoint} from './primitives.js';

class Board {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.polys = [];
        this.edges = [];
    }

    addPoly(poly) {
        this.polys.push(poly);
        poly.edges.forEach(e => {
            for (let i=0; i<this.edges.length; i++) {
                if (this.edges[i].equals(e)) {
                    this.edges[i].polys.push(poly);
                    return;
                }
            }
            this.edges.push(e);
        });
    }

    addPolyOnEdge(e, n) {

    }

    repaint() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.polys.forEach(p => p.draw(this.ctx));
    }
}
