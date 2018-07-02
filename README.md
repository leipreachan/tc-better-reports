## Features

* a click on a link to an image / mp4 file will show you a preview with media content
  * large screenshots will be resized to fit the screen. You can zoom-in / zoom-out them.
* it adds `<code>` nodes:
  * a double click on the `<code>` node (the gray one) selects and copies its content
  * everything within `>>MMM<<` will be transformed to `<code>MMM</code>`
  * everything like `phpunit anything.php` will be transformed to `<code>phpunit anything.php</code>`
  * everything like `bundle exec ...` will be transformed to `<code>bundle exec .. </code>`
  * everything like `docker-compose run ...` will be transformed to `<code>docker-compose run .. </code>`
  * everything like `./anything/filename(.rb|.feature):32` will be transformed to `<code>./anything/filename:32</code><a>open the file in your IDE</a>` *
  * everything like `buildAgent/buildhash/path/filename.php:42` will be transformed to `<code>buildAgent/buildhash/path/filename.php:42</code><a>open the file in your IDE</a>` *
  * everything like `features/anything/anything:32` will be transformed to `<code>features/anything/anything:32</code>`
  * `User:? \d+` is transformed to `User:? <code>$1</code>`
  * [chrome://extensions/](chrome://extensions/) => Developer mode (v) => Update extensions now
* it transforms links in TC reports into proper `<a>` tag (optional, OFF by default)
* you can control transformations via Preferences

[Firefox](https://github.com/leipreachan/tc-better-reports/releases) |
[Google Chrome](https://chrome.google.com/webstore/detail/tc-better-reports/idddfkaoefamlflojibpncamdcbnddpk)

[Changelog](CHANGELOG.md)

--

\* Note that IDE will show alert asking if you trust the source. To make IDE open file immediately check Allow unsigned request in Debugger preferences in IDE. Warning: this lessens security.
