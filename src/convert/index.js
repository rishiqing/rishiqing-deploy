import Notify   from '../common/notify';
import _        from 'lodash';
import Yml      from 'yml';
import FileUtil from '../utils/file';

class Convert extends Notify {
  constructor (opt) {
    super();
    this.list =_.isArray(opt) ? opt : [opt];
  }

  async yml (t, d) { // target, dest
    const data = Yml.load(t);
    FileUtil.createFile(d, JSON.stringify(data));
  }

  async exec () {
    for (const command of this.list) {
      const file = new FileUtil(command.target).file;
      if (file) {
        const ext = file.getExtnameWithoutDot();
        if (this[ext]) {
          this[ext](command.target, command.dest);
        }
      }
    }
    if (this.list.length) {
      this.afterConvertNotify();
    }
  }
}

export default Convert;
