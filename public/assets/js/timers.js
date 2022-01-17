class Timer {
    constructor(startTime) {
        this.value = startTime;
        this.animation;

        this.callback = () => {};
    }
    start(startTimestamp) {
        let now = Date.now();
        let spentTime = Math.floor((now - startTimestamp) / 1000);

        this.callback(this.value - spentTime);

        this.animation = requestAnimationFrame((function() {
            return this.start(startTimestamp);
        }).bind(this));
    }
    stop() {
        if(this.animation) cancelAnimationFrame(this.animation);
    }
    set newValue(value) {
        this.value = value;
    }
}

let blackTimer,
    whiteTimer;

let whiteObj = new Timer(),
    blackObj = new Timer();

whiteObj.callback = value => {
    whiteTimer.innerText = secondsToHourMinutesSeconds(value).join(':').split('.')[0];
}
blackObj.callback = value => {
    blackTimer.innerText = secondsToHourMinutesSeconds(value).join(':').split('.')[0];
}

function findTimers() {
    blackTimer = document.querySelector('.blackSide .timer');
    whiteTimer = document.querySelector('.whiteSide .timer');
}
function stopTimer(side) {
    if(side === 'w') {
        whiteObj.stop();
        return;
    }
    blackObj.stop();
}
function stopTimers() {
    stopTimer('w');
    stopTimer();
}

function initTimers(time) {
    let timer;

    if(time.mode === 'stop') {
        stopTimer(time.side);
    }
    if(time.side === 'w') {
        whiteObj.newValue = time.time
        timer = whiteTimer;
    }
    else {
        blackObj.newValue = time.time;
        timer = blackTimer;
    }

    timer.innerText = secondsToHourMinutesSeconds(time.time).join(':').split('.')[0];

    let side = time.side;

    if(time.mode === 'start') {
        let now = time.start;

        if(side === 'w') whiteObj.start(now);
        else blackObj.start(now);
    }
}

findTimers();
