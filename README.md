## Features

* it transforms links in TC reports into proper `<a>` tag
* a click on a link to an image / mp4 file will show you a preview with media content
* it adds a `<code>` nodes which can:
 * a double click on the `<code>` node (the gray one) selects its content
 * everything within `>>MMM<<` will be transformed to `<code>MMM</code>`
 * everything like `phpunit anything.php` will be transformed to `<code>phpunit anything.php</code>`
 * everything like `features/anything/anything:32` will be transformed to `<code>features/anything/anything:32</code>`
 * everything like `bundle exec ...` will be transformed to `<code>bundle exec .. </code>`
 * large screenshots will be resized to fit the screen. You can zoom-in / zoom-out them.
 * [chrome://extensions/](chrome://extensions/) => Developer mode (v) => Update extensions now

Firefox (unlisted) |
[Google Chrome](https://chrome.google.com/webstore/detail/tc-better-reports/idddfkaoefamlflojibpncamdcbnddpk)


## Release notes

### 0.0.12

* less strict URL permissions (now it should work with any Teamcity)
* small improvements in CSS

### 0.0.11

* `bundle exec ... ` gets some respect

### 0.0.10

* Zoom-in, zoom-out large screenshots

### 0.0.9

* added something to please Artur. I don't remember what was that.

### 0.0.8

* even better styling!

### 0.0.7

*  better styling
 
### 0.0.6

* more parsing rules added
* double click on the `<code>` node (the gray one) selects its content

### 0.0.5

* better media preview

### 0.0.4

* now we monitor mutations of the correct node

### 0.0.3

* add preview of mp4s

### 0.0.2

* properly handle disappearing divs

### 0.0.1

* inital release
