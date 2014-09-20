/* Copyright (c) 2014 Richard Rodger, MIT License */
"use strict";




var _        = require('underscore')
var lrucache = require('lru-cache')


var batch_process = require('./batch_process')

var error = require('eraro')({package:'seneca-run',msgmap:{
  unknown_batch: "Unknown batch process name <%=name%>. Known names are <%=known%>",
}})


module.exports = function( options ) {
  var seneca = this
  var plugin = 'run'

  var so = seneca.options()


  options = seneca.util.deepextend({
    batch:        {},
    history_size: 9999,
    idlen:        6,
  },options)
  
  var idgen = nid({length:options.idlen})

  var batch    = {}
  var inflight = {}
  var history  = lrucache({max:options.history_size})


  _.each( options.batch, function(v,k){
    v.name = k
    batch[k] = batch_process(v)
  })


  seneca.add({
    role: plugin,
    cmd:  'execute',
    name: {string$:true,required$:true}
  }, cmd_execute)


  seneca.add({
    role:   plugin,
    cmd:    'query',
    procid: {string$:true,required$:true}
  }, cmd_query)


  seneca.add({
    role: plugin,
    cmd:  'report',
  }, function(args,done){done()})


  
  function cmd_execute( args, done ) {
    var seneca = this
    var name   = args.name
    
    if( !batch[name] ) return done(error('unknown-process',
                                         {name:name,known:_.keys(batch)}));

    batch[name].run(function(err,proc){
      if( err ) return done(err);

      inflight[proc.procid] = proc

      proc.on('report', function(report) {

        if( report.final ) {
          history.set(proc.procid,report)
          delete inflight[proc.procid]
        }
        else {
          inflight[proc.procid] = report
        }

        seneca.act({role:plugin,cmd:'report',procid:proc.procid,report:report})
      })
    })
  }


  function cmd_query( args, done ) {
    var seneca = this

    var procid = args.procid

    var report = inflight[procid] || history.get(procid)
    return done(null,report)
  }


  return {
    name: plugin,
  }
}
