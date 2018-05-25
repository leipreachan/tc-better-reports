/// TODO: to check if still valid and fix incorrect nesting ??
// Element >>http://web:web@gridrouter.d3:44441/wd/hub/session/b0721b41341782bfcff2507e2e5894a6d1e09d9e-ac15-41ea-905e-d9bba244fd20/element/44<< is not clickable at point (631.5, 584.0333251953125). Other element would receive the click: <div id="disable_ovl"></div>
// TODO: opening a preview should not call mutator
// TODO: get rid of double filtering (firstly filter TRANSFORM_RULES by address, if get default filters)
// TODO: there should be only one default TRANSFORM_RULE as all the others will be ignored
// TODO: add options for preloading (maybe?)

const CANARY = 'canary',
    PREVIEW_CLASS_BEFORE = 'better',
    PREVIEW_CLASS_AFTER = 'betterpreview',
    INTELLIJ_LINK_CLASS = 'better-intellij-link'
    MEDIA_PNG = 'png',
    MEDIA_MP4 = 'mp4';

const OVERVIEW_TRANSFORMS = [
    {
        name: 'linkify',
        // language=JSRegexp
        from: '(https?:\/\/(?:[\\w:\.]+\@)?(?:\\w[-\\w\.]+)(?::\\d{1,5})?(?:\/(?:[\\w#\/_\.!=:-]*(?:\\?\\S+)?)?)?)(\\s+)',
        to: `<a href="$1" target="_blank" class="${PREVIEW_CLASS_BEFORE}">$1</a>$2`,
        flags: 'g'
    },
    {
        from: '&gt;&gt;(.+?)&lt;&lt;',
        to: '&gt;&gt;<code>$1</code>&lt;&lt;',
        flags: 'g'
    },
    {
        from: "((phpunit|bundle.exec|docker-compose.run|./docker_droid.sh).+)\n",
        to: "<code>$1</code>\n",
        flags: 'g'
    },
    {
        // language=JSRegexp
        from: '(?:\\.\\/)?([\\.\\w_\\/]+:\\d+)\\:in',
        to: `<code>$1</code><a href="#" class="${INTELLIJ_LINK_CLASS}" data-path="$1" title="Open file in IDE"></a>`,
        flags: 'g'
    },
    {
        // language=JSRegexp
        from: '(User: +)(\\d+)([ \/]+)(\\w+\@[\\w.]+)([ \/]+)(\\w+)',
        to: '$1<code>$2</code>$3<code>$4</code>$5<code>$6</code>',
        flags: 'g'
    },
    {
        from: '(User:? +)(\\d+)',
        to: '$1<code>$2</code>',
        flags: 'g'
    }
];

const BUILDLOG_TRANSFORMS = [
    {
        from: '(features\/[\\w_\/\.: ]+)',
        to: '<code>$1</code>',
        flags: 'g'
    },
];

const TRANSFORM_RULES = [
    {
        // address_pattern: 'tab=buildResultsDiv',
        id: 'buildResults',
        transformer_class: 'fullStacktrace',
        rule_set: OVERVIEW_TRANSFORMS,
        customizer: () => {
            const previews = document.getElementsByClassName(PREVIEW_CLASS_BEFORE);
            // console.debug('better.js', `${previews.length} elements to be transformed`);
            Array.from(previews).forEach((item) => {
                if (item.previewtype === undefined) {
                    const href = item.getAttribute('href');
                    const matcher = href.match(/\.(\w{1,4})$/);
                    item.previewtype = matcher && matcher[1] ? matcher[1] : '';
                    if (item.previewtype.length > 0) {
                        item.addEventListener('mouseover', create_media_preview, false);
                        item.addEventListener('focus', create_media_preview, false);
                        item.addEventListener('click', toggle_media_preview, false);
                    }
                }
                item.classList.replace(PREVIEW_CLASS_BEFORE, PREVIEW_CLASS_AFTER);
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

const DEFAULT_MAX_HEIGHT = '80vh';

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
        console.debug('better.js: create preview');
        const preview_container = create_preview_container(target);
        const media = create_media(type, target.href);

        preview_container.appendChild(media);
        target.parentNode.insertBefore(preview_container, target.nextSibling);
        target.previewId = preview_container.id;
        target.previewOpened = false;
    }
}

function toggle_media_preview(event) {
    console.debug('better.js: toggle preview');
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
    const link = `http://localhost:63342/api/file/${event.target.dataset.path}`

    const req = new XMLHttpRequest();
    req.open("GET", link);
    req.send();
    event.preventDefault();
}

function transform_node_text(text, transformers) {
    transformers.forEach((item) => {
        let rex = new RegExp(item.from, item.flags);
        text = text.replace(rex, item.to);
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

(function () {

    if (typeof window !== "object" || window.hasBetterReports) {
        return;
    }
    window.hasBetterReports = true;

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
            mutations.forEach((mutation) => {
                // console.debug('better.js mutation', mutation);
                transform_mutated_nodes(node.transformer_class, node.rule_set, node.customizer)
            });
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