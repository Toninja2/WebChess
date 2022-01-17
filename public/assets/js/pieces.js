const ASSETS_DIR = './../assets/'

class Piece {
    constructor(position, whiteImage, blackImage, color) {
        this.position = position;
        this.color = color;
        this.image = this.color === 'white' ? whiteImage : blackImage;
    }
    replaceBackground(mode) {
        if(!this.elem) return;
        if(mode === undefined) return;

        this.elem.style.backgroundImage = 'url(' + this.image.replace('{MODE}', mode + '_') + ')';
    }
}
class Pawn extends Piece {
    constructor(position, color) {
        super(position, ASSETS_DIR + 'images/{MODE}wp.png', ASSETS_DIR + 'images/{MODE}bp.png', color);
    }
}
class Rook extends Piece {
    constructor(position, color) {
        super(position, ASSETS_DIR + 'images/{MODE}wr.png', ASSETS_DIR + 'images/{MODE}br.png', color);
    }
}
class Bishop extends Piece {
    constructor(position, color) {
        super(position, ASSETS_DIR + 'images/{MODE}wb.png', ASSETS_DIR + 'images/{MODE}bb.png', color);
    }
}
class Knight extends Piece {
    constructor(position, color) {
        super(position, ASSETS_DIR + 'images/{MODE}wn.png', ASSETS_DIR + 'images/{MODE}bn.png', color);
    }
}
class Queen extends Piece {
    constructor(position, color) {
        super(position, ASSETS_DIR + 'images/{MODE}wq.png', ASSETS_DIR + 'images/{MODE}bq.png', color);
    }
}
class King extends Piece {
    constructor(position, color) {
        super(position, ASSETS_DIR + 'images/{MODE}wk.png', ASSETS_DIR + 'images/{MODE}bk.png', color);
    }
}

function getPieceFromLetter(letter, coordinates) {
    let piece;
    switch(letter.toLowerCase()) {
        case 'p':
            piece = new Pawn(coordinates, getColor(letter));
            break;
        case 'r':
            piece = new Rook(coordinates, getColor(letter));
            break;
        case 'n':
            piece = new Knight(coordinates, getColor(letter));
            break;
        case 'b':
            piece = new Bishop(coordinates, getColor(letter));
            break;
        case 'q':
            piece = new Queen(coordinates, getColor(letter));
            break;
        case 'k':
            piece = new King(coordinates, getColor(letter));
            break;
        default:
            break;
    }

    return piece;
}
function initPiece(piece, anim = true) {
    let elem = document.createElement('div');
    elem.classList.add('square');
    if(anim) elem.classList.add('pop');
    elem.classList.add('piece');
    elem.style.backgroundImage = `url(${piece.image.replace('{MODE}', mode + '_')})`;

    elem.dataset.letter = piece.position[0];
    elem.dataset.number = piece.position[1];

    elem.dataset.notation = piece.position[0] + piece.position[1];

    elem.onmousedown = elem.ontouchstart = e => {
        if(e.button) return;

        if(piece.dead) return;

        dragging = true;
        draggingPiece = piece;
        piecesBox = pieces.getBoundingClientRect();
        draggingPiece.elem.classList.add('dragging');

        showLegalMoves();

        updateDraggingPos(e);
    }

    piece.elem = elem;

    piecesArray.push(piece);

    let coords = Board.toArrayCoords(piece.position);

    //elem.style.transform = `translate(${coords[0] * 100}%, ${coords[1] * 100}%)`;
    elem.style.left = getLeft(coords, isRotated);
    elem.style.top = getTop(coords, isRotated);

    pieces.appendChild(elem);
}

function createPieces(fen, anim = true) {
    let inside = document.querySelectorAll('.pieces div');
    for(let div of inside) div.parentNode.removeChild(div);

    latestFEN = fen;
    piecesArray = [];

    let startObject = Board.generateObject(fen);

    for(let row in startObject) {
        for(let column in startObject[row]) {
            let current = startObject[row][column];
            if(!current) continue;

            let coordinates = Board.toChessCoords([ column, row ]);

            let piece = getPieceFromLetter(current, coordinates);

            initPiece(piece, anim);
        }
    }
}
