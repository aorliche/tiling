
export {Point, Edge, Polygon, polyDistFromN, randomEdgePoint};

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

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, 2*Math.PI);
        ctx.fill();
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
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        ctx.lineTo(this.points[1].x, this.points[1].y);
        ctx.stroke();
        this.points[0].draw(ctx);
        this.points[1].draw(ctx);
    }
}

function polyDistFromN(n) {
    const theta = 2*Math.PI/n;
    console.log(theta);
    const d = Math.sqrt(EDGE_LEN*EDGE_LEN/2/(1-Math.cos(theta)));
    console.log(d);
    return d;
}

function randomEdgePoint(cp, n) {
    const d = polyDistFromN(n);
    const theta = Math.random() * 2*Math.PI;
    const p = new Point(cp.x+d*Math.cos(theta), cp.y+d*Math.sin(theta));
    return p;
}

class Polygon {
    // Center point, edge point, number of edges
    constructor(cp, ep, n) {
        this.n = n;
        this.cp = cp;
        this.points = [ep];
        this.edges = [];
        const theta = (Math.PI - 2*Math.PI/n) / 2;
        for (let i=0; i<n; i++) {
            const d = cp.sub(ep);
            const dm = d.mag();
            const d2 = d.mult(EDGE_LEN/dm);
            const np = d2.rotate(theta).add(ep);
            const ne = new Edge(ep.clone(), np.clone());
            this.edges.push(ne);
            ep = np;
        }
    }

    draw(ctx) {
        this.edges.forEach(e => e.draw(ctx));
        this.cp.draw(ctx);
    }
}