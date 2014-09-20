/* Copyright (c) 2014 Richard Rodger */
"use strict";


var batch_process = require('../batch_process.js')

var batch = batch_process({
  //command:'ls', args:['-lisa']
  command:'curl',
  args:['http://registry.npmjs.org/-/all','-o','all']
})

var proc = batch.make_process({
  report_interval:1000
})

proc.on('report',function(rep){
  console.log('REPORT',rep)
})

proc.run()
