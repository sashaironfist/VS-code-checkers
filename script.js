// Checkers Game
const BOARD_SIZE = 8;
const RED = 'red';
const BLACK = 'black';

let board = [];
let selectedPiece = null;
let validMoves = [];
let currentPlayer = RED;
let redCaptured = 0;
let blackCaptured = 0;
let playerColor = RED;
let aiDifficulty = 'medium';
let isAIThinking = false;

class Piece {
    constructor(color, row, col) {
        this.color = color;
        this.row = row;
        this.col = col;
        this.isKing = false;
    }
}

function initializeBoard() {
    board = Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null));
    
    // Place red pieces (top)
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = new Piece(RED, row, col);
            }
        }
    }
    
    // Place black pieces (bottom)
    for (let row = BOARD_SIZE - 3; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if ((row + col) % 2 === 1) {
                board[row][col] = new Piece(BLACK, row, col);
            }
        }
    }
    
    currentPlayer = RED;
    redCaptured = 0;
    blackCaptured = 0;
    selectedPiece = null;
    validMoves = [];
}

function renderBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    // Flip board if player chose black
    const rows = playerColor === BLACK ? Array.from({length: 8}, (_, i) => 7 - i) : Array.from({length: 8}, (_, i) => i);
    const cols = playerColor === BLACK ? Array.from({length: 8}, (_, i) => 7 - i) : Array.from({length: 8}, (_, i) => i);
    
    for (let rowIdx = 0; rowIdx < BOARD_SIZE; rowIdx++) {
        for (let colIdx = 0; colIdx < BOARD_SIZE; colIdx++) {
            const row = rows[rowIdx];
            const col = cols[colIdx];
            const square = document.createElement('div');
            square.className = 'square';
            square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
            square.dataset.row = row;
            square.dataset.col = col;
            
            // Add valid move indicators
            if (validMoves.some(move => move.row === row && move.col === col && !move.isCapture)) {
                square.classList.add('valid-move');
            }
            if (validMoves.some(move => move.row === row && move.col === col && move.isCapture)) {
                square.classList.add('valid-capture');
            }
            
            // Add piece if exists
            if (board[row][col]) {
                const piece = board[row][col];
                const pieceElement = document.createElement('div');
                pieceElement.className = `piece ${piece.color}`;
                if (piece.isKing) {
                    pieceElement.classList.add('king');
                    pieceElement.textContent = '♛';
                }
                
                if (selectedPiece && selectedPiece.row === row && selectedPiece.col === col) {
                    pieceElement.classList.add('selected');
                }
                
                square.appendChild(pieceElement);
            }
            
            square.addEventListener('click', () => handleSquareClick(row, col));
            boardElement.appendChild(square);
        }
    }
    
    updateUI();
}

function getValidMoves(piece) {
    const moves = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    
    if (piece.isKing) {
        // Kings can move any distance diagonally
        for (let [dRow, dCol] of directions) {
            // Regular moves (no captures)
            for (let distance = 1; distance < BOARD_SIZE; distance++) {
                const newRow = piece.row + dRow * distance;
                const newCol = piece.col + dCol * distance;
                
                if (!isValidPosition(newRow, newCol)) break;
                if (board[newRow][newCol]) break;
                
                moves.push({ row: newRow, col: newCol, isCapture: false });
            }
            
            // Capture moves
            for (let distance = 1; distance < BOARD_SIZE; distance++) {
                const captureRow = piece.row + dRow * distance;
                const captureCol = piece.col + dCol * distance;
                
                if (!isValidPosition(captureRow, captureCol)) break;
                
                if (board[captureRow][captureCol]) {
                    const targetPiece = board[captureRow][captureCol];
                    if (targetPiece.color !== piece.color) {
                        const newRow = captureRow + dRow;
                        const newCol = captureCol + dCol;
                        
                        if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
                            moves.push({
                                row: newRow,
                                col: newCol,
                                isCapture: true,
                                captureRow: captureRow,
                                captureCol: captureCol
                            });
                        }
                    }
                    break;
                }
            }
        }
    } else {
        // Regular pieces
        const pieceDirctions = piece.color === RED 
            ? [[1, -1], [1, 1]]
            : [[-1, -1], [-1, 1]];
        
        // Regular moves
        for (let [dRow, dCol] of pieceDirctions) {
            const newRow = piece.row + dRow;
            const newCol = piece.col + dCol;
            
            if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
                moves.push({ row: newRow, col: newCol, isCapture: false });
            }
        }
        
        // Capture moves
        for (let [dRow, dCol] of pieceDirctions) {
            const captureRow = piece.row + dRow;
            const captureCol = piece.col + dCol;
            const newRow = piece.row + dRow * 2;
            const newCol = piece.col + dCol * 2;
            
            if (isValidPosition(newRow, newCol) && !board[newRow][newCol]) {
                if (isValidPosition(captureRow, captureCol) && board[captureRow][captureCol]) {
                    const targetPiece = board[captureRow][captureCol];
                    if (targetPiece.color !== piece.color) {
                        moves.push({
                            row: newRow,
                            col: newCol,
                            isCapture: true,
                            captureRow: captureRow,
                            captureCol: captureCol
                        });
                    }
                }
            }
        }
    }
    
    return moves;
}

