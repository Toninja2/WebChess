const draw = document.getElementById('offerDraw');
const drawPrompt = document.getElementById('drawPrompt');

const accept = drawPrompt.querySelector('.accept');
const decline = drawPrompt.querySelector('.decline');

const bar = drawPrompt.querySelector('#loadingBar');

let animationFrame;

accept.onclick = e => {
    socket.emit('drawAccept');
}
decline.onclick = e => {
    socket.emit('drawDecline');
}

socket.on('drawOffer', started => {
    drawPrompt.style.display = 'flex';
    startBar(started);
});
socket.on('stopOffer', () => {
    drawPrompt.style.display = 'none';
    stopBar();
});

let stopped = false;

function startBar(started) {
    let spent = Date.now() - started;
    let percent = spent * 100 / 30000;

    bar.style.width = `${100 - percent}%`;

    if(percent >= 100) {
        stopBar();
        drawPrompt.style.display = 'none';
    }

    animationFrame = requestAnimationFrame(function() {
        startBar(started);
    });
}
function stopBar() {
    if(animationFrame) cancelAnimationFrame(animationFrame);

    bar.style.width = '';
}
