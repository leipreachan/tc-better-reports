/// TODO: to fix incorrect nesting ??
// Element >>http://web:web@gridrouter.d3:44441/wd/hub/session/b0721b41341782bfcff2507e2e5894a6d1e09d9e-ac15-41ea-905e-d9bba244fd20/element/44<< is not clickable at point (631.5, 584.0333251953125). Other element would receive the click: <div id="disable_ovl"></div>
// TODO: to fix a bug: zoom-in feature works with the very first open preview image. Having more previews opened the click zooms in the very first preview anyway
// TODO: opening a preview should not call mutator
// TODO: add options for preloading (maybe?)

const CANARY = 'canary',
    PREVIEW_CLASS = 'betterpreview',
    MEDIA_PNG = 'png',
    MEDIA_MP4 = 'mp4';

const OVERVIEW_TRANSFORMS = [
    {
        name: 'linkify',
        // language=JSRegexp
        from: '(https?:\/\/(?:[\\w:\.]+\@)?(?:\\w[-\\w\.]+)(?::\\d{1,5})?(?:\/(?:[\\w#\/_\.!=:-]*(?:\\?\\S+)?)?)?)(\\s+)',
        to: '<a href="$1" target="_blank" class="betterpreview">$1</a>$2',
        flags: 'g'
    },
    {
        from: '&gt;&gt;(.+?)&lt;&lt;',
        to: '&gt;&gt;<code>$1</code>&lt;&lt;',
        flags: 'g'
    },
    {
        from: "(phpunit +.+)\n",
        to: "<code>$1</code>\n",
        flags: 'g'
    },
    {
        from: "(bundle +exec +.+)\n",
        to: "<code>$1</code>\n",
        flags: 'g'
    },
    {
        // language=JSRegexp
        from: '(features\/[\\w_\/]+\.feature:\\d+)',
        to: '<code>$1</code>',
        flags: 'g'
    },
    {
        from: "(docker-compose run.+)\n",
        to: "<code>$1</code>\n",
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

const DEFAULT_MAX_HEIGHT = '80vh';

function get_media_type(element) {
    return element.dataset.previewtype;
}

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

    const toggle_image_zoom = (preview_container, image) => {
        if (preview_container.zoomed === true) {
            image.style.maxHeight = DEFAULT_MAX_HEIGHT;
            image.style.cursor = 'zoom-in';
            image.title = 'Zoom in';
        } else {
            image.style.removeProperty('max-height');
            image.style.cursor = 'zoom-out';
            image.title = 'Zoom out';
        }
        preview_container.zoomed = !preview_container.zoomed;
    };

    const create_media = (type, preview_container, src) => {
        switch (type) {
            case MEDIA_PNG:
                media = document.createElement('img');
                media.src = src;
                media.style.maxHeight = DEFAULT_MAX_HEIGHT;
                media.addEventListener('load', () => {
                    if (window.innerHeight < media.height + 200) {
                        media.title = 'Zoom in';
                        preview_container.zoomed = false;
                        preview_container.addEventListener('click', () => toggle_image_zoom(preview_container, media));
                    }
                });
                break;
            case MEDIA_MP4:
                media = document.createElement('video');
                media.setAttribute('id', 'video-preview');
                media.setAttribute('controls', 'true');
                media.setAttribute('preload', 'metadata');
                media.setAttribute('playsinline', 'true');
                media.setAttribute('height', '438px');
                media.setAttribute('src', src);
                break;
        }
        return media;
    };

    if ((type === MEDIA_PNG || type === MEDIA_MP4) && target.previewId === undefined) {
        console.debug('better.js: create preview');
        const preview_container = create_preview_container(target);
        const media = create_media(type, preview_container, target.href);

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

    if ((type === MEDIA_PNG || type === MEDIA_MP4) && target.previewId !== undefined) {

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

    const nodes = [
        {
            address_pattern: 'tab=buildResultsDiv',
            id: 'buildResults',
            transformer_class: 'fullStacktrace',
            rule_set: OVERVIEW_TRANSFORMS,
            customizer: () => {
                Array.from(document.getElementsByClassName(PREVIEW_CLASS)).forEach((item) => {
                    const href = item.getAttribute('href');
                    const matcher = href.match(/\.(\w{1,4})$/);
                    if (matcher && undefined !== matcher[1]) {
                        item.dataset.previewtype = matcher[1];
                        item.addEventListener('mouseover', create_media_preview, false);
                        item.addEventListener('focus', create_media_preview, false);
                        item.addEventListener('click', toggle_media_preview, false);
                    }
                });
            },
            mutation_config: {childList: true, subtree: true, characterData: true}
        },
        {
            address_pattern: 'tab=buildLog',
            id: 'buildLog',
            transformer_class: 'mark',
            rule_set: BUILDLOG_TRANSFORMS,
            customizer: null,
            mutation_config: {attributes: true, childList: true, subtree: true, characterData: true}
        }];

    let observers = [];

    nodes_filtered_by_addr = nodes.filter((node) => {return location.search.match(node.address_pattern)});

    nodes_filtered_by_addr.every((node) => {
        // select the target node
        const target = document.getElementById(node.id);

// create an observer instance
        let observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                transform_mutated_nodes(node.transformer_class, node.rule_set, node.customizer)
            });
        });

// pass in the target node, as well as the observer options
        observer.observe(target, node.mutation_config);
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