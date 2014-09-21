/* Copyright (c) 2014 Richard Rodger */
"use strict";


// mocha run.test.js


var assert  = require('assert')

var seneca = require('seneca')

describe('run', function() {

  it('basic-ls', function(fin){
    var si = seneca({log:'silent',timeout:555})
    si.use('../run.js',{
      batch:{
        'basic-ls':{
          command:'ls',
          args:['-lisa'],
          cwd:__dirname,
          timeout:333
        }
      }
    })

    si.add('role:run,info:report',function(args,done){
      this.prior(done);

      if( args.report.error ) return fin(args.report.error)

      if( args.report.final ) {
        assert.ok( -1 < args.report.stdout.indexOf('run.test.js'))
        return fin();
      }
    })
    
    si.act('role:run,cmd:execute,name:basic-ls',function(err,out){
      if(err) return fin(err)
      assert.equal(out.name,'basic-ls')
      assert.ok(0<out.procid.length)
    })
  })

})
