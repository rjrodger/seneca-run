/* Copyright (c) 2014 Richard Rodger, MIT License */
"use strict";


// TODO: docs, error review

var events = require('events')
var fs     = require('fs')
var spawn  = require('child_process').spawn
var stream = require('stream')
var util   = require('util')

var _      = require('underscore')
var nid    = require('nid')
var mkdirp = require('mkdirp')


var error = require('eraro')({package:'batch-process',msgmap:{
}})


module.exports = function( spec ) {
  var batcher = new Batcher(spec)
  return batcher;
}


function LimitedCaptureStream( options ) {
  stream.Writable.call(this,options)
  this.options = options
  this.buffer = new Buffer( options.capture_size )
  this.full  = false
  this.index = 0
  this.count = 0
}
util.inherits(LimitedCaptureStream,stream.Writable)

LimitedCaptureStream.prototype.get = function(){
  return this.buffer.toString(null,0,this.index)
}

LimitedCaptureStream.prototype._write = function( chunk, encoding, done ) {
  if( this.full ) return done();

  this.count += chunk.length

  var amount = Math.min(chunk.length,this.options.capture_size-this.index)

  chunk.copy(
    this.buffer,
    this.index,
    0,
    amount)

  this.index += amount
  this.full = this.index >= this.options.size

  return done();
}




function Process( spec ) {
  events.EventEmitter.call(this)

  var self = this

  self.procid = spec.name+'-'+Date.now()+'-'+nid()
  self.status = 'init'

  var capture_stdout
  var capture_stderr

  self.stdout = function() {
    return capture_stdout ? capture_stdout.get() : ''
  }

  self.stderr = function() {
    return capture_stderr ? capture_stderr.get() : ''
  }

  self.run = function() {

    if( spec.record ) {
      var record_folder = spec.record_folder+'/'+self.procid

      mkdirp( record_folder, function(err){
        if(err) {
          self.emit('report',{
            name:   spec.name,
            procid: self.procid,
            spec:   spec,
            error:  err,
            start:  start,
            now:    Date.now(),
          })
          return;
        }
        
        var ctxt = {}
        ctxt.record_stdout = fs.createWriteStream( record_folder+'/stdout' )
        ctxt.record_stderr = fs.createWriteStream( record_folder+'/stderr' )

        return do_spawn(ctxt);
      })
    }
    else return do_spawn({});
   

    function do_spawn( ctxt ) {
      var start = Date.now()
      var processTimeout, reportInterval

      var proc = spawn( spec.command, spec.args, {
        cwd: spec.cwd,
        env: spec.env,
        uid: spec.uid,
        gid: spec.gid,
      })

      self.status = 'running'

      if( spec.record ) {
        proc.stdout.pipe( ctxt.record_stdout )
        proc.stderr.pipe( ctxt.record_stderr )
      }

      capture_stdout = new LimitedCaptureStream( {capture_size:spec.capture_size} ) 
      capture_stderr = new LimitedCaptureStream( {capture_size:spec.capture_size} ) 

      proc.stdout.pipe( capture_stdout )
      proc.stderr.pipe( capture_stderr )

      proc.on('error',function(err){
        if( processTimeout ) clearTimeout(processTimeout);
        if( reportInterval ) clearInterval(reportInterval);

        // TODO: need an 'error' emit as well
        self.emit('report',{
          name:   spec.name,
          procid: self.procid,
          spec:   spec,
          error:  err,
          start:  start,
          now:    Date.now(),
          stdout: capture_stdout.get(),
          stderr: capture_stderr.get(),
          stdout_size: capture_stdout.count,
          stderr_size: capture_stderr.count,
        })
      })

      proc.on('close',function(code,signal){
        if( processTimeout ) clearTimeout(processTimeout);
        if( reportInterval ) clearInterval(reportInterval);

        var timeout = 'timeout' == self.status

        //proc.stdout.flush()
        //proc.stderr.flush()

        self.status = 'finished'
        self.emit('report',{
          name:    spec.name,
          procid:  self.procid,
          spec:    spec,
          code:    code,
          signal:  signal,
          final:   true,
          timeout: timeout,
          start:   start,
          now:     Date.now(),
          stdout:  capture_stdout.get(),
          stderr:  capture_stderr.get(),
          stdout_size: capture_stdout.count,
          stderr_size: capture_stderr.count,
        })
      })

      if( 0 < spec.report_interval ) {
        reportInterval = setInterval(function(){

          if( 'running' == self.status ) {
            self.emit('report',{
              name:   spec.name,
              procid: self.procid,
              spec:   spec,
              start:  start,
              now:    Date.now(),
              stdout: capture_stdout.get(),
              stderr: capture_stderr.get(),
              stdout_size: capture_stdout.count,
              stderr_size: capture_stderr.count,
            })
            
          }
          else clearInterval(reportInterval)
        },spec.report_interval)
      }

      if( 0 < spec.timeout ) {
        processTimeout = setTimeout(function(){
          if( 'running' == self.status ) {
            self.status = 'timeout'
            proc.kill(spec.kill_signal)
          }
        },spec.timeout)
      }
    }
  }
}
util.inherits(Process, events.EventEmitter)


function Batcher( spec ) {
  var self = this

  spec = _.extend({},{
    timeout:       333333, // 5.5 minutes-ish
    capture_size:  22222,   // bytes
    record_folder: '/tmp/batch_process',
    record:        true,
    kill_signal:   'SIGTERM',
    args:          []
  },spec)

  spec.name = spec.name || spec.command

  self.make_process = function( procspec ) {
    procspec = _.extend({},spec,procspec)
    return new Process( procspec )
  }

  return self;
}
