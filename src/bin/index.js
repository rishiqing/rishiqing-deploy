#!/usr/bin/env node
import Config    from '../config';
import { argv }  from 'yargs';
import Main      from '../main';

const path   = argv.config || '.rishiqing-deploy.yml';
const env    = argv.env;
const config = new Config({ yml: path, env }).parseYml();
const main = new Main({ config });
main.exec();
