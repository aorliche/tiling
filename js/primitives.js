
export {EDGE_LEN, Point, Edge, Polygon, polyDistFromN, randomEdgePoint, thetaFromN};

let EDGE_LEN = 40;

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(p) {
        return new Point(this.x+p.x, this.y+p.y);
    }

    clone() {
        return new Point(this.x, this.y);
    }

    dist(p) {
        return Math.sqrt(Math.pow(this.x-p.x,2) + Math.pow(this.y-p.y,2));
    }

    draw(ctx, rad, fillStyle) {
        ctx.save();
        if (fillStyle) {
            ctx.fillStyle = fillStyle;
        }
        rad = rad || 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, rad, 0, 2*Math.PI);
        ctx.fill();
        ctx.restore();
    }

    mag() {
        return Math.sqrt(this.x*this.x + this.y*this.y);
    }

    mult(a) {
        return new Point(this.x*a, this.y*a);
    }

    nearby(p) {
        return this.dist(p) < 1e-3;
    }

    negate(p) {
        return new Point(-this.x, -this.y);
    }

    rotate(theta) {
        return new Point(this.x*Math.cos(theta) - this.y*Math.sin(theta), this.x*Math.sin(theta) + this.y*Math.cos(theta));
    }

    str() {
        return `(${this.x},${this.y})`
    }

    sub(p) {
        return new Point(this.x-p.x, this.y-p.y);
    }
}

class Edge {
    constructor(p1, p2) {
        this.points = [p1, p2];
        this.polys = [];
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.lineTo(this.points[1].x, this.points[1].y);
        ctx.stroke();
        //this.points[0].draw(ctx);
        //this.points[1].draw(ctx);
    }

    equals(e) {
        if (this.points[0].nearby(e.points[0]) && this.points[1].nearby(e.points[1])) {
            return true;
        }
        if (this.points[1].nearby(e.points[0]) && this.points[0].nearby(e.points[1])) {
            return true;
        }
        return false;
    }
}

function thetaFromN(n) {
    return Math.PI - 2*Math.PI/n;
}

function polyDistFromN(n) {
    const theta = 2*Math.PI/n;
    const d = Math.sqrt(EDGE_LEN*EDGE_LEN/2/(1-Math.cos(theta)));
    return d;
}

function randomEdgePoint(cp, n) {
    const d = polyDistFromN(n);
    const theta = Math.random() * 2*Math.PI;
    const p = new Point(cp.x+d*Math.cos(theta), cp.y+d*Math.sin(theta));
    return p;
}

function ccw(a, b, c) {
	return (b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y);
}

function arrayContainsPoint(a, p) {
    for (let i=0; i<a.length; i++) {
        if (a[i].nearby(p)) {
            return true;
        }
    }
    return false;
}

let polyCount = 0;

class Polygon {
    // Center point, edge point, number of edges
    constructor(cp, ep, n) {
        this.id = polyCount++;
        this.n = n;
        this.cp = cp;
        this.edges = [];
        const theta = (Math.PI - 2*Math.PI/n) / 2;
        for (let i=0; i<n; i++) {
            const d = cp.sub(ep);
            const dm = d.mag();
            const d2 = d.mult(EDGE_LEN/dm);
            const np = d2.rotate(theta).add(ep);
            const ne = new Edge(ep.clone(), np.clone());
            ne.polys = [this];
            this.edges.push(ne);
            ep = np;
        }
    }

   contains(p) {
        for (let i=0; i<this.edges.length; i++) {
            // Not sure about edge direction, use center as reference point
            let ref = ccw(this.edges[i].points[0], this.edges[i].points[1], this.cp);
            ref = ref > 0 ? 1 : -1;
            let trial = ccw(this.edges[i].points[0], this.edges[i].points[1], p);
            trial = trial > 0 ? 1 : -1;
            if (ref != trial) {
                return false;
            }
        }
        return true;
    }

    draw(ctx) {
        this.edges.forEach(e => e.draw(ctx));
        /*this.cp.draw(ctx);
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i=1; i<this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        ctx.save();
        ctx.fillStyle = this.color ? this.color : '#f99';
        ctx.fill();
        ctx.restore();*/
    }

    pointsNextTo(p) {
        const ps = [];
        this.edges.forEach(e => {
            if (e.points[0].nearby(p)) {
                ps.push(e.points[1]);
            } else if (e.points[1].nearby(p)) {
                ps.push(e.points[0]);
            }
        });
        return ps;
    }
}
