const gridSize = 5;

let currentPlayer = 'A';

let ws = new WebSocket('ws://localhost:8676');


let selectedPiece = null;
let selectedCell = null;

ws.onopen = function () {
    console.log('WebSocket connection established');
};

ws.onmessage = function (event) {
    const data = JSON.parse(event.data);

    console.log('Received data:', data);

    if (data.type === 'update') {

        renderGrid(data.board);

        updateTurnIndicator(data.next_turn);

        updateHistory(data.history);

    } else if (data.type === 'error') {
        alert(data.message);
    } else if (data.type === 'game_over') {
        alert(`Game over! Winner: ${data.winner}`);

    } else if (data.type === 'new_game') {

        alert("New game started!");
    }
};

ws.onclose = function () {

    console.log('WebSocket connection closed');
};

function renderGrid(board) {

    const gridContainer = document.getElementById("gridContainer");

    gridContainer.innerHTML = "";

    for (let row = 0; row < gridSize; row++) {

        for (let col = 0; col < gridSize; col++) {

            const cell = document.createElement("div");

            cell.className = "gridCell";
            cell.dataset.row = row;

            cell.dataset.col = col;

            const character = board[row][col];


            if (character) {
                cell.textContent = character.type;

                cell.classList.add(character.player);

                cell.onclick = function () {

                    handleCellClick(character, row, col);
                };
            }
            gridContainer.appendChild(cell);

        }
    }
}

function updateHistory(history) {

    const historyContainer = document.getElementById('moveHistory');

    historyContainer.innerHTML = '';

    history.forEach(entry => {
        const historyEntry = document.createElement('div');

        let actionText = `${entry.player} moved ${entry.piece} ${entry.move} from ${entry.from} to ${entry.to}`;

        historyEntry.textContent = actionText;

        historyContainer.appendChild(historyEntry);
    });
}

document.getElementById('newGameButton').addEventListener('click', function () {

    ws.send(JSON.stringify({

        type: 'new_game'
    }));
});

function updateTurnIndicator(player) {

    const turnIndicator = document.getElementById('turnIndicator');

    turnIndicator.textContent = `Current Player: ${player}`;

    currentPlayer = player;
}

function handleCellClick(character, row, col) {

    if (selectedPiece) {

        if (selectedCell) {

            if (character && character.player !== currentPlayer) {

                const moveDirection = getMoveDirection(selectedCell.row, selectedCell.col, row, col);

                console.log(`Sending move: ${selectedPiece}:${moveDirection} from (${selectedCell.row}, ${selectedCell.col}) to (${row}, ${col}) for player: ${currentPlayer}`);
                ws.send(JSON.stringify({

                    type: 'move',
                    player: currentPlayer,
                    move: '${selectedPiece}:${moveDirection}'
                }));

                resetSelection();
            } else if (character && character.player === currentPlayer) {

                if (selectedPiece !== character.type) {

                    selectedPiece = character.type;
                    selectedCell = { row, col };

                    document.getElementById('selectedPieceMessage').textContent = `Selected Piece: ${character.type}`;

                    updateMoveOptions(character.type);
                }
            } else {
                alert("No piece selected for movement.");

            }
        } else {
            alert("No cell selected.");
        }
    } else {
        if (character && character.player === currentPlayer) {
            selectedPiece = character.type;

            selectedCell = { row, col };

            const selectedPieceMessage = document.getElementById('selectedPieceMessage');

            selectedPieceMessage.textContent = `Selected Piece: ${character.type}`;

            updateMoveOptions(character.type);
        } else {
            alert("Please select a piece from your team.");
        }
    }
}


function resetSelection() {

    selectedPiece = null;
    selectedCell = null;

    document.getElementById('selectedPieceMessage').textContent = 'Selected Piece: None';

    updateMoveOptions('');
}

function updateMoveOptions(pieceType) {
    const moveOptionsContainer = document.getElementById('moveOptions');
    moveOptionsContainer.innerHTML = '';

    const moveOptions = {
        'A-H1': ['L', 'R', 'F', 'B'],
        'A-H2': ['FL', 'FR', 'BL', 'BR'],
        'A-P1': ['L', 'R', 'F', 'B'],
        'A-P2': ['L', 'R', 'F', 'B'],
        'A-P3': ['L', 'R', 'F', 'B'],
        'B-H1': ['L', 'R', 'F', 'B'],
        'B-H2': ['FL', 'FR', 'BL', 'BR'],
        'B-P1': ['L', 'R', 'F', 'B'],
        'B-P2': ['L', 'R', 'F', 'B'],
        'B-P3': ['L', 'R', 'F', 'B']
    };

    const moves = moveOptions[pieceType] || [];

    moves.forEach(move => {

        const button = document.createElement('button');

        button.textContent = move;

        button.onclick = function () {

            if (selectedPiece && selectedCell) {

                if (currentPlayer) {
                    console.log(`Sending move: ${selectedPiece}:${move} for player: ${currentPlayer}`);
                    ws.send(JSON.stringify({
                        type: 'move',
                        player: currentPlayer,
                        move: `${selectedPiece}:${move}`
                    }));
                    resetSelection();
                } else {

                    alert("Player not set!");
                }
            } else {
                alert("No piece selected for movement.");
            }
        };
        moveOptionsContainer.appendChild(button);
    });
}

function getMoveDirection(fromRow, fromCol, toRow, toCol) {

    if (fromRow === toRow) {

        return fromCol < toCol ? 'R' : 'L';
    } else if (fromCol === toCol) {
        return fromRow < toRow ? 'F' : 'B';
    } else if (fromRow - toRow === 2 && fromCol - toCol === 1) {

        return 'FL';
    } else if (fromRow - toRow === 2 && toCol - fromCol === 1) {
        return 'FR';

    } else if (toRow - fromRow === 2 && fromCol - toCol === 1) {
        return 'BL';

    } else if (toRow - fromRow === 2 && toCol - fromCol === 1) {
        return 'BR';

    } else {

        return '';
    }
}
