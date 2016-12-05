import Notify        from '../common/notify';
import child_process from 'child_process';
import _             from 'lodash';

const spawn = child_process.spawn;

function promiseFromChildProcess (child) {
  return new Promise( function (resolve, reject) {
    child.on('error', function (err) {
      reject(err);
    });
    child.on('exit', function (code) {
      if (code) {
        reject(code);
      } else {
        resolve(code);
      }
    });
  });
}
class Build extends Notify {
  constructor (opt) {
    super(opt);
    this.list =_.isArray(opt) ? opt : [opt];
  }

  async exec () {
    for (const command of this.list) {
      if (command && typeof command === 'string') {
        const c = command.split(' ')[0];
        const arg = command.split(' ').slice(1);
        const p = spawn(c, arg, { stdio: 'inherit' });
        await promiseFromChildProcess(p);
        this.oneBuildNotify(command);
      }
    }
    if (this.list.length) {
      this.afterBuildNotify();
    }
  }
}

export default Build;
