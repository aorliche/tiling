
export {Board};

import {Point, Edge, Polygon, polyDistFromN, randomEdgePoint, thetaFromN} from './primitives.js';

function arrayContainsPoly(arr, p) {
    for (let i=0; i<arr.length; i++) {
        if (arr[i].id == p.id) {
            return true;
        }
    }
    return false;
}

function nearby(a, b) {
    return Math.abs(a-b) < 1e-3;
}

function pointFreeAngle(p) {
    let sum = 0;
    p.polys.forEach(poly => {
        const t = thetaFromN(poly.n);
        sum += t;
    });
    return 2*Math.PI - sum;
}

class Board {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.polys = [];
        this.points = [];
    }

    addPoly(poly) {
        this.polys.push(poly);
        poly.edges.forEach(e => {
            let [donea, doneb] = [false, false];
            for (let i=0; i<this.points.length; i++) {
                if (!donea && e.points[0].nearby(this.points[i])) {
                    if (!arrayContainsPoly(this.points[i].polys, poly)) {
                        this.points[i].polys.push(poly);
                    }
                    donea = true;
                }
                if (!doneb && e.points[1].nearby(this.points[i])) {
                    if (!arrayContainsPoly(this.points[i].polys, poly)) {
                        this.points[i].polys.push(poly);
                    }
                    doneb = true;
                }
                if (donea && doneb) {
                    break;
                }
            }
            if (!donea) {
                this.points.push(e.points[0].clone());
                this.points.at(-1).polys = [poly];
            }
            if (!doneb) {
                this.points.push(e.points[1].clone());
                this.points.at(-1).polys = [poly];
            }
        });
    }

    nextFromCenter() {
        const cp = new Point(this.canvas.width/2, this.canvas.height/2);
        let mind = Infinity;
        let set = [];
        this.points.forEach(p => {
            if (nearby(pointFreeAngle(p), 0)) {
                return;
            }
            const d = cp.sub(p).mag();
            if (Math.abs(d-mind) < 1e-3) {
                set.push(p);
            } else if (d < mind) {
                mind = d;
                set = [p];
            } 
        });
        return set;
    }

    placeLoop(fns) {
        let points;
        if (this.points.length == 0) {
            points = [new Point(this.canvas.width/2, this.canvas.height/2)];
            points[0].polys = [];
        } else {
            points = this.nextFromCenter();
        }
        for (let offset=0; offset<fns.length; offset++) {
            let allgood = true;
            for (let i=0; i<points.length; i++) {
                const j = (i+offset) % fns.length;
                const fn = fns[j];
                if (!fn(points[i])) {
                    allgood = false;
                    break;
                }
            }
            if (allgood) {
                for (let k=0; k<points.length; k++) {
                    const j = (k+offset) % fns.length;
                    const fn = fns[j];
                    if (!fn(points[k], true)) {
                        console.log('Failed');
                        throw 'bad';
                    }
                }
                return;
            }
        }
        console.log('No good placement found');
    }

    // Get free angles around point
    // Choose a start point
    // Get all taken and free angles from 0 to 2pi
    getFreeAngles(p) {
        const starts = [];
        const ends = [];
        const free = [];
        p.polys.forEach(poly => {
            const [p0, p1] = poly.pointsNextTo(p);
            const d0 = p0.sub(p);
            const d1 = p1.sub(p);
            let t0 = Math.atan2(d0.y, d0.x);
            let t1 = Math.atan2(d1.y, d1.x);
            if (t0 < 0) {
                t0 += 2*Math.PI;
            }
            if (t1 < 0) {
                t1 += 2*Math.PI;
            }
            // Wraparound
            // Assume no polys take more than pi radians (infinite circle)
            if (Math.abs(t0 - t1) > Math.PI) {
                if (t0 < Math.PI) {
                    t0 += 2*Math.PI;
                } else {
                    t1 += 2*Math.PI;
                }
            }
            if (t1 < t0) {
                [t0, t1] = [t1, t0];
            }
            starts.push(t0);
            ends.push(t1);
        });
        starts.sort((a, b) => a-b);
        ends.sort((a, b) => a-b);
        // Get free angles
        for (let i=0; i<ends.length; i++) {
            let td;
            if (i == ends.length-1) {
                td = starts[0] + 2*Math.PI - ends[i];
            } else {
                td = starts[i+1] - ends[i];
            }
            free.push(td);
        }
        return [starts, ends, free];
    }
    
    place333333(p, place) {
        const d = polyDistFromN(3);
        let starts, ends, free;
        // First vertex on board
        if (p.polys.length == 0) {
            [starts, ends, free] = [[0], [0], [2*Math.PI]];
        // Not first vertex
        } else {
            [starts, ends, free] = this.getFreeAngles(p);
        }
        for (let i=0; i<ends.length; i++) {
            const td = free[i];
            if (nearby(td, 0)) {
                continue;
            }
            const n = td/(Math.PI/3);
            const N = Math.round(n);
            if (nearby(n, N)) {
                for (let j=0; j<N; j++) {
                    const t = ends[i] + Math.PI/6 + j*Math.PI/3;
                    const cp = new Point(p.x+d*Math.cos(t), p.y+d*Math.sin(t));
                    if (place) {
                        this.addPoly(new Polygon(cp, p, 3));
                    }
                }
            } else {
                return false;
            }
        }
        return true;
    }

    place4444(p, place) {
        const d = polyDistFromN(4);
        let starts, ends, free;
        // First vertex on board
        if (p.polys.length == 0) {
            [starts, ends, free] = [[0], [0], [2*Math.PI]];
        // Not first vertex
        } else {
            [starts, ends, free] = this.getFreeAngles(p);
        }
        for (let i=0; i<ends.length; i++) {
            const td = free[i];
            if (nearby(td, 0)) {
                continue;
            }
            const n = td/(Math.PI/2);
            if (nearby(n, 1) || nearby(n, 2) || nearby(n, 3) || nearby(n, 4)) {
                const N = Math.round(n);
                for (let j=0; j<N; j++) {
                    const t = ends[i] + Math.PI/4 + j*Math.PI/2;
                    const cp = new Point(p.x+d*Math.cos(t), p.y+d*Math.sin(t));
                    if (place) {
                        this.addPoly(new Polygon(cp, p, 4));
                    }
                }
            } else {
                return false;
            }
        }
        return true;
    }

    place666(p, place) {
        const d = polyDistFromN(6);
        let starts, ends, free;
        // First vertex on board
        if (p.polys.length == 0) {
            [starts, ends, free] = [[0], [0], [2*Math.PI]];
        // Not first vertex
        } else {
            [starts, ends, free] = this.getFreeAngles(p);
        }
        for (let i=0; i<ends.length; i++) {
            const td = free[i];
            if (nearby(td, 0)) {
                continue;
            }
            const n = td/(2*Math.PI/3);
            if (nearby(n, 1) || nearby(n, 2) || nearby(n, 3)) {
                const N = Math.round(n);
                for (let j=0; j<N; j++) {
                    const t = ends[i] + Math.PI/3 + j*2*Math.PI/3;
                    const cp = new Point(p.x+d*Math.cos(t), p.y+d*Math.sin(t));
                    if (place) {
                        this.addPoly(new Polygon(cp, p, 6));
                    }
                }
            } else {
                return false;
            }
        }
        return true;
    }

    repaint() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.polys.forEach(p => p.draw(this.ctx));
    }
}