function isValidPosition(row, col) {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function handleSquareClick(row, col) {
    const clickedPiece = board[row][col];
    
    // If clicking a valid move
    const validMove = validMoves.find(move => move.row === row && move.col === col);
    if (validMove && selectedPiece) {
        movePiece(selectedPiece, validMove);
        return;
    }
    
    // If clicking a piece of current player
    if (clickedPiece && clickedPiece.color === currentPlayer) {
        selectedPiece = clickedPiece;
        validMoves = getValidMoves(clickedPiece);
    } else {
        selectedPiece = null;
        validMoves = [];
    }
    
    renderBoard();
}

function movePiece(piece, move) {
    // Clear old position
    board[piece.row][piece.col] = null;
    
    // Handle capture
    if (move.isCapture) {
        board[move.captureRow][move.captureCol] = null;
        if (currentPlayer === RED) {
            blackCaptured++;
        } else {
            redCaptured++;
        }
    }
    
    // Move piece
    piece.row = move.row;
    piece.col = move.col;
    board[move.row][move.col] = piece;
    
    // Check for king promotion
    if ((piece.color === RED && piece.row === BOARD_SIZE - 1) ||
        (piece.color === BLACK && piece.row === 0)) {
        piece.isKing = true;
    }
    
    // Check win condition
    if (redCaptured >= 12) {
        alert('Red wins! All black pieces captured!');
        resetGame();
    } else if (blackCaptured >= 12) {
        alert('Black wins! All red pieces captured!');
        resetGame();
    } else {
        // Switch player
        currentPlayer = currentPlayer === RED ? BLACK : RED;
        
        // If AI's turn, make AI move
        if ((currentPlayer === RED && playerColor === BLACK) ||
            (currentPlayer === BLACK && playerColor === RED)) {
            makeAIMove();
        }
    }
    
    selectedPiece = null;
    validMoves = [];
    renderBoard();
}

function updateUI() {
    document.getElementById('currentTurn').textContent = 
        currentPlayer === RED ? 'Red (Human)' : 'Black (Human)';
    document.getElementById('redCaptured').textContent = redCaptured;
    document.getElementById('blackCaptured').textContent = blackCaptured;
}

function getAllPieces(color) {
    const pieces = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col] && board[row][col].color === color) {
                pieces.push(board[row][col]);
            }
        }
    }
    return pieces;
}

function evaluateBoard() {
    // Simple board evaluation for AI
    let score = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            if (board[row][col]) {
                const piece = board[row][col];
                let value = piece.isKing ? 5 : 1;
                
                // Add position bonus (pieces closer to promotion are more valuable)
                if (piece.color === BLACK) {
                    value += row * 0.1;
                } else {
                    value += (BOARD_SIZE - 1 - row) * 0.1;
                }
                
                score += piece.color === BLACK ? value : -value;
            }
        }
    }
    
    return score;
}

function makeAIMove() {
    if (isAIThinking) return;
    isAIThinking = true;
    
    setTimeout(() => {
        const aiPieces = getAllPieces(currentPlayer);
        let bestMove = null;
        let bestScore = -Infinity;
        
        if (aiDifficulty === 'easy') {
            // Easy: Random valid move
            let allMoves = [];
            for (let piece of aiPieces) {
                const moves = getValidMoves(piece);
                for (let move of moves) {
                    allMoves.push({ piece, move });
                }
            }
            if (allMoves.length > 0) {
                const randomIndex = Math.floor(Math.random() * allMoves.length);
                bestMove = allMoves[randomIndex];
            }
        } else if (aiDifficulty === 'medium') {
            // Medium: Prioritize captures, then moves toward promotion
            for (let piece of aiPieces) {
                const moves = getValidMoves(piece);
                for (let move of moves) {
                    let score = 0;
                    
                    if (move.isCapture) {
                        score += 100;
                    }
                    
                    if ((piece.color === BLACK && move.row > piece.row) ||
                        (piece.color === RED && move.row < piece.row)) {
                        score += 10;
                    }
                    
                    score += Math.random();
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { piece, move };
                    }
                }
            }
        } else if (aiDifficulty === 'hard') {
            // Hard: Minimax with 3-move lookahead
            bestMove = minimaxMove(3);
        } else if (aiDifficulty === 'impossible') {
            // Impossible: Minimax with 5-move lookahead
            bestMove = minimaxMove(5);
        }
        
        if (bestMove) {
            movePiece(bestMove.piece, bestMove.move);
        }
        
        isAIThinking = false;
    }, 500);
}

