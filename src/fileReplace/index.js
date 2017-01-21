import DealFile     from '../common/dealFile';
import _            from 'lodash';
import path         from 'path';
import fs           from 'fs';

class FileReplace extends DealFile {
  get type () {
    return 'fileReplace';
  }

  constructor (opt) {
    super(opt);
    this.list =_.isArray(opt) ? opt : [opt];
  }

  async exec () {
    for (const dest of this.list) {
      const dist       = dest.dist;
      const ignore     = dest.ignore;
      const target     = dest.target;
      const uploadDest = dest.upload;
      if (dist && typeof dist === 'string' && uploadDest && _.isArray(uploadDest)) {
        try {
          const distPath = path.resolve(dist);
          fs.lstatSync(distPath); // 检测这个文件或者目录是否存在
          for (const upload of uploadDest) {
            const fn = this[upload.type];
            const param = upload.param;
            if (fn && typeof fn === 'function') {
              const files = this.getFiles(distPath, ignore, target);
              await fn.call(this, param, { files, target });
            }
          }
        } catch (e) {
          process.stdout.write(e.message);
        }
      }
      this.oneFileReplaceNotify(target);
    }
    if (this.list.length) {
      this.fileReplaceNotify();
    }
  }
}

export default FileReplace;
