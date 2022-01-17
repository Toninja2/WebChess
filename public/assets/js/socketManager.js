const socket = io();

let urlParams = new URLSearchParams(window.location.search);

socket.emit('connectToGame', { gameId: id, joinSide: 'w' });

const connectionIndicator = document.getElementById('connectionIndicator');

socket.on('connect', () => {
    connected();
});
socket.on('disconnect', () => {
    disconnected();
});
socket.on('reconnect', () => {
    connected();
    window.open('/', '_self');
});

function connected() {
    connectionIndicator.classList.remove('disconnected');
    connectionIndicator.classList.add('connected');
}
function disconnected() {
    connectionIndicator.classList.remove('connected');
    connectionIndicator.classList.add('disconnected');
}

socket.on('joined', data => {
    usSide = data.side;

    if(usSide === 'v') {
        document.getElementById('offerDraw').disabled = true;
        document.getElementById('resign').disabled = true;
    } else {
        let toReplace = document.getElementsByClassName('replaceColor');

        for(let elem of toReplace) {
            let newSrc = decodeURI(elem.src).replace(/{COLOR}/g, usSide);
            elem.src = newSrc;
        }

        let promotionButtons = document.querySelectorAll('.promotionPrompt button');

        for(let button of promotionButtons) {
            button.onclick = e => {
                let move = promotionMoves[button.dataset.promo];
                if(!move || !isPromotion) return;

                promotionMove(move);
            }
        }
    }

    drawBoard(usSide === 'b');
    createPieces(data.fen.split(' ')[0]);
    console.log(`Joined the game (${data.id}) as: ${data.side}`);
});
socket.on('time', data => {
    initTimers(data);
});
socket.on('turn', data => {
    legalMoves = data;
    showLegalMoves();
});
socket.on('no-turn', () => {
    legalMoves = [];
});

socket.on('move', move => {
    let piece = piecesArray.find(p => p.position === move.from);

    if(move.action & BITS_VALUES.CAPTURE || move.action & BITS_VALUES.EP_CAPTURE) {
        let eatenPiece;

        if(move.action & BITS_VALUES.EP_CAPTURE) {
            let letter = move.to[0];
            let number = move.to[1];

            if(piece.color === 'white') number = String(Number(number) - 1);
            if(piece.color === 'black') number = String(Number(number) + 1);

            eatenPiece = piecesArray.find(p => p.position === letter + number);
        }
        else eatenPiece = piecesArray.find(p => p.position === move.to);

        eatenPiece.dead = true;
        
        eatenPiece.elem.style.opacity = '0';
        eatenPiece.elem.style.zIndex = '0';
        eatenPiece.elem.style.cursor = 'default';

        piecesArray.splice(piecesArray.indexOf(eatenPiece), 1);
    }
    if(move.action & BITS_VALUES.Q_CASTLE || move.action & BITS_VALUES.K_CASTLE) {
        let rook;
        if(move.action & BITS_VALUES.Q_CASTLE) {
            rook = piecesArray.find(p => p.position === 'a' + piece.position[1]);

            rook.position = 'd' + piece.position[1];
        }
        if(move.action & BITS_VALUES.K_CASTLE) {
            rook = piecesArray.find(p => p.position === 'h' + piece.position[1]);

            rook.position = 'f' + piece.position[1];
        }
        let arrayPos = Board.toArrayCoords(rook.position);

        rook.elem.style.left = getLeft(arrayPos);
        rook.elem.style.top = getTop(arrayPos);

        rook.elem.dataset.letter = rook.position[0];
        rook.elem.dataset.number = rook.position[1];
        rook.elem.dataset.notation = rook.position;
    }
    if(move.action & BITS_VALUES.PROMOTION) {
        piecesArray.splice(piecesArray.indexOf(piece), 1);

        piece.dead = true;
        piece.elem.style.opacity = '0';
        piece.elem.style.zIndex = '0';

        let params = [ piece.position, piece.color ];
        switch(move.promotion) {
            case 'q':
                piece = new Queen(...params);
                break;
            case 'r':
                piece = new Rook(...params);
                break;
            case 'b':
                piece = new Bishop(...params);
                break;
            case 'n':
                piece = new Knight(...params);
                break;
        }
        piece.replaceBackground(mode);

        initPiece(piece, false);
    }

    let arrayPos = Board.toArrayCoords(move.to);

    piece.elem.style.left = getLeft(arrayPos);
    piece.elem.style.top = getTop(arrayPos);

    piece.position = move.to;

    piece.elem.dataset.letter = piece.position[0];
    piece.elem.dataset.number = piece.position[1];
    piece.elem.dataset.notation = piece.position;

    let currentMoveSquares = Array.from(document.getElementsByClassName('move'));

    if(currentMoveSquares) for(let square of currentMoveSquares) square.classList.remove('move');

    let newFrom = document.getElementById(move.from);
    let newTo = document.getElementById(piece.position);

    newFrom.classList.add('move');
    newTo.classList.add('move');

    //createPieces(data.newFEN, false);
});
socket.on('fen', fen => {
    latestFEN = fen;
});
socket.on('undo', data => {
    createPieces(data.FEN, false);
});
socket.on('reset', data => {
    createPieces(data.FEN, true);
});

const score = document.getElementsByClassName('score')[0];

const victory = document.getElementById('victory');
const cause = document.getElementById('endReason');

socket.on('ended', data => {
    stopTimers();

    let reason = REASONS[data.reason];
    let text;

    if(data.winner === 'none') {
        text = 'Partie nulle !';
        startStopMusic('peace');
    }
    else if(data.winner === usSide) {
        text = 'Victoire !';
        startStopMusic('champions');
    }
    else {
        text = 'Défaite ! Retente ta chance une prochaine fois !';
        startStopMusic('titanic');
    }

    if(data.winner !== 'none' && usSide === 'v') text = `Victoire des ${data.winner === 'w' ? 'blancs' : 'noirs'} !`;

    victory.innerText = text;
    cause.innerText = `Par ${reason}`;

    score.classList.add('shown');

    legalMoves = [];

    console.log(`The winner is: ${data.winner} !`);
});
