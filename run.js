/* Copyright (c) 2014 Richard Rodger, MIT License */
"use strict";




var _        = require('underscore')
var nid      = require('nid')
var lrucache = require('lru-cache')


var batch_process = require('batch-process')


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
    procs:        {},
  },options)
  

  var idgen = nid({length:options.idlen})


  var inflight = {}
  var history  = lrucache({max:options.history_size})

  var batch = {}
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
    info:  'report',
  }, function(args,done){done()})


  
  function cmd_execute( args, done ) {
    var seneca = this
    var name   = args.name
    
    if( !batch[name] ) return done(error('unknown-process',
                                         {name:name,known:_.keys(batch)}));

    var proc = batch[name].make_process( args.spec )

    proc.on('report', function(report) {

      if( report.final ) {
        history.set(proc.procid,report)
        delete inflight[proc.procid]
      }
      else {
        inflight[proc.procid] = report
      }
      
      seneca.act({
        role:plugin,
        info:'report',
        name:name,
        procid:proc.procid,
        report:report
      })
    })


    proc.run()
    inflight[proc.procid] = proc

    done(null,{procid:proc.procid,name:args.name})
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
