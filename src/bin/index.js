#!/usr/bin/env node
import Config    from '../config';
import { argv }  from 'yargs';
import Step      from '../step';
import Notify    from '../notify';

const path   = argv.config || '.rishiqing-deploy.yml';
const config = new Config({ yml: path }).parseYml();
const notify = new Notify({ config });
notify.init();
const step   = new Step({ config });
step.exec();
