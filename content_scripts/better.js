const TRANSFORMATION_RULES = [
    {
        from:  "(https?:\\/\\/[^ \\s]+)([ \\s])",
        to: "<a href='$1' target='_blank' data-preview=''>$1</a>$2"
    },
    {
        from:  "&gt;&gt;(.+)&lt;&lt;",
        to: ">><code>$1</code><<"
    },
    {
        from:  "(phpunit\s(.+))\n",
        to: "<code>$1</code>\n"
    },
    {
        from:  "(features\/[A-z0-9\\/.]+:\\d+)",
        to: "<code>$1</code>"
    }
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
            media.title = 'Click to hide the preview';
            preview_container.addEventListener('click', function () {
                this.parentNode.removeChild(this);
                element.dataset.preview = '';
            });
            break;
        case 'mp4':
            media = document.createElement('video');
            let source = document.createElement('source');
            media.setAttribute('controls', 'controls');
            media.setAttribute('height', '500');
            source.setAttribute('src', element.href);
            source.setAttribute('kind', 'video/mp4');
            media.appendChild(source);
            break;
    }

    if (preview_container && media) {
        preview_container.appendChild(media);
        element.parentNode.insertBefore(preview_container, element.nextSibling);
    }
}

function select_code(event)
{
    let element = event.target;
    let range = document.createRange();
    range.selectNodeContents(element);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
}

function transform(text)
{
    TRANSFORMATION_RULES.forEach((item)=>{
        let rex = new RegExp(item.from, 'g');
        text = text.replace(rex, item.to);
    });
    return text;
}

function step() {
    console.debug('better.js', 'step');
    document.querySelectorAll('.fullStacktrace').forEach((item) => {
        if (item.innerHTML.length > 0 && item.querySelector('.test') === null) {
            item.innerHTML = transform(item.innerHTML);
            // add an invisible span
            let test = document.createElement('span');
            test.setAttribute('class', 'test');
            item.appendChild(test);
        }
    });
    document.querySelectorAll('.fullStacktrace a').forEach((item) => {
        item.addEventListener('click', preview_media, false);
    });
    document.querySelectorAll('.fullStacktrace code').forEach((item) => {
        item.addEventListener('dblclick', select_code, false);
    });
}

const nodes = ['#buildResults'];

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
    console.debug('better.js', 'observe');

    window.onunload = () => {
        observer.disconnect();
        console.debug('better.js', 'disconnect');
    };
});