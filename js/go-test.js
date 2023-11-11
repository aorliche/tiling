
import {$, $$, dist, fillCircle, strokeCircle, Point} from './util.js';

class Go {
    constructor(canvas, size, edgeLen) {
        this.canvas = canvas;
        this.grid = new Array(size);
        for (let i=0; i<size; i++) {
            this.grid[i] = new Array(size);
        }
        this.edgeLen = edgeLen;
        this.ctx = canvas.getContext('2d');
        this.initCorners();
        this.initNeighbors();
        this.history = [];
        this.player = 'black';
    }

    addToHistory() {
        this.history.push(JSON.parse(JSON.stringify(this.grid)));
    }

    curInHistory() {
        const sz = this.grid.length;
        for (let i=0; i<this.history.length; i++) {
            let diff = false;
            for (let j=0; j<sz; j++) {
                for (let k=0; k<sz; k++) {
                    if (this.history[i][j][k] != this.grid[j][k]) {
                        diff = true;
                        break;
                    }
                }
            }
            if (!diff) {
                return true;
            }
        }
        return false;
    }

    cullCaptured(player) {
        // Try to find a connected empty space
        function cull(i, j, neighbors, grid, visited) {
            const sz = grid.length;
            const idx = i*sz+j;
            const frontier = [idx];
            const region = new Set();
            let foundempty = false;
            while (frontier.length > 0) {
                const idx = frontier.pop();
                const ns = neighbors[idx];
                for (let i=0; i<ns.length; i++) {
                    if (frontier.includes(ns[i]) || region.has(ns[i])) {
                        continue;
                    }
                    const x = Math.floor(ns[i]/sz);
                    const y = ns[i]-x*sz;
                    if (grid[x][y] == player || !grid[x][y]) {
                        if (!grid[x][y]) {
                            foundempty = true;
                        }
                        frontier.push(ns[i]);
                    }
                }
                const x = Math.floor(idx/sz);
                const y = idx-x*sz;
                visited[x][y] = true;
                region.add(idx);
            }
            if (!foundempty) {
                region.forEach(idx => {
                    const x = Math.floor(idx/sz);
                    const y = idx-x*sz;
                    grid[x][y] = null;
                });
            }
        }
        const sz = this.grid.length;
        const visited = new Array(sz);
        for (let i=0; i<sz; i++) {
            visited[i] = new Array(sz);
            for (let j=0; j<sz; j++) {
                visited[i][j] = false;
            }
        }
        for (let i=0; i<sz; i++) {
            for (let j=0; j<sz; j++) {
                if (!visited[i][j] && this.grid[i][j] === player) {
                    cull(i, j, this.neighbors, this.grid, visited);
                }
            }
        }
    }

    initCorners() {
        const sz = this.grid.length;
        const off = (sz-1)/2*this.edgeLen;
        this.corners = [];
        for (let i=0; i<sz; i++) {
            this.corners[i] = new Array(sz);
            for (let j=0; j<sz; j++) {
                this.corners[i][j] = new Point(i*this.edgeLen-off, j*this.edgeLen-off);
            }
        }
    }
    
    initNeighbors() {
        function arrContainsPoint(arr, p) {
            for (let i=0; i<arr.length; i++) {
                if (arr[i].equals(p)) {
                    return true;
                }
            }
            return false;
        }
        const sz = this.grid.length;
        this.neighbors = {};
        this.iterateGrid(0, 0, (p, x, y) => {
            for (let dx=-1; dx<2; dx++) {
                for (let dy=-1; dy<2; dy++) {
                    if (dx == 0 && dy == 0) {
                        continue;
                    }
                    if (dx != 0 && dy != 0) {
                        continue;
                    }
                    const xp = x+dx;
                    const yp = y+dy;
                    if (xp < 0 || yp < 0 || xp >= sz || yp >= sz) {
                        continue;
                    }
                    const from = x*sz+y;
                    const to = xp*sz+yp;
                    if (!this.neighbors[from]) {
                        this.neighbors[from] = [];
                    }
                    if (!this.neighbors[to]) {
                        this.neighbors[to] = [];
                    }
                    if (!this.neighbors[from].includes(to)) {
                        this.neighbors[from].push(to);
                    }
                    if (!this.neighbors[to].includes(from)) {
                        this.neighbors[to].push(from);
                    }
                }
            }
        });
    }

    iterateGrid(x, y, fn) {
        const sz = this.grid.length;
        const p = new Point(x-this.canvas.width/2, y-this.canvas.height/2);
        for (let i=0; i<sz; i++) {
            for (let j=0; j<sz; j++) {
                fn(p, i, j);
            }
        }
    }

    nextPlayer() {
        this.player = this.player === 'black' ? 'white' : 'black';
    }

    click(x, y) {
        this.iterateGrid(x, y, (p, i, j) => {
            if (this.grid[i][j]) {
                return;
            }
            const d = dist(p, this.corners[i][j]);
            const h = d < this.edgeLen/2;
            if (h) {
                const sav = JSON.parse(JSON.stringify(this.grid));
                this.grid[i][j] = this.player;
                this.nextPlayer();
                this.cullCaptured(this.player);
                // Cannot repeat a position
                if (this.curInHistory()) {
                    this.nextPlayer();
                    this.grid = sav;
                    return;
                }
                this.corners[i][j].hover = false;
                this.addToHistory();
            }
        });
    }

    hover(x, y) {
        this.iterateGrid(x, y, (p, i, j) => {
            if (this.grid[i][j]) {
                this.corners[i][j].hover = false;
                return;
            }
            const d = dist(p, this.corners[i][j]);
            const h = d < this.edgeLen/2;
            this.corners[i][j].hover = h;
        });
    }

    repaint() {
        // Draw the grid
        const sz = this.grid.length;
        const off = (sz-1)/2*this.edgeLen;
        // Clear before centering
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // With translation
        this.ctx.translate(this.canvas.width/2, this.canvas.height/2);
        for (let i=0; i<sz; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i*this.edgeLen-off, -off);
            this.ctx.lineTo(i*this.edgeLen-off, off);
            this.ctx.stroke();
            this.ctx.beginPath();
            this.ctx.moveTo(-off, i*this.edgeLen-off);
            this.ctx.lineTo(off, i*this.edgeLen-off);
            this.ctx.stroke();
        }
        this.iterateGrid(0, 0, (p, i, j) => {
            if (this.grid[i][j] === 'black') {
                fillCircle(this.ctx, this.corners[i][j], 5, 'black');
            } else if (this.grid[i][j] === 'white') {
                fillCircle(this.ctx, this.corners[i][j], 5, 'white');
                strokeCircle(this.ctx, this.corners[i][j], 5, 'black');
            }
        });
        this.iterateGrid(0, 0, (p, i, j) => {
            if (this.corners[i][j].hover) {
                if (this.player == 'black') {
                    fillCircle(this.ctx, this.corners[i][j], 5, 'black');
                } else {
                    fillCircle(this.ctx, this.corners[i][j], 5, 'white');
                    strokeCircle(this.ctx, this.corners[i][j], 5, 'black');
                }
            }
        });
        this.ctx.translate(-this.canvas.width/2, -this.canvas.height/2);
    }
}

window.addEventListener('load', () => {
    const canvas = $('#canvas');
    const go = new Go(canvas, 10, 30);  
    go.repaint();
    $('#canvas').addEventListener('mousemove', (e) => {
        go.hover(e.offsetX, e.offsetY);
        go.repaint();
    });
    $('#canvas').addEventListener('click', (e) => {
        go.click(e.offsetX, e.offsetY);
        go.repaint();
    })
});
