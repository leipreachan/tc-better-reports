/// TODO: to check if still valid and fix incorrect nesting ??
// Element >>http://web:web@gridrouter.d3:44441/wd/hub/session/b0721b41341782bfcff2507e2e5894a6d1e09d9e-ac15-41ea-905e-d9bba244fd20/element/44<< is not clickable at point (631.5, 584.0333251953125). Other element would receive the click: <div id="disable_ovl"></div>
// TODO: opening a preview should not call mutator
// TODO: get rid of double filtering (firstly filter TRANSFORM_RULES by address, if get default filters)
// TODO: there should be only one default TRANSFORM_RULE as all the others will be ignored
// TODO: add options for preloading (maybe?)

const
    STACKTRACE_CLASS = 'fullStacktrace';

const
    INTELLIJ_HOST = 'localhost',
    INTELLIJ_API = 'api/file/';

let
    overview_map = {},
    buildlog_map = {};

const
    SPARKLINE_POINTS = 200;

const DEFAULT_MAX_HEIGHT = '80vh';

const TRANSFORM_RULES = [
    {
        // address_pattern: 'tab=buildResultsDiv',
        id: 'buildResults',
        transformer_class: STACKTRACE_CLASS,
        rule_set: OVERVIEW_TRANSFORMS,
        customizer: () => {
            const previews = document.querySelectorAll(`.${STACKTRACE_CLASS} a:not(.${PREVIEW_CLASS})`);
            // console.debug('better.js', `${previews.length} elements to be transformed`);
            Array.from(previews).forEach((item) => {
                if (typeof item.previewtype === 'undefined') {
                    const href = item.getAttribute('href');
                    const matcher = href.match(/\.(\w{1,4})$/);
                    item.previewtype = matcher && matcher[1] ? matcher[1] : '';
                    // teamcity's bug
                    if (item.previewtype === 'zip' && item.innerText.indexOf('!/') > 0) {
                        item.href = item.innerText;
                    } else if (item.previewtype.length > 0) {
                        item.addEventListener('mouseover', create_media_preview, false);
                        item.addEventListener('focus', create_media_preview, false);
                        item.addEventListener('click', toggle_media_preview, false);
                    }
                }
                item.classList.add(PREVIEW_CLASS);
            });

            const code_breakers = document.querySelectorAll('code > span');
            Array.from(code_breakers).forEach(item => {
                let text = document.createTextNode(item.textContent.trim());
                item.parentNode.replaceChild(text, item);
            });

            if (TEST_SUCCESS_RATE) {
                draw_sparkline();
            }
        }
    },
    {
        address_pattern: 'tab=buildLog',
        id: 'buildLog',
        transformer_class: 'mark',
        rule_set: BUILDLOG_TRANSFORMS,
        customizer: null
    }];

// to enable debug messages use this snippet:
// v=document.createElement('div'); v.id='betterDebug'; document.body.appendChild(v);
const debug = (message, obj = null) => {
    if (document.querySelectorAll('#betterDebug').length === 0)
        return;
    if (obj !== null) {
        console.log(`better.js: ${message}`, obj);
    } else {
        console.log(`better.js: ${message}`);
    }
};

const attrs = (node, attributes) => {
    for (let index in attributes) {
        node.setAttribute(index, attributes[index]);
    }
    return node;
};

