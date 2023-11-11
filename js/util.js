
export {$, $$, approx, ccw, dist, fillCircle, strokeCircle, Point};

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

function approx(a, b) {
    return Math.abs(a-b) < 0.01;
}

class Point {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    equals(p) {
        return approx(this.x, p.x) && approx(this.y, p.y);
    }
}

// https://math.stackexchange.com/questions/2941053/orientation-of-three-points-in-a-plane 
function ccw(p1, p2, p3) {
    const d = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return d > 0;
}

function dist(a, b) {
    return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2))
}

function fillCircle(ctx, c, r, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, 2*Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
}

function strokeCircle(ctx, c, r, color) {
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.arc(c.x, c.y, r, 0, 2*Math.PI);
    ctx.closePath();
    ctx.stroke();
}
