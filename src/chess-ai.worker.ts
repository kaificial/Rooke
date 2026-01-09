

const pst_p = [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0
];
const pst_n = [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50
];
const pst_b = [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20
];
const pst_r = [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0
];
const pst_q = [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20
];
const pst_k = [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20
];

// Piece Values
const weights = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const pst_map = { p: pst_p, n: pst_n, b: pst_b, r: pst_r, q: pst_q, k: pst_k };

// Board Representation
let board = new Array(64).fill(null);
let turn: 'w' | 'b' = 'w';
let colorMultiplier = 1;

// Parse FEN
function parseFen(fen: string) {
    board.fill(null);
    const parts = fen.split(' ');
    const rows = parts[0].split('/');
    let sq = 0;
    for (let r = 0; r < 8; r++) {
        let col = 0;
        for (let i = 0; i < rows[r].length; i++) {
            const char = rows[r][i];
            if (/\d/.test(char)) {
                col += parseInt(char);
            } else {
                const color = (char === char.toUpperCase()) ? 'w' : 'b';
                const type = char.toLowerCase();
                const index = r * 8 + col;
                board[index] = { type, color };
                col++;
            }
        }
    }
    turn = parts[1] as 'w' | 'b';
}

// Board
function evaluate(b: any[]) {
    let score = 0;
    for (let i = 0; i < 64; i++) {
        const p = b[i];
        if (!p) continue;

        let val = weights[p.type as keyof typeof weights];
        let pst = pst_map[p.type as keyof typeof pst_map];

        let pstVal = 0;
        if (p.color === 'w') {
            pstVal = pst[i];
        } else {
            pstVal = pst[63 - i];
        }

        if (p.color === 'w') score += (val + pstVal);
        else score -= (val + pstVal);
    }
    return score;
}

// Move Generation 
function generateMoves(b: any[], color: 'w' | 'b') {
    const moves: any[] = [];
    for (let i = 0; i < 64; i++) {
        const p = b[i];
        if (!p || p.color !== color) continue;

        const r = Math.floor(i / 8);
        const c = i % 8;

        if (p.type === 'p') {
            const dir = (color === 'w') ? -8 : 8;
            const startRow = (color === 'w') ? 6 : 1;
            if (!b[i + dir]) {
                moves.push({ from: i, to: i + dir });
                if (r === startRow && !b[i + dir * 2]) moves.push({ from: i, to: i + dir * 2 });
            }
            const captures = (color === 'w') ? [i - 9, i - 7] : [i + 7, i + 9];
            for (let cap of captures) {
                const capC = cap % 8;
                if (Math.abs(capC - c) > 1) continue;
                if (b[cap] && b[cap].color !== color) moves.push({ from: i, to: cap });
            }
        } else {
            const dirs = {
                n: [-17, -15, -10, -6, 6, 10, 15, 17],
                b: [-9, -7, 7, 9],
                r: [-8, -1, 1, 8],
                q: [-9, -7, 7, 9, -8, -1, 1, 8],
                k: [-9, -7, 7, 9, -8, -1, 1, 8]
            };
            const vectors = dirs[p.type as keyof typeof dirs] || []; // Fallback for safety
            const isSlider = ['b', 'r', 'q'].includes(p.type);

            for (let v of vectors) {
                let target = i;
                while (true) {
                    const startC = target % 8;
                    target += v;
                    const destC = target % 8;
                    if (target < 0 || target > 63 || Math.abs(destC - startC) > 2) break;

                    const occ = b[target];
                    if (!occ) {
                        moves.push({ from: i, to: target });
                    } else {
                        if (occ.color !== color) moves.push({ from: i, to: target });
                        break;
                    }
                    if (!isSlider || p.type === 'n' || p.type === 'k') break;
                }
            }
        }
    }
    return moves;
}

// Minimax with Tree 
let nodeCount = 0;

function minimax(depth: number, alpha: number, beta: number, isMaximizing: boolean, parentId: number = -1): number {
    const currentNodeId = nodeCount++;
    if (depth >= 1) {
        postMessage({ type: 'treeNode', id: currentNodeId, parentId, depth });
    }

    if (depth === 0) {
        const score = evaluate(board);
        if (depth >= 1) postMessage({ type: 'treeNodeUpdate', id: currentNodeId, score });
        return score;
    }

    const color = isMaximizing ? 'w' : 'b';
    const moves = generateMoves(board, color);

    if (moves.length === 0) {
        return isMaximizing ? -Infinity : Infinity;
    }

    if (isMaximizing) {
        let maxEval = -Infinity;
        for (let move of moves) {
            const saved = board[move.to];
            board[move.to] = board[move.from];
            board[move.from] = null;

            const evalScore = minimax(depth - 1, alpha, beta, false, currentNodeId);

            board[move.from] = board[move.to];
            board[move.to] = saved;

            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
        }
        if (depth >= 1) postMessage({ type: 'treeNodeUpdate', id: currentNodeId, score: maxEval });
        return maxEval;
    } else {
        let minEval = Infinity;
        for (let move of moves) {
            const saved = board[move.to];
            board[move.to] = board[move.from];
            board[move.from] = null;

            const evalScore = minimax(depth - 1, alpha, beta, true, currentNodeId);

            board[move.from] = board[move.to];
            board[move.to] = saved;

            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
        }
        if (depth >= 1) postMessage({ type: 'treeNodeUpdate', id: currentNodeId, score: minEval });
        return minEval;
    }
}

function searchBestMove(depth: number) {
    const start = Date.now();
    nodeCount = 0;

    let bestMove = null;
    let bestScore = (turn === 'w') ? -Infinity : Infinity;

    const moves = generateMoves(board, turn);
    const rootId = -1;

    for (let i = 0; i < moves.length; i++) {
        const move = moves[i];

        const saved = board[move.to];
        board[move.to] = board[move.from];
        board[move.from] = null;

        let score = minimax(depth - 1, -Infinity, Infinity, turn !== 'w', rootId);

        board[move.from] = board[move.to];
        board[move.to] = saved;

        postMessage({
            type: 'thinking',
            move: move,
            score: score,
            depth: depth,
            nodes: nodeCount,
            time: Date.now() - start
        });

        if (turn === 'w') {
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        } else {
            if (score < bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
    }

    return { bestMove, bestScore };
}

self.onmessage = (e) => {
    const { fen, depth } = e.data;
    parseFen(fen);
    const result = searchBestMove(depth || 3);
    postMessage({
        type: 'bestMove',
        move: result.bestMove,
        score: result.bestScore
    });
};
