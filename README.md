seneca-run - a [Seneca](http://senecajs.org) plugin
======================================================

## Seneca Run Plugin

This plugin runs and manages external processes. It maintains a table
of named processes and process options.

[![Build Status](https://travis-ci.org/rjrodger/seneca-run.png?branch=master)](https://travis-ci.org/rjrodger/seneca-run)

[![NPM](https://nodei.co/npm/seneca-run.png)](https://nodei.co/npm/seneca-run/)
[![NPM](https://nodei.co/npm-dl/seneca-run.png)](https://nodei.co/npm-dl/seneca-run/)

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

If you're using this plugin module, feel free to contact me on twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.1.0

Tested on: Seneca 0.5.20, Node 0.10.31


### Install

To install:

```sh
npm install seneca-run
```


## Quick Example



## Options

The options are:
  
   * _foo_: foo

These can be set within the top-level _run_ property of the main
Seneca options tree:

```js
var seneca = require('seneca')({
  run:{
    foo:'foo'
  }
})
```


## Testing

Unit tests use mocha, and can be run with:

```sh
npm test
```

For detailed logging, use:

```sh
SENECA_LOG=all npm test
```



## Releases

   * 0.1.1: initial release




