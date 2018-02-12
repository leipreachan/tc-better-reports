

## Release notes

### known issues

* something like `>>https://link<<` is parsed in a wrong way:(

### 0.0.21 [stable]

* technical debts
* bugfix: when there are several previews opened on the page, the first opened preview got zoomed-in and zoomed-out instead of any clicked 

### 0.0.20 [stable]

* added unit tests. Fixed the regular expression for "linkifying"
* bugfix: buildlog has not been parsed

### 0.0.19 [stable]

* stricter links validation

### 0.0.18 [unstable]

* memory leak fixed
* preview is loaded on mouseover / focus events. Basically, it's a preloading
* minor css tweaks
* technical debts

### 0.0.17

* links with preview option have a little bit of decoration

### 0.0.15

* technical debts. Got rid of querySelectorAll => the extension should be a bit faster

### 0.0.14

* technical debts

### 0.0.13

* minor improvements

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
