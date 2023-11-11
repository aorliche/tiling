
export {noFillFn, Board};

import {approx, dist, fillCircle, strokeCircle} from './util.js';
import {EDGE_LEN, Point, Edge, Polygon, polyDistFromN, randomEdgePoint, thetaFromN} from './primitives.js';

function arrayContainsPoly(arr, p) {
    for (let i=0; i<arr.length; i++) {
        if (arr[i].id == p.id) {
            return true;
        }
    }
    return false;
}
    
// Get free angles around point
// Choose a start point
// Get all taken and free angles from 0 to 2pi
function getFreeAngles(p) {
    const starts = [];
    const ends = [];
    const free = [];
    p.polys.forEach(poly => {
        const [start, end] = getStartEndAngles(poly, p);
        starts.push(start);
        ends.push(end);
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

// Get start and end angles around a polygon
function getStartEndAngles(poly, p) {
    const [p0, p1] = poly.pointsNextTo(p);
    const [d0, d1] = [p0.sub(p), p1.sub(p)];
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
    // Start always less than end
    if (t1 < t0) {
        [t0, t1] = [t1, t0];
    }
    return [t0, t1];
}

function nearby(a, b) {
    return Math.abs(a-b) < 1e-3;
}

function noFillFn() {
    return true;
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
        canvas.addEventListener('click', e => {
            this.click(new Point(e.offsetX, e.offsetY));
            this.repaint();
        });
        this.player = 'black';
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
    
    canonicalPoints(poly) {
        if (poly.canonicalPoints) {
            return poly.canonicalPoints;
        }
        const points = [];
        this.points.forEach(p => {
            if (arrayContainsPoly(p.polys, poly)) {
                points.append(p);
            }
        });
        poly.canonicalPoints = points;
        return points;
    }

    click(p) {
        this.selpoint = null;
        for (let i=0; i<this.points.length; i++) {
            if (p.dist(this.points[i]) < 10) {
                this.selpoint = this.points[i];
                break;
            }
        }
    }

    loop(fns) {
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
    
    fill(p, M, place) {
        const d = polyDistFromN(M);
        const theta = thetaFromN(M);
        let starts, ends, free;
        // First vertex on board
        if (p.polys.length == 0) {
            [starts, ends, free] = [[0], [0], [2*Math.PI]];
        // Not first vertex
        } else {
            [starts, ends, free] = getFreeAngles(p);
        }
        for (let i=0; i<ends.length; i++) {
            const td = free[i];
            if (nearby(td, 0)) {
                continue;
            }
            const n = td/theta;
            const N = Math.round(n);
            if (nearby(n, N)) {
                for (let j=0; j<N; j++) {
                    const t = ends[i] + theta/2 + j*theta;
                    const cp = new Point(p.x+d*Math.cos(t), p.y+d*Math.sin(t));
                    const poly = new Polygon(cp, p, M);
                    if (place) {
                        this.addPoly(poly);
                    } else if (this.polyOverlapsTiling(poly)) {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        return true;
    }

    neighbors(poly) {
        for (let i=0; i<this.points.length; i++) {
            
        }
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
        set.sort((p1, p2) => {
            return Math.atan2(p1.y - cp.y, p1.x - cp.x) - Math.atan2(p2.y - cp.y, p2.x - cp.x);
        });
        return set;
    }

    // Add just one poly to a vertex
    // Different from fill because it skips free areas that are insufficiently large
    placeOne(p, M, place) {
        const d = polyDistFromN(M);
        const theta = thetaFromN(M);
        let found = false;
        let starts, ends, free;
        // First vertex on board
        if (p.polys.length == 0) {
            [starts, ends, free] = [[0], [0], [2*Math.PI]];
        // Not first vertex
        } else {
            [starts, ends, free] = getFreeAngles(p);
        }
        for (let i=0; i<ends.length; i++) {
            const td = free[i];
            if (nearby(td, 0)) {
                continue;
            }
            const n = td/theta;
            if (nearby(n, 1) || n > 1) {
                const t = ends[i] + theta/2;
                const cp = new Point(p.x+d*Math.cos(t), p.y+d*Math.sin(t));
                const poly = new Polygon(cp, p, M);
                if (place) {
                    this.addPoly(poly);
                } else if (this.polyOverlapsTiling(poly)) {
                    continue;
                }
                found = true;
                break;
            } 
        }
        return found;
    }

    polyOverlapsTiling(poly) {
        for (let i=0; i<this.points.length; i++) {
            if (poly.contains(this.points[i])) {
                let nearby = true;
                for (let j=0; j<poly.edges.length; j++) {
                    const edge = poly.edges[j];
                    const [p0, p1] = edge.points;
                    if (this.points[i].nearby(p0) || this.points[i].nearby(p1)) {
                        nearby = false;
                        break;
                    }
                }
                if (nearby) {
                    return true;
                }
            }
        }
        return false;
    }

    repaint() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.polys.forEach(p => p.draw(this.ctx));
        //this.points.forEach(p => p.draw(this.ctx));
        if (this.selpoint) {
            this.selpoint.draw(this.ctx, 5, 'red');
        }
        this.points.forEach(p => {
            if (p.player) {
                if (p.player === 'black') {
                    fillCircle(this.ctx, p, 5, 'black');
                } else if (p.player === 'white') {
                    fillCircle(this.ctx, p, 5, 'white');
                    strokeCircle(this.ctx, p, 5, 'black');
                }
            } else if (p.hover) {
                if (this.player == 'black') {
                    fillCircle(this.ctx, p, 5, 'black');
                } else {
                    fillCircle(this.ctx, p, 5, 'white');
                    strokeCircle(this.ctx, p, 5, 'black');
                }
            }

        });
    }
    
    hover(x, y) {
        const hp = new Point(x, y);
        this.points.forEach(p => {
            if (p.player) {
                p.hover = false;
                return;
            }
            const d = dist(hp, p);
            const h = d < EDGE_LEN/2;
            p.hover = h;
        });
    }
    
    click(x, y) {
        const cp = new Point(x, y);
        this.points.forEach(p => {
            if (p.player) {
                return;
            }
            const d = dist(p, cp);
            const h = d < EDGE_LEN/2;
            if (h) {
                const sav = this.savePoints();
                p.player = this.player;
                this.player = this.player == 'black' ? 'white' : 'black';
                this.cullCaptured(this.player);
                if (this.pointsInHistory(this.savePoints())) {
                    this.player = this.player == 'black' ? 'white' : 'black';
                    this.loadPoints(sav);
                    return;
                }
                this.history.push(JSON.stringify(sav));
            }
        });
    }

    pointsInHistory(ps) {
        ps = JSON.stringify(ps);
        for (let i=0; i<this.history.length; i++) {
            const h = this.history[i];
            if (h == ps) {
                return true;
            }
        }
        return false;
    }

    savePoints() {
        const ps = [];
        this.points.forEach(p => {
           ps.push({id: p.id, player: p.player ? p.player : null}); 
        });
        return ps;
    }

    loadPoints(ps) {
        this.points.forEach(p => {
            for (let i=0; i<ps.length; i++) {
                if (ps[i].id == p.id) {
                    p.player = ps[i].player;
                    break;
                }
            }
        });
    }
    
    initNeighbors() {
        function arrContainsPoint(arr, p) {
            for (let i=0; i<arr.length; i++) {
                if (arr[i].id == p.id) {
                    return true;
                }
            }
            return false;
        }
        this.neighbors = {};
        this.id2point = {};
        this.history = [];
        let id = 0;
        this.points.forEach(p => {
            p.id = id++;
            this.id2point[p.id] = p;
        })
        this.points.forEach(p1 => {
            this.points.forEach(p2 => {
                if (approx(p1.dist(p2), EDGE_LEN)) {
                    if (!this.neighbors[p1.id]) {
                        this.neighbors[p1.id] = [];
                    }
                    if (!this.neighbors[p2.id]) {
                        this.neighbors[p2.id] = [];
                    }
                    if (this.neighbors[p1.id].indexOf(p2.id) == -1) {   
                        this.neighbors[p1.id].push(p2.id);
                    }
                    if (this.neighbors[p2.id].indexOf(p1.id) == -1) {
                        this.neighbors[p2.id].push(p1.id);
                    }
                }
            });
        });
    }
    
    cullCaptured(player) {
        // Try to find a connected empty space
        function cull(pid, neighbors, visited, id2point) {
            const frontier = [pid];
            const region = new Set();
            let foundempty = false;
            while (frontier.length > 0) {
                const id = frontier.pop();
                const ns = neighbors[id];
                for (let i=0; i<ns.length; i++) {
                    if (frontier.includes(ns[i]) || region.has(ns[i])) {
                        continue;
                    }
                    const ip = id2point[ns[i]];
                    if (ip.player == player || !ip.player) {
                        if (!ip.player) {
                            foundempty = true;
                        }
                        frontier.push(ns[i]);
                    }
                }
                visited.add(id);
                region.add(id);
            }
            if (!foundempty) {
                region.forEach(id => {
                    id2point[id].player = null;
                });
            }
        }
        const visited = new Set();
        this.points.forEach(p => {
            if (!visited.has(p.id) && p.player == player) {
                cull(p.id, this.neighbors, visited, this.id2point);
            }
        });
    }
}
