function save_options(e) {
    if (typeof e !== "undefined") {
        e.preventDefault();
    }
    let settings = Array.from(document.getElementsByClassName('setting'));
    let object_to_save = [];
    settings.forEach((item) => {
        let field = {};
        field.id = item.id;
        if (item.type === 'checkbox') {
            field.checked = item.checked;
        } else {
            field.value = item.value;
        }
        object_to_save.push(field);
    });
    browser.storage.local.set({settings: object_to_save});
}

function set_defaults() {
    function create_option(item, parentNode) {
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        const id = encodeURIComponent(item.to);
        checkbox.id = id;
        checkbox.value = id;
        checkbox.checked = 'enabled' in item ? item.enabled : true;
        checkbox.classList.add('setting');
        const desc = document.createTextNode(' ' + item.desc);
        label.appendChild(checkbox);
        label.appendChild(desc);
        parentNode.appendChild(label);
        return label;
    }

    function create_checkbox_set(ruleSet, transformBlockName)
    {
        const transform_block = document.getElementById(transformBlockName);
        ruleSet.forEach((item) => {
            create_option(item, transform_block);
        });
    }

    create_checkbox_set(OVERVIEW_TRANSFORMS, 'overview');
    create_checkbox_set(BUILDLOG_TRANSFORMS, 'buildlog');

    document.getElementById('phpstorm').value = IDE_PORTS.phpstorm;
    document.getElementById('rubymine').value = IDE_PORTS.rubymine;

    create_option({to: 'sparkline', desc: "Show sparkline of tests' success rate", enabled: TEST_SUCCESS_RATE},
        document.getElementById('moreFeatures'));
    // console.log('set_defaults - done');
}

function reset_options() {
    if (confirm('Are you sure you want to reset settings?') !== true) {
        return false;
    }
    set_defaults();
    save_options();
}

function restore_options() {
    console.log(`restore_options`);
    function setCurrentChoice(result) {
        result.settings.forEach((item) => {
            let option = document.getElementById(item.id);
            option.checked = item.checked;
            option.value = item.value;
        });
        return settings;
    }

    function onError(error) {
        console.log(`Error: ${error}`);
    }

    let getting = browser.storage.local.get(null);
    getting.then(setCurrentChoice, onError);
}

function main() {
    set_defaults();
    restore_options();
    let settings = Array.from(document.getElementsByClassName('setting'));
    settings.forEach((item) => {
        item.addEventListener('change', save_options);
    });
}

document.addEventListener("DOMContentLoaded", main);
document.querySelector("form").addEventListener("submit", reset_options);