async function makeRequest(method, url) {
    debug(`fetch ${url}`);

    return new Promise(function (resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}

function draw_sparkline() {
    const tcEntryPoint = `${window.location.protocol}//${window.location.hostname}:${window.location.port}/app/rest/testOccurrences`;
    const currentBuildId = (/buildId=(\d+)/.exec(window.location.search))[1];

    async function retrieveTestResults(fetchUrl) {
        let result = '';
        try {
            const response = await makeRequest('GET', fetchUrl);
            result = response.responseXML;
        } catch (e) {
        }
        return result;
    }

    function addRectangles(xmlTestResult, currentBuildId, svgNode, title = '') {
        const step = 5, width = 5;
        let testResults = Array.from(xmlTestResult.getElementsByTagName('testOccurrence'));
        let x = 0, success = 0;
        for (let i in testResults) {
            let item = testResults[i], value = item.attributes.status.nodeValue;
            let rect = attrs(document.createElementNS('http://www.w3.org/2000/svg', 'rect'), {x, width});
            switch (value) {
                case 'SUCCESS':
                    attrs(rect, {y: 5, height: 3, class: "green-bar"});
                    success++;
                    break;
                case 'FAILURE':
                    if (item.attributes.id.nodeValue.includes(`(id:${currentBuildId})`)) {
                        attrs(rect, {y: 0, height: 13, class: "current"});
                    } else {
                        attrs(rect, {y: 3, height: 7, class: "red-bar"});
                    }
                    break;
                default:
                    continue;
            }
            let buildDate = item.firstChild.firstChild.textContent;
            let t = /(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/.exec(buildDate);
            let rect_title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            rect_title.innerHTML = `${t[1]}-${t[2]}-${t[3]} ${t[4]}:${t[5]}:${t[6]}`;
            rect.appendChild(rect_title);
            svgNode.appendChild(rect);
            x += step;
        }
        let rate = (success * 100 / testResults.length).toString().substr(0, 5);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        title = title || 'Success rate';
        text.innerHTML = `${title}: ${rate}%`;
        svgNode.appendChild(attrs(text, {x: x + step * 2, y: 11}));
    }

    async function drawSVGFromUrl(wrapper, fetchUrl, title) {
        const svg = attrs(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), {'data-type': 'sparkline'});

        let result = await retrieveTestResults(fetchUrl);
        addRectangles(result, currentBuildId, svg, title);
        wrapper.appendChild(svg);
        return true;
    }

    function reDrawSpark() {
        const testId = this.dataset.testId,
            buildType = this.dataset.buildType;

        if (!this.globalStat && buildType.length === 0) {
            return;
        }

        const
            testResultsUrl = `${tcEntryPoint}?fields=testOccurrence(id,status,href,build(buildTypeId,startDate))&locator=test:${testId},ignored:false,count:${SPARKLINE_POINTS}`;

        // http://mainci.msk:8111/app/rest/testOccurrences?locator=test:-2359191317800676667,count:200&fields=testOccurrence(id,status,build(buildTypeId,startDate))

        if (this.firstChild) this.removeChild(this.firstChild);

        if (this.globalStat) {
            drawSVGFromUrl(this, testResultsUrl, 'Success rate');
        } else {
            drawSVGFromUrl(this, `${testResultsUrl},buildType:${buildType}`, 'Success rate (configuration)');
        }

        this.globalStat = !this.globalStat;
    }

    const stacktraces = document.querySelectorAll(`.${STACKTRACE_CLASS}:not([data-sparkline])`);
    let currentBuildType = '';
    if (url = (/buildTypeId=(\w+)/.exec(window.location.search))) {
        currentBuildType = url[1];
    }

    if (stacktraces.length === 0) {
        return;
    }

    const nodes = Array.from(stacktraces);

    debug('sparkline');
    for (let index in nodes) {
        let item = nodes[index];
        let matches = /fullStacktrace_\d+_([\d-]+)/.exec(item.id);
        let testId = matches[1];
        item.dataset.sparkline = testId;

        const parentNode = item.parentNode;
        const wrapper = parentNode.insertBefore(document.createElement('div'), parentNode.firstChild);
        wrapper.classList.add('sparkline-wrapper');
        wrapper.globalStat = true;
        wrapper.dataset.testId = testId;
        wrapper.dataset.buildType = currentBuildType;

        wrapper.onclick = reDrawSpark;
        wrapper.click();
    }
}

function initialize_rule_set() {
    function create_map(array_of_rules) {
        let result = {};
        array_of_rules.forEach((item, key) => {
            result[encodeURIComponent(item.to)] = key;
        });
        return result;
    }

    function setCurrentChoice(result) {
        overview_map = create_map(OVERVIEW_TRANSFORMS);
        buildlog_map = create_map(BUILDLOG_TRANSFORMS);

        result.settings.forEach((item) => {
            if (item.id in IDE_PORTS) {
                IDE_PORTS[item.id] = item.value;
            }
            if (item.id in overview_map) {
                OVERVIEW_TRANSFORMS[overview_map[item.id]].enabled = item.checked;
            }
            if (item.id in buildlog_map) {
                BUILDLOG_TRANSFORMS[buildlog_map[item.id]].enabled = item.checked;
            }
            if (item.id === 'sparkline') {
                TEST_SUCCESS_RATE = item.checked;
            }
        });
    }

    function onError(error) {
        debug('Error loading settings', error);
    }

    let getting = browser.storage.local.get(null);
    getting.then(setCurrentChoice, onError);
}

function get_media_type(element) {
    return element.previewtype || '';
}

let is_known_type = function (type) {
    return type === MEDIA_PNG || type === MEDIA_MP4;
};

function create_media_preview(event) {
    const target = event.target;
    const type = get_media_type(target);
    const create_preview_container = (opener) => {
        let id = (new Date()).toJSON();
        return attrs(document.createElement('div'), {class: 'preview', id});
    };

    const toggle_image_zoom = (event) => {
        let image = event.target;
        if (image.zoomed === true) {
            image.style.maxHeight = DEFAULT_MAX_HEIGHT;
            image.style.cursor = 'zoom-in';
            image.title = 'Zoom in';
        } else {
            image.style.removeProperty('max-height');
            image.style.cursor = 'zoom-out';
            image.title = 'Zoom out';
        }
        image.zoomed = !image.zoomed;
    };

    const create_media = (type, src) => {
        let media = null;
        switch (type) {
            case MEDIA_PNG:
                media = document.createElement('img');
                media.src = src;
                media.style.maxHeight = DEFAULT_MAX_HEIGHT;
                media.addEventListener('load', () => {
                    if (window.innerHeight < media.height + 200) {
                        media.title = 'Zoom in';
                        media.zoomed = false;
                        media.addEventListener('click', toggle_image_zoom);
                    }
                });
                break;
            case MEDIA_MP4:
                media = attrs(document.createElement('video'),
                    {controls: true, preload: 'metadata', playsinline: true, height: '438px', src});
                break;
        }
        return media;
    };

    if (is_known_type(type) && typeof target.previewId === 'undefined') {
        debug('create preview');
        const preview_container = create_preview_container(target);
        const media = create_media(type, target.href);

        preview_container.appendChild(media);
        target.parentNode.insertBefore(preview_container, target.nextSibling);
        target.previewId = preview_container.id;
        target.previewOpened = false;
    }
}

function toggle_media_preview(event) {
    debug('toggle preview');
    const target = event.target;
    const type = get_media_type(target);
    const preview_container = document.getElementById(target.previewId);

    if (is_known_type(type) && typeof target.previewId !== 'undefined') {
        event.preventDefault();
        if (target.previewOpened) {
            preview_container.style.display = 'none';
            target.title = '';
        } else {
            preview_container.style.display = 'block';
            target.title = 'Click to hide the preview';
        }
        target.previewOpened = !target.previewOpened;
    }
}

function select_code(event) {
    const target = event.target;
    const range = document.createRange();
    range.selectNodeContents(target);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    if (document.execCommand('copy')) {
        const copybox = document.createElement('div');
        copybox.innerText = 'Copied!';
        attrs(copybox, {id: 'copybox'});
        document.body.appendChild(copybox);
        let boundingClientRect = target.getBoundingClientRect();
        copybox.style.top = boundingClientRect.top + boundingClientRect.height + window.scrollY + 2 + 'px';
        copybox.style.left = (event.pageX - copybox.offsetWidth / 2) + 'px';
        setTimeout(() => {
            copybox.parentNode.removeChild(copybox);
        }, 1000);
    }
}

function open_in_intellij(event) {
    const port = IDE_PORTS[event.target.dataset.ide];
    const link = `http://${INTELLIJ_HOST}:${port}/${INTELLIJ_API}${event.target.dataset.path}`;

    debug(`link ${link}`);

    const req = new XMLHttpRequest();
    req.open("GET", link);
    req.send();
    event.preventDefault();
}

function transform_node_text(text, transformers) {
    transformers.forEach((item) => {
        if (!('enabled' in item && item.enabled === false)) {
            let rex = new RegExp(item.from, item.flags);
            text = text.replace(rex, item.to);
        }
    });
    return text;
}

function transform_mutated_nodes(transformer_class, rules, customizer) {

    const insert_canary_node = (item) => {
        item.appendChild(attrs(document.createElement('span'), {class: CANARY}));
    };

    const transform_block = (item, rules) => {
        if (item.innerHTML.length > 0 && item.getElementsByClassName(CANARY).length === 0) {
            item.innerHTML = transform_node_text(item.innerHTML, rules);
            insert_canary_node(item);
        }
    };

    let blocks = document.getElementsByClassName(transformer_class);
    if (blocks.length > 0) {
        Array.from(blocks).forEach((item) => {
            transform_block(item, rules)
        });
        if (typeof customizer === "function") {
            customizer();
        }
    }

    Array.from(document.getElementsByTagName('code')).forEach((item) => {
        item.addEventListener('dblclick', select_code, false)
    });

    Array.from(document.getElementsByClassName(INTELLIJ_LINK_CLASS)).forEach((item) => {
        item.addEventListener('click', open_in_intellij, false)
    });
}

// unit tests
if (typeof window !== "object") {
    module.exports = {
        OVERVIEW_TRANSFORMS
    };
}

function loader(parent = null) {
    let loader;
    if (window.betterJSLoader) {
        debug('loader exists');
        loader = window.betterJSLoader;
    } else {
        debug('to create loader');
        loader = document.createElement('div');
        // standard teamcity loader
        loader.classList.add('ring-loader-inline');
        if (parent === null) {
            loader.id = 'betterjs-loader-fixed';
            parent = document.body;
        }
        // let animation = document.createElement('div');
        // animation.classList.add('cssload-loader');
        // loader.appendChild(animation);
        parent.appendChild(loader);
        window.betterJSLoader = loader;
    }
}

function hide_loader() {
    if (window.betterJSLoader) {
        let loader = window.betterJSLoader;
        loader.parentNode.removeChild(loader);
        window.betterJSLoader = false;
    }
}

(function () {

    if (typeof window !== "object" || window.hasBetterReports) {
        return;
    }
    window.hasBetterReports = true;
    window.betterJSLoader = false;
    initialize_rule_set();

    let observers = [];

    // filter by address matching
    let nodes_filtered_by_addr = TRANSFORM_RULES.filter((node) => {
        return typeof node.address_pattern !== 'undefined' && location.search.match(node.address_pattern);
    });

    // nothing found, get the default one
    if (nodes_filtered_by_addr.length === 0) {
        nodes_filtered_by_addr = TRANSFORM_RULES.filter((node) => {
            return typeof node.address_pattern === 'undefined';
        });
    }

    nodes_filtered_by_addr.every((node) => {
        // select the target node
        const target = document.getElementById(node.id);

// create an observer instance
        let observer = new MutationObserver((mutations) => {
            loader();
            mutations.forEach((mutation) => {
                debug('mutation', mutation);
                transform_mutated_nodes(node.transformer_class, node.rule_set, node.customizer)
            });
            window.setTimeout(hide_loader, 500);
        });

// pass in the target node, as well as the observer options
        observer.observe(target, {attributes: true, childList: true, subtree: true, characterData: true});
        debug(`observe ${node.id}, ${node.transformer_class}`);
        observers.push(observer);
    });

    window.onunload = () => {
        observers.forEach((item) => {
            item.disconnect();
            debug('stop observing');
        })
    };
})();