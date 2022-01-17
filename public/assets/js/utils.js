const BITS_VALUES = {
    Q_CASTLE: 1,
    K_CASTLE: 2,

    CAPTURE: 4,
    PROMOTION: 8,
    EP_CAPTURE: 16
}
const REASONS = {
    'c': 'échec et mat',
    's': 'pat',
    't': 'manque de temps',
    'r': 'abandon',
    'a': 'accord mutuel',
    'd': 'déconnexion'
}

function removeClassFromEveryElements(className) {
    let elems = document.getElementsByClassName(className);
    while(elems.length) {
        elems[0].classList.remove(className);
        elems = document.getElementsByClassName(className);
    }
}
function secondsToHourMinutesSeconds(seconds) {
    let outputSeconds = seconds % 60;

    let totalMinutes = (seconds - outputSeconds) / 60;

    let outputMinutes = totalMinutes % 60;

    let outputHours = (totalMinutes - outputMinutes) / 60;

    outputSeconds = String(outputSeconds.toFixed(0));
    outputMinutes = String(outputMinutes.toFixed(0));
    outputHours = String(outputHours.toFixed(0));

    if(outputSeconds.length <= 1) outputSeconds = '0' + outputSeconds;
    if(outputMinutes.length <= 1) outputMinutes = '0' + outputMinutes;
    if(outputHours.length <= 1) outputHours = '0' + outputHours;

    return [outputHours, outputMinutes, outputSeconds];
}
