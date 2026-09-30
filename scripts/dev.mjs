import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync } from 'node:fs';
if(existsSync('.env'))process.loadEnvFile('.env');
const env={...process.env,TOKEN_SECRET:process.env.TOKEN_SECRET ?? randomBytes(32).toString('hex'),INTERNAL_SECRET:process.env.INTERNAL_SECRET ?? randomBytes(32).toString('hex')};
const children=['users','catalog','orders','payments','notifications'].map(name=>spawn(process.execPath,[`services/${name}/main.mjs`],{env,stdio:'inherit'}));
children.push(spawn(process.execPath,['gateway/main.mjs'],{env,stdio:'inherit'}));
let stopping=false;function stop(){if(stopping)return;stopping=true;for(const child of children)child.kill();}
process.on('SIGINT',stop);process.on('SIGTERM',stop);for(const child of children)child.on('exit',code=>{if(!stopping){process.exitCode=code || 1;stop();}});
console.log('Abre http://localhost:8080 — Ctrl+C detiene todos los servicios.');
