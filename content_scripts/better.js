// TODO: c) create preview node on mouse hover event, but toggle it on click
// TODO: c) add sliding


const TRANSFORMATION_RULES = [
    {
        // language=JSRegexp
        from: '(https?:\\/\\/\\S+(([a-z]{3})|([^\\s]{3})))(\\s+?)',
        to: '<a href="$1" target="_blank" data-previewtype="$3" class="betterpreview">$1</a>$5',
        flags: 'g'
    },
    {
        from: '&gt;&gt;(.+?)&lt;&lt;',
        to: '>><code>$1</code><<',
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
        from: '(features\\/[\\w_\\/]+\\.feature:\\d+)',
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
        from: '(User: +)(\\d+)([ \\/]+)(\\w+@[\\w.]+)([ \\/]+)(\\w+)',
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
        from: '(features\/[\\w_\\/\\.: ]+)',
        to: '<code>$1</code>',
        flags: 'g'
    },
];

const CANARY = 'canary',
    MEDIA_PNG = 'png',
    MEDIA_MP4 = 'mp4';

const DEFAULT_MAX_HEIGHT = '90vh';

function get_media_type(element) {
    return element.dataset.previewtype;
}

function preview_media(event) {
    const element = event.target;
    const type = get_media_type(element);
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

    const create_media = (type, preview_container) => {
        switch (type) {
            case MEDIA_PNG:
                media = document.createElement('img');
                media.src = element.href;
                media.style.maxHeight = DEFAULT_MAX_HEIGHT;
                media.addEventListener('load', () => {
                    if (window.innerHeight < media.height + 100) {
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
                media.setAttribute('src', element.href);
                break;
        }
        return media;
    };

    if (type === MEDIA_PNG || type === MEDIA_MP4) {
        event.preventDefault();
        if (element.previewId === undefined) {
            const preview_container = create_preview_container(element);
            const media = create_media(type, preview_container);

            preview_container.appendChild(media);
            element.parentNode.insertBefore(preview_container, element.nextSibling);
            element.previewId = preview_container.id;
            element.previewOpened = true;
        } else {
            const preview_container = document.getElementById(element.previewId);
            if (element.previewOpened) {
                preview_container.style.display = 'none';
                element.title = '';
            } else {
                preview_container.style.display = 'block';
                element.title = 'Click to hide the preview';
            }
            element.previewOpened = !element.previewOpened;
        }
    }
}

function select_code(event) {
    let element = event.target;
    let range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    if (document.execCommand('copy')) {
        let copybox = document.createElement('div');
        copybox.innerText = 'Copied!';
        copybox.setAttribute('id', 'copybox');
        document.body.appendChild(copybox);
        let boundingClientRect = element.getBoundingClientRect();
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
        let test = document.createElement('span');
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
        customizer();
    }

    Array.from(document.getElementsByTagName('code')).forEach((item) => {
        item.addEventListener('dblclick', select_code, false)
    });
}

const nodes = [
    {
        id: 'buildResults',
        transformer_class: 'fullStacktrace',
        rule_set: TRANSFORMATION_RULES,
        customizer: () => {
            Array.from(document.getElementsByClassName('betterpreview')).forEach((item) => {
                item.addEventListener('click', preview_media, false);
            });
        }
    },
    {
        id: 'buildLog',
        transformer_class: 'mark',
        rule_set: BUILDLOG_TRANSFORMS,
        customizer: null
    }];

nodes.every((node) => {
    // select the target node
    let target = document.getElementById(node.id);

// create an observer instance
    let observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            transform_mutated_nodes(node.transformer_class, node.rule_set, node.customizer)});
    });

// configuration of the observer:
    let config = {attributes: true, childList: true, subtree: true, characterData: true};

// pass in the target node, as well as the observer options
    observer.observe(target, config);
    console.debug(`better.js: observe ${node.id}`);

    window.onunload = () => {
        observer.disconnect();
        console.debug(`better.js: observe ${node.id}`);
    };
});