const CANARY = 'canary',
    PREVIEW_CLASS = 'better-preview',
    INTELLIJ_LINK_CLASS = 'better-intellij-link',
    BOLT = 'bolt',
    MEDIA_PNG = 'png',
    MEDIA_MP4 = 'mp4';

const IDE_PORTS = {
    rubymine: 63342,
    phpstorm: 63342
};

const OVERVIEW_TRANSFORMS = [
    {
        desc: 'Linkification -- transform link like https?://... to <a>https://...</a>',
        // language=JSRegexp
        from: '(https?:\/\/(?:[\\w:\.]+\@)?(?:\\w[-\\w\.]+)(?::\\d{1,5})?(?:\/(?:[\\w#\/_\.!=:-]*(?:\\?\\S+)?)?)?)(\\s+)',
        to: '<a href="$1" target="_blank">$1</a>$2',
        flags: 'g',
        enabled: false
    },
    {
        desc: 'Transform >>xxx<< to <code>xxx</code>',
        from: '&gt;&gt;(.+?)&lt;&lt;',
        to: '&gt;&gt;<code>$1</code>&lt;&lt;',
        flags: 'g'
    },
    {
        desc: 'Highlight phpunit ..., bundle exec .., docker compose run .., ./docker_droid.sh, etc',
        from: "((?:phpunit|bundle.exec|docker.compose.run|..docker.droid.sh|APP=).+?)(?:\n|<br>)",
        to: "<code>$1</code>\n",
        flags: 'g'
    },
    {
        desc: 'Highlight *.rb and *.feature files and add IDE links next to them',
        // language=JSRegexp
        from: '((?:\.\/)?[\.\\w-_\\/]+\.(?:rb|feature):\\d+)(:in)?',
        to: `<code>$1</code><a href="#" class="${PREVIEW_CLASS} ${INTELLIJ_LINK_CLASS} ${BOLT}" data-ide="rubymine" data-path="$1" title="Open file with RubyMine"></a>$2`,
        flags: 'g'
    },
    {
        desc: 'Highlight buildAgent/work/*.php files and add IDE links next to them',
        // language=JSRegexp
        from: '(buildAgent\/work\/\\w+\/)([\.\\w-_\\/]+\.php[:(]\\d+[)]?)',
        to: `$1<code>$2</code><a href="#" class="${PREVIEW_CLASS} ${INTELLIJ_LINK_CLASS} ${BOLT}" data-ide="phpstorm" data-path="$2" title="Open file with PHPStorm"></a>`,
        flags: 'g'
    },
    {
        desc: 'Highlight fields in a string like "User: 1234 name pass"',
        // language=JSRegexp
        from: '(User: +)(\\d+)([ \/]+)(\\w+\@[\\w.]+)([ \/]+)(\\w+)',
        to: '$1<code>$2</code>$3<code>$4</code>$5<code>$6</code>',
        flags: 'g'
    },
    {
        desc: 'Highlight fields in a string like "User ID: 1234" and "User: 1234"',
        from: '(User(?: ID)?:? +)(\\d+)',
        to: '$1<code>$2</code>',
        flags: 'g'
    },
    {
        desc: 'Highlight Gherkin steps Given/When/Then/And followed by hash sign and link to file',
        // language=RegExp
        from: '(<br>(?:\\s+)|(?:\\w+\\s+=&gt;\\s+))((?:Given|And|When|Then).+?)#(?:[^<]+<[^>]+>)?([^:]+:\\d+)(?:<\\/[^>]+>)?',
        to: `$1<a href="#" class="${PREVIEW_CLASS} ${INTELLIJ_LINK_CLASS}" data-port="rubymine" data-path="$3" title="Open file with RubyMine">$2</a>`,
        flags: 'g'
    }
];

const BUILDLOG_TRANSFORMS = [
    {
        desc: 'Highlight a string with files from directory features/*',
        from: '(features\/[\\w_\/\.: ]+)',
        to: '<code>$1</code>',
        flags: 'g'
    },
];
