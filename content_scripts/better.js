const TRANSFORMATION_RULES = [
    {
        from: '(https?:\\/\\/[^ \\s]+(\\w{3}))([ \\s])',
        to: '<a href="$1" target="_blank" data-preview="" data-previewtype="$2" class="betterpreview">$1</a>$3',
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

const CANARY = 'canary';

function get_media_type(element)
{
    return element.dataset.previewtype;
}

function preview_media(event) {
    const element = event.target;
    console.debug(`better.js: preview-media`);
    const type = get_media_type(element);

    function create_preview_container(opener) {
        let preview_container = document.createElement('div');
        preview_container.setAttribute('class', 'preview');
        let id = (new Date()).toJSON();
        preview_container.setAttribute('id', id);
        opener.dataset.preview = id;
        return preview_container;
    }

    function close_preview_container(opener) {
        let preview_container = document.getElementById(element.dataset.preview);
        preview_container.parentNode.removeChild(preview_container);
        opener.dataset.preview = '';
        opener.title = '';
    }

    let preview_container, media;
    if (type === 'png' || type === 'mp4') {
        event.preventDefault();
        if (element.dataset.preview.length > 0) {
            close_preview_container(element);
        } else {
            preview_container = create_preview_container(element);
            element.title = 'Click to hide the preview';
        }
    }

    switch (type) {
        case 'png':
            media = document.createElement('img');
            media.src = element.href;
            media.style.maxHeight = '90vh';
            media.addEventListener('load', () => {
                if (window.innerHeight < media.height + 100) {
                    media.title = 'Zoom in';
                    media.style.cursor = 'zoom-in';
                    preview_container.dataset.zoom = '';
                    preview_container.addEventListener('click', () => {
                        if (preview_container.dataset.zoom === 'true') {
                            media.style.maxHeight = '90vh';
                            media.style.cursor = 'zoom-in';
                            preview_container.dataset.zoom = '';
                            media.title = 'Zoom in';
                        } else {
                            media.style.removeProperty('max-height');
                            media.style.cursor = 'zoom-out';
                            preview_container.dataset.zoom = 'true';
                            media.title = 'Zoom out';
                        }
                    });
                }
            });
            break;
        case 'mp4':
            media = document.createElement('video');
            media.setAttribute('id', 'video-preview');
            media.setAttribute('controls', 'true');
            media.setAttribute('preload', 'metadata');
            media.setAttribute('playsinline', 'true');
            media.setAttribute('height', '438px');
            media.setAttribute('src', element.href);
            break;
    }

    if (preview_container && media) {
        preview_container.appendChild(media);
        element.parentNode.insertBefore(preview_container, element.nextSibling);
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

function transform(text, transformers) {
    transformers.forEach((item) => {
        let rex = new RegExp(item.from, item.flags);
        text = text.replace(rex, item.to);
    });
    return text;
}

function step(transformer_class, rules, customizer) {

    function canary_node(item) {
        let test = document.createElement('span');
        test.setAttribute('class', CANARY);
        item.appendChild(test);
    }

    function transform_block(item, rules) {
        if (item.innerHTML.length > 0 && item.getElementsByClassName(CANARY).length === 0) {
            item.innerHTML = transform(item.innerHTML, rules);
            canary_node(item);
        }
    }

    let blocks = document.getElementsByClassName(transformer_class);
    if (blocks.length > 0) {
        Array.from(blocks).forEach(item => transform_block(item, rules));
        customizer();
    }

    Array.from(document.getElementsByTagName('code')).forEach(item => item.addEventListener('dblclick', select_code, false));
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
        mutations.forEach(mutation => step(node.transformer_class, node.rule_set, node.customizer));
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