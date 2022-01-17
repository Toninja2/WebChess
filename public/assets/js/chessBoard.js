const columnEquivalent = 'abcdefgh';
let lastColoredSquare;
let mousePos = [];

window.addEventListener('resize', resizeBoard);

resizeBoard();

function resizeBoard() {
    applyBoardSize(0);

    let cBox = containerOfBoardContainer.getBoundingClientRect();

    let margin = 5;

    let width = containerOfBoardContainer.clientWidth;
    let height = containerOfBoardContainer.clientHeight;

    legalPlace = (height < width ? height : width) - margin * 2;

    let belowSize = Math.floor(legalPlace / 8) * 8;

    applyBoardSize(belowSize);

    piecesBox = pieces.getBoundingClientRect();
}

function applyBoardSize(size) {
    boardContainer.style.width = size + 'px';
    boardContainer.style.height = size + 'px';

    boardContainer.style.maxWidth = size + 'px';
    boardContainer.style.maxHeight = size + 'px';

    boardContainer.style.minWidth = size + 'px';
    boardContainer.style.minHeight = size + 'px';
}

window.onmouseup = window.ontouchend = e => {
    dragging = false;
    draggingPiece = null;

    removeClassFromEveryElements('legal');
    removeClassFromEveryElements('canEat');

    if(lastColoredSquare) lastColoredSquare.classList.remove('colored');

    for(let elem of document.getElementsByClassName('dragging')) {
        elem.classList.remove('dragging');
        let arrayPos = Board.toArrayCoords(elem.dataset.notation);

        let move;
        if(legalMoves && legalMoves.length) move = legalMoves.find(m => m.from === elem.dataset.notation && m.to === mousePos);

        if(mousePos && move) {
            let arrayCoords = Board.toArrayCoords(mousePos);
            elem.style.left = getLeft(arrayCoords);
            elem.style.top = getTop(arrayCoords);

            if(move.action & BITS_VALUES.PROMOTION) return askPromotion(move);

            return socket.emit('move', move);
        }

        elem.style.left = getLeft(arrayPos);
        elem.style.top = getTop(arrayPos);
    }
}
function askPromotion(move) {
    promotionPrompt.classList.add('shown');
    isPromotion = true;

    return initPromotionButtons(move);
}
function initPromotionButtons(move) {
    let toCheck = ['q', 'r', 'n', 'b'];

    for(let letter of toCheck) {
        let pMove = legalMoves.find(m => m.from === move.from && m.to === move.to && m.promotion === letter);

        promotionMoves[letter] = pMove;
    }
}
function promotionMove(move) {
    if(!isPromotion) return;
    isPromotion = false;

    promotionPrompt.classList.remove('shown');

    return socket.emit('move', move);
}

window.onmousemove = window.ontouchmove = e => {
    if(!dragging) return;

    updateDraggingPos(e);
}

function updateDraggingPos(e) {
    let x = e.clientX;
    let y = e.clientY;

    if(e.touches && e.touches[0]) {
        x = e.touches[0].clientX,
        y = e.touches[0].clientY
    }

    let insideBoardX = x - piecesBox.x;
    let insideBoardY = y - piecesBox.y;

    if(insideBoardX <= 0 || insideBoardY <= 0 || insideBoardX >= piecesBox.width || insideBoardY >= piecesBox.height) return;

    let widthFraction = Math.floor(insideBoardX * 8 / piecesBox.width);
    let heightFraction = Math.floor(insideBoardY * 8 / piecesBox.height);

    let squareLetter = columnEquivalent[isRotated ? 7 - widthFraction : widthFraction];
    let squareNumber = isRotated ? heightFraction + 1 : 8 - heightFraction;

    mousePos = squareLetter + squareNumber;

    if(lastColoredSquare) lastColoredSquare.classList.remove('colored');
    let square = document.getElementById(mousePos);
    square.classList.add('colored');
    lastColoredSquare = square;

    draggingPiece.elem.style.left = String(insideBoardX - draggingPiece.elem.offsetWidth / 2) + 'px';
    draggingPiece.elem.style.top = String(insideBoardY - draggingPiece.elem.offsetHeight / 2) + 'px';
}

function drawBoard(rotated, anim = true) {
    let inside = document.querySelectorAll('.boardDesign div');
    for(let div of inside) div.parentNode.removeChild(div);

    isRotated = rotated;
    for(let row = 0; row < 8; row++) {
        for(let column = 0; column < 8; column++) {
            let square = document.createElement('div');
            square.classList.add('square');

            let letter = columnEquivalent[isRotated ? 7 - column : column];
            let number = isRotated ? row + 1 : 8 - row;

            let color = (row + column) % 2;

            if(color) square.classList.add('black_square');
            else square.classList.add('white_square');

            if(anim) square.classList.add('pop');

            square.dataset.letter = letter;
            square.dataset.number = number;

            square.dataset.notation = letter + number;
            square.id = letter + number;

            let showLetter = (!isRotated && number === 1) || (isRotated && number === 8);
            let showNumber = (!isRotated && letter === 'a') || (isRotated && letter === 'h');

            if(showLetter) {
                let letterP = document.createElement('p');
                letterP.classList.add('letterHelper');

                letterP.innerText = letter;

                square.appendChild(letterP);
            }
            if(showNumber) {
                let numberP = document.createElement('p');
                numberP.classList.add('numberHelper');

                numberP.innerText = number;

                square.appendChild(numberP);
            }

            let canGo = document.createElement('div');

            //pieces.appendChild(pieceSquare);
            square.appendChild(canGo);
            board.appendChild(square);
        }
    }
}

function rotateBoard() {
    drawBoard(!isRotated, false);
    createPieces(latestFEN, false);
}

function showLegalMoves() {
    if(!draggingPiece) return;
    if(!legalMoves || !legalMoves.length) return;
    let moves = legalMoves.filter(move => move.from === draggingPiece.position);
    for(let move of moves) {
        let square = document.getElementById(move.to);
        if(move.action & BITS_VALUES.CAPTURE || move.action & BITS_VALUES.EP_CAPTURE) {
            square.classList.add('canEat');
            continue;
        }
        square.classList.add('legal');
    }
}

function changePiecesMode(m) {
    mode = m;
    for(let piece of piecesArray) piece.replaceBackground(m);
}

function getColor(letter) {
    return (letter.toUpperCase() === letter ? 'white' : 'black');
}
function getLeft(arrayPos) {
    return `calc(${((isRotated ? 7 : 2 * arrayPos[0]) - arrayPos[0]) * 100}% / 8)`;
}
function getTop(arrayPos, black = false) {
    return `calc(${((isRotated ? 7 : 2 * arrayPos[1]) - arrayPos[1]) * 100}% / 8)`;
}
