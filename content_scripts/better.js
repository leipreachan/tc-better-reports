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
                if (item.previewtype === undefined) {
                    const href = item.getAttribute('href');
                    const matcher = href.match(/\.(\w{1,4})$/);
                    item.previewtype = matcher && matcher[1] ? matcher[1] : '';
                    // teamcity's bug
                    if (item.previewtype === 'zip' && item.innerText.indexOf('!/') > 0) {
                        item.href = item.innerText;
                    } else
                    if (item.previewtype.length > 0) {
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
        }
    },
    {
        address_pattern: 'tab=buildLog',
        id: 'buildLog',
        transformer_class: 'mark',
        rule_set: BUILDLOG_TRANSFORMS,
        customizer: null
    }];

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
        });
    }

    function onError(error) {
        console.log(`Error loading settings: ${error}`);
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
        let preview_container = document.createElement('div');
        preview_container.setAttribute('class', 'preview');
        let id = (new Date()).toJSON();
        preview_container.setAttribute('id', id);
        return preview_container;
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
                media = document.createElement('video');
                media.setAttribute('controls', 'true');
                media.setAttribute('preload', 'metadata');
                media.setAttribute('playsinline', 'true');
                media.setAttribute('height', '438px');
                media.setAttribute('src', src);
                break;
        }
        return media;
    };

    if (is_known_type(type) && target.previewId === undefined) {
        // console.debug('better.js: create preview');
        const preview_container = create_preview_container(target);
        const media = create_media(type, target.href);

        preview_container.appendChild(media);
        target.parentNode.insertBefore(preview_container, target.nextSibling);
        target.previewId = preview_container.id;
        target.previewOpened = false;
    }
}

function toggle_media_preview(event) {
    // console.debug('better.js: toggle preview');
    const target = event.target;
    const type = get_media_type(target);
    const preview_container = document.getElementById(target.previewId);

    if (is_known_type(type) && target.previewId !== undefined) {
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
        copybox.setAttribute('id', 'copybox');
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

    // console.debug('better.js link', link);

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
        const test = document.createElement('span');
        test.setAttribute('class', CANARY);
        item.appendChild(test);
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

function loader()
{
    let loader;
    if (window.betterJSLoader) {
        console.debug('better.js: loader exists');
        loader = window.betterJSLoader;
    } else {
        console.debug('better.js: to create loader');
        loader = document.createElement('div');
        loader.style.position = 'fixed';
        loader.style.top = '5px';
        loader.style.left = '5px';
        loader.id = 'betterjs-loader';
        let animation = document.createElement('div');
        animation.classList.add('cssload-loader');
        loader.appendChild(animation);
        document.body.appendChild(loader);
        window.betterJSLoader = loader;
    }
}

function hide_loader()
{
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
        return node.address_pattern !== undefined && location.search.match(node.address_pattern);
    });

    // nothing found, get the default one
    if (nodes_filtered_by_addr.length === 0)
    {
        nodes_filtered_by_addr = TRANSFORM_RULES.filter((node) => {
            return node.address_pattern === undefined;
        });
    }

    nodes_filtered_by_addr.every((node) => {
        // select the target node
        const target = document.getElementById(node.id);

// create an observer instance
        let observer = new MutationObserver((mutations) => {
            loader();
            mutations.forEach((mutation) => {
                // console.debug('better.js mutation', mutation);
                transform_mutated_nodes(node.transformer_class, node.rule_set, node.customizer)
            });
            window.setTimeout(hide_loader, 500);
        });

// pass in the target node, as well as the observer options
        observer.observe(target, {attributes: true, childList: true, subtree: true, characterData: true});
        console.debug(`better.js: observe ${node.id}, ${node.transformer_class}`);
        observers.push(observer);
    });

    window.onunload = () => {
        observers.forEach((item) => {
            item.disconnect();
            console.debug('better.js: stop observing');
        })
    };
})();