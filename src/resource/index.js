import DealFile     from '../common/dealFile';
import _            from 'lodash';
import path         from 'path';
import fs           from 'fs';
class Resource extends DealFile {
  get type () {
    return 'resource';
  }

  constructor (opt) {
    super(opt);
    this.list =_.isArray(opt) ? opt : [opt];
  }

  async exec () {
    for (const dest of this.list) {
      const dist       = dest.dist;
      const ignore     = dest.ignore;
      const uploadDest = dest.upload;
      if (dist && typeof dist === 'string' && uploadDest && _.isArray(uploadDest)) {
        try {
          const distPath = path.resolve(dist);
          fs.lstatSync(distPath); // 检测这个文件或者目录是否存在
          for (const upload of uploadDest) {
            await this.execUpload(upload, { distPath, ignore });
          }
        } catch (e) {
          process.stdout.write(`${e.message}\n`);
        }
      }
      this.oneResourceNotify(dest.dist);
    }
    if (this.list.length) {
      this.resourceNotify('all resource uploaded');
    }
  }
}

export default Resource;
