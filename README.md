seneca-run - a [Seneca](http://senecajs.org) plugin
======================================================

## Seneca Run Plugin

This plugin runs and manages external processes. It maintains a table
of named processes and process options.

The [batch-process](http://github/rjrodger/batch-process) module is
used to execute the external processes. Refer to that module for the
options to use in the batch option below. Note that that module
generates log files on disk, which you will need to cleanup
periodically in production.

The status of running processes are provided via the
_role:run,info:report_ pattern, which you should implement using
_seneca.add_.

[![Build Status](https://travis-ci.org/rjrodger/seneca-run.png?branch=master)](https://travis-ci.org/rjrodger/seneca-run)

[![NPM](https://nodei.co/npm/seneca-run.png)](https://nodei.co/npm/seneca-run/)
[![NPM](https://nodei.co/npm-dl/seneca-run.png)](https://nodei.co/npm-dl/seneca-run/)

For a gentle introduction to Seneca itself, see the
[senecajs.org](http://senecajs.org) site.

If you're using this plugin module, feel free to contact me on twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

Current Version: 0.1.1

Tested on: Seneca 0.5.20, Node 0.10.31


### Install

To install:

```sh
npm install seneca-run
```


## Quick Example

```js
var seneca = require('seneca')()
  .use('run',{
    batch:{
      'basic-ls':{
        command:'ls',
        args:['-lisa'],
        cwd:__dirname
      }
    }
  })

// subscribe to the reporting pattern
seneca.sub('role:run,info:report',function(args){
  if( 'basic-ls' == args.report.name ) {
    console.log(args.report)
  }
})
  
seneca.act('role:run,cmd:execute,name:basic-ls',console.log)
```



## Usage

Define your batch processes as options to the plugin. Then call the
pattern _role:run,cmd:execute_ to run them. The result object contains
a _procid_ field which you can use to query the status of a process
with the _role:run,cmd:query,procid:?_ pattern.

To receive reports of the status as it runs, subscribe to the
_role:run,info:report_ pattern. This will give you reports of all
running processes. To narrow it down to one process, include the name
of the process in the pattern:

```js
// see test/npm-all.js
seneca.sub('role:run,info:report,name:npm-all',function(args,done){
  console.log(args.report)
})
```

For usage in a micro-service context, see
[nodezoo-npm-all](http://github.com/rjrodger/nodezoo-npm-all).


## Options

The options are:
  
   * _batch_: Object. Keys are the names of processes. Values are options for batch-process.



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

   * 0.1.0: initial release




