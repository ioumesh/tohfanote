import {spawn} from 'node:child_process';
const build=spawn('npm',['run','build'],{stdio:'inherit'});build.on('exit',code=>{if(code)process.exit(code);const serve=spawn('node',['scripts/serve.mjs'],{stdio:'inherit'});for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>serve.kill(signal));});
