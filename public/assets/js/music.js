const never = document.getElementById('neverMusic');
const winMusic = document.getElementById('winMusic');
const titanic = document.getElementById('loseMusic');

const musics = { 'never': never, 'champions': winMusic, "titanic": titanic, 'peace': document.getElementById('peace') };

function startStopMusic(name) {
    let keys = Object.keys(musics);
    let key = keys.find(k => k === name);

    if(!key) return;

    let audioElement = musics[key];
    let isPlaying = !audioElement.paused;

    stopMusics();

    if(isPlaying) audioElement.pause();
    else audioElement.play();

    audioElement.volume = 0.05;
}

function stopMusics() {
    let values = Object.values(musics);

    for(let element of values) {
        element.currentTime = 0;
        element.pause();
    }
}
