function smart_link(event) {
    let element = event.target;
    if (element.href.includes('.png') && element.dataset.img !== 'true') {
        event.preventDefault();
        let container = document.createElement('div');
        let img = document.createElement('img');
        img.src = element.href;
        img.title = 'Click to close';
        img.addEventListener('click', (event) => {
            this.dataset.img = '';
            let item = event.target;
            item.parentNode.removeChild(item);
        });
        element.parentNode.insertBefore(container, element.nextSibling);
        container.appendChild(img);
        element.dataset.img = 'true';
    }
}

function step() {
    document.querySelectorAll('.fullStacktrace').forEach((item) => {
        if (item.innerHTML.length > 0 && item.querySelector('.test') === null) {
            // replace links
            item.innerHTML = item.innerHTML.replace(/(https?:\/\/[^ \s]+)([ \s])/gi, '<a href="$1" target="_blank" data-img="">$1</a>$2');
            // replace >>anything<<
            item.innerHTML = item.innerHTML.replace(/&gt;&gt;(.+)&lt;&lt;/gi, '>><code>$1</code><<');
            // add an invisible span
            let test = document.createElement('span');
            test.setAttribute('class', 'test');
            item.appendChild(test);
        }
    });
    document.querySelectorAll('.fullStacktrace a').forEach((item) => {
        item.addEventListener('click', smart_link, false);
    });
}

const nodes = ['#tst_group_build_fail', '#tst_group_build_muteRefresh'];

nodes.every((node)=>{
    // select the target node
    let target = document.querySelector(node);

// create an observer instance
    let observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {step();});
    });

// configuration of the observer:
    let config = {attributes: true, childList: true, subtree: true, characterData: true};

// pass in the target node, as well as the observer options
    observer.observe(target, config);

    window.onunload = () => {
        observer.disconnect();
    };
});