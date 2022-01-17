let historyBox = document.getElementById('history');

let history = [];

socket.emit('getHistory');

socket.on('history', data => {
    for(let move of data) {
        history.push(move);
    }

    updateVisual();
});
socket.on('undoHistory', () => {
    history.pop();

    reset();
    updateVisual();
});

function reset() {
    let histoMoves = document.getElementsByClassName('histoMove');

    for(let histoMove of histoMoves) histoMove.parentNode.removeChild(histoMove);
}
function updateVisual() {
    for(let move of history.filter(m => m.move)) {
        let desiredId = `${move.fullMoves}move`;
        let parent = document.getElementById(desiredId);

        if(!parent) {
            parent = document.createElement('div');
            parent.classList.add('histoMove');
            parent.id = desiredId;

            let span = document.createElement('span');
            span.innerText = `${move.fullMoves}.`;

            let whiteMove = document.createElement('div');
            let blackMove = document.createElement('div');

            whiteMove.classList.add('whiteMove');
            blackMove.classList.add('blackMove');

            parent.appendChild(span);
            parent.appendChild(whiteMove);
            parent.appendChild(blackMove);

            historyBox.appendChild(parent);

            historyBox.scrollTo(0, historyBox.scrollHeight);
        }

        let moveDiv;

        if(move.activeSide === 'w') moveDiv = parent.querySelector('.whiteMove');
        else moveDiv = parent.querySelector('.blackMove');

        moveDiv.innerText = `${move.move.from}-${move.move.to}`;
    }
}
