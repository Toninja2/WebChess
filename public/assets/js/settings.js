const settings = document.getElementsByClassName('settings')[0];

const popups = document.getElementsByClassName('popup');

const fieldsList = Array.from(document.getElementsByClassName('parameterField'));
const fields = Array.from(document.getElementsByClassName('field'));

const openSettings = document.getElementById('openSettings');
const closeSettings = document.getElementById('closeSettings');

const storageSettings = document.getElementsByClassName('storageSetting');

for(let storageSetting of storageSettings) {
    let settingName = storageSetting.dataset.setting;
    if(!settingName) continue;

    let currentValue = localStorage.getItem(settingName);

    if(currentValue) storageSetting.value = currentValue;

    storageSetting.addEventListener('input', e => {
        localStorage.setItem(settingName, storageSetting.value);
    });
}

openSettings.onclick = e => {
    settings.classList.toggle('shown');
}

for(let popup of popups) {
    let close = popup.querySelector(`.closePopup`);

    if(!close) continue;

    close.onclick = e => {
        popup.classList.remove('shown');
    }
}

for(let parameterField of fieldsList) {
    parameterField.onclick = e => {
        let field = fields.find(f => f.dataset.field === parameterField.dataset.field);

        field.classList.add('active');
        parameterField.classList.add('active');

        deactivateOtherElements(fieldsList, parameterField);
        deactivateOtherElements(fields, field);
    }
}

function deactivateOtherElements(elements, current) {
    for(let elem of elements) {
        if(elem === current) continue;

        elem.classList.remove('active');
    }
}
