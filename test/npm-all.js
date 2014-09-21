/* Copyright (c) 2014 Richard Rodger, MIT License */
"use strict";


var seneca = require('seneca')()
  .use('../run.js',{
    batch:{
      'npm-all':{
        command:'curl',
        args:['http://registry.npmjs.org/-/all','-o','all'],
        cwd:__dirname,
        report_interval:1000
      }
    }
  })

seneca.sub('role:run,info:report,name:npm-all',function(args,done){
  console.log(args.report)
})

seneca.act('role:run,cmd:execute,name:npm-all',console.log)
