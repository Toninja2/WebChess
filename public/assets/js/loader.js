const links = document.getElementsByClassName('roomLink');
const copyLink = document.getElementById('copyLink');

const resign = document.getElementById('resign');
const offerDraw = document.getElementById('offerDraw');

resign.onclick = e => {
    socket.emit('resign');
}
offerDraw.onclick = e => {
    socket.emit('offerDraw');
}

// Game id
document.getElementById('gameId').innerText = id;

// Game url
let url = window.location.origin + window.location.pathname;

for(let link of links) link.value = url;

copyLink.onclick = e => {
    navigator.clipboard.writeText(url);

    let before = copyLink.innerText;

    copyLink.innerText = 'Copié !';

    setTimeout(function() {
        copyLink.innerText = before;
    }, 5000);
}
