class Board {
    static generateObject(fen) {
        let output = [];
        let rows = fen.split('/');

        if(rows.length !== 8) return { error: true, message: 'Invalid FEN' };

        for(let row of rows) {
            let splittedRow = row.split('');
            if(splittedRow.length > 8) return { error: true, message: 'Invalid FEN' };

            let outRow = [];

            for(let char in splittedRow) {
                let current = splittedRow[char];
                if(!isNaN(current)) {
                    let num = Number(current);
                    if(num > 8 || num < 0) return { error: true, message: 'Invalid FEN' };
                    for(let x = 0; x < num; x++) outRow.push('');
                } else outRow.push(current);
            }
            output.push(outRow);
        }
        return output;
    }
    static toChessCoords(arrayPos) {
        if(arrayPos[0] < 0 || arrayPos[0] > 8 || arrayPos[1] < 0 || arrayPos[1] > 8) return { error: true, message: 'Invalid array pos' };
        const letters = 'abcdefgh';
        let letter = letters[arrayPos[0]];
        let number = 8 - arrayPos[1];

        return letter + number;
    }
    static toArrayCoords(chessPos) {
        let letters = 'abcdefgh';
        let letter = letters.indexOf(chessPos[0]);
        let number = 8 - chessPos[1];

        return [ letter, number ];
    }
}
