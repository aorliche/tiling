
export {$, $$, ccw};

const $ = (q) => document.querySelector(q);
const $$ = (q) => [...document.querySelectorAll(q)];

// https://math.stackexchange.com/questions/2941053/orientation-of-three-points-in-a-plane 
function ccw(p1, p2, p3) {
    const d = (p2.x - p1.x) * (p3.y - p1.y) - (p2.y - p1.y) * (p3.x - p1.x);
    return d > 0;
}
