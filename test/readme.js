var seneca = require('seneca')()
  .use('../run.js',{
    batch:{
      'basic-ls':{
        command:'ls',
        args:['-lisa'],
        cwd:__dirname
      }
    }
  })

seneca.sub('role:run,info:report',function(args,done){
  if( 'basic-ls' == args.report.name ) {
    console.log(args.report)
  }
})

seneca.act('role:run,cmd:execute,name:basic-ls',console.log)
