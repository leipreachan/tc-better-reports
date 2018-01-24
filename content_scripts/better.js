const TRANSFORMATION_RULES = [
    {
        from: '(https?:\\/\\/[^ \\s]+)([ \\s])',
        to: '<a href="$1" target="_blank" data-preview="">$1</a>$2',
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
        from: '(User +)(\\d+)',
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

function preview_media(event) {
    const element = event.target;
    const type = element.href.substr(element.href.lastIndexOf('.') + 1).toLowerCase();

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

function step() {
    // test results
    let stacktraces = document.querySelectorAll('.fullStacktrace');
    if (stacktraces.length > 0) {
        console.debug('better.js', 'step - stacktraces');
        stacktraces.forEach((item) => {
            if (item.innerHTML.length > 0 && item.querySelector('.test') === null) {
                item.innerHTML = transform(item.innerHTML, TRANSFORMATION_RULES);
                // add an invisible span
                let test = document.createElement('span');
                test.setAttribute('class', 'test');
                item.appendChild(test);
            }
        });
        document.querySelectorAll('.fullStacktrace a').forEach((item) => {
            item.addEventListener('click', preview_media, false);
        });
    }

    // build log
    let buildlogs = document.querySelectorAll('.mark');
    if (buildlogs.length > 0) {
        console.debug('better.js', 'step - buildlogs');
        buildlogs.forEach((item) => {
            if (item.innerHTML.length > 0 && item.querySelector('.test') === null) {
                item.innerHTML = transform(item.innerHTML, BUILDLOG_TRANSFORMS);
                // add an invisible span
                let test = document.createElement('span');
                test.setAttribute('class', 'test');
                item.appendChild(test);
            }
        });
    }

    document.querySelectorAll('code').forEach((item) => {
        item.addEventListener('dblclick', select_code, false)
    });

}

const nodes = ['#buildResults', '#buildLog', '#report_project12_Failed_tests_Tab'];

nodes.every((node) => {
    // select the target node
    let target = document.querySelector(node);

// create an observer instance
    let observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            step();
        });
    });

// configuration of the observer:
    let config = {attributes: true, childList: true, subtree: true, characterData: true};

// pass in the target node, as well as the observer options
    observer.observe(target, config);
    console.debug('better.js', `observe ${node}`);

    window.onunload = () => {
        observer.disconnect();
        console.debug('better.js', `observe ${node}`);
    };
});