function minimaxMove(depth) {
    let bestMove = null;
    let bestScore = -Infinity;
    const aiColor = currentPlayer;
    
    const aiPieces = getAllPieces(aiColor);
    
    for (let piece of aiPieces) {
        const moves = getValidMoves(piece);
        for (let move of moves) {
            // Simulate move
            const oldPiece = board[move.row][move.col];
            const capturedPiece = move.isCapture ? board[move.captureRow][move.captureCol] : null;
            const wasKing = piece.isKing;
            
            board[piece.row][piece.col] = null;
            board[move.row][move.col] = piece;
            piece.row = move.row;
            piece.col = move.col;
            
            if (move.isCapture) {
                board[move.captureRow][move.captureCol] = null;
            }
            
            if ((piece.color === RED && piece.row === BOARD_SIZE - 1) ||
                (piece.color === BLACK && piece.row === 0)) {
                piece.isKing = true;
            }
            
            // Evaluate
            const switchedPlayer = currentPlayer === RED ? BLACK : RED;
            const score = -minimax(depth - 1, aiColor, switchedPlayer);
            
            // Undo move
            board[piece.row][piece.col] = null;
            piece.row -= move.isCapture ? move.row - piece.row : move.row - piece.row;
            piece.col -= move.isCapture ? move.col - piece.col : move.col - piece.col;
            board[piece.row][piece.col] = piece;
            piece.isKing = wasKing;
            
            if (move.isCapture) {
                board[move.captureRow][move.captureCol] = capturedPiece;
            }
            
            if (score > bestScore) {
                bestScore = score;
                bestMove = { piece, move };
            }
        }
    }
    
    return bestMove;
}

function minimax(depth, aiColor, currentColor) {
    if (depth === 0) {
        return evaluateBoard();
    }
    
    const pieces = getAllPieces(currentColor);
    let bestScore = currentColor === aiColor ? -Infinity : Infinity;
    
    for (let piece of pieces) {
        const moves = getValidMoves(piece);
        if (moves.length === 0) continue;
        
        for (let move of moves) {
            const wasKing = piece.isKing;
            const oldPiece = board[move.row][move.col];
            const capturedPiece = move.isCapture ? board[move.captureRow][move.captureCol] : null;
            
            board[piece.row][piece.col] = null;
            board[move.row][move.col] = piece;
            piece.row = move.row;
            piece.col = move.col;
            
            if (move.isCapture) {
                board[move.captureRow][move.captureCol] = null;
            }
            
            if ((piece.color === RED && piece.row === BOARD_SIZE - 1) ||
                (piece.color === BLACK && piece.row === 0)) {
                piece.isKing = true;
            }
            
            const nextColor = currentColor === RED ? BLACK : RED;
            const score = minimax(depth - 1, aiColor, nextColor);
            
            board[piece.row][piece.col] = null;
            piece.row -= move.row - piece.row;
            piece.col -= move.col - piece.col;
            board[piece.row][piece.col] = piece;
            piece.isKing = wasKing;
            
            if (move.isCapture) {
                board[move.captureRow][move.captureCol] = capturedPiece;
            }
            
            if (currentColor === aiColor) {
                bestScore = Math.max(bestScore, score);
            } else {
                bestScore = Math.min(bestScore, score);
            }
        }
    }
    
    return bestScore === Infinity || bestScore === -Infinity ? evaluateBoard() : bestScore;
}

function resetGame() {
    showColorModal();
    initializeBoard();
}

function showColorModal() {
    document.getElementById('colorModal').classList.remove('hidden');
}

function hideColorModal() {
    document.getElementById('colorModal').classList.add('hidden');
}

function showDifficultyModal() {
    document.getElementById('difficultyModal').classList.remove('hidden');
}

function hideDifficultyModal() {
    document.getElementById('difficultyModal').classList.add('hidden');
}

document.getElementById('redBtn').addEventListener('click', () => {
    playerColor = RED;
    hideColorModal();
    showDifficultyModal();
});

document.getElementById('blackBtn').addEventListener('click', () => {
    playerColor = BLACK;
    hideColorModal();
    showDifficultyModal();
});

document.getElementById('easyBtn').addEventListener('click', () => {
    aiDifficulty = 'easy';
    hideDifficultyModal();
    const boardElement = document.getElementById('board');
    if (playerColor === RED) {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
    renderBoard();
});

document.getElementById('mediumBtn').addEventListener('click', () => {
    aiDifficulty = 'medium';
    hideDifficultyModal();
    const boardElement = document.getElementById('board');
    if (playerColor === RED) {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
    renderBoard();
});

document.getElementById('hardBtn').addEventListener('click', () => {
    aiDifficulty = 'hard';
    hideDifficultyModal();
    const boardElement = document.getElementById('board');
    if (playerColor === RED) {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
    renderBoard();
});

document.getElementById('impossibleBtn').addEventListener('click', () => {
    aiDifficulty = 'impossible';
    hideDifficultyModal();
    const boardElement = document.getElementById('board');
    if (playerColor === RED) {
        boardElement.classList.add('flipped');
    } else {
        boardElement.classList.remove('flipped');
    }
    renderBoard();
});

document.getElementById('resetBtn').addEventListener('click', () => {
    resetGame();
});

document.addEventListener('DOMContentLoaded', () => {
    initializeBoard();
    showColorModal();
});
