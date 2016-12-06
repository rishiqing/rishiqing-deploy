import CommonNotify from '../common/notify';
import AliyunOss    from '../upload/aliyunOss';
import Ftp          from '../upload/ftp';
import Sftp         from '../upload/sftp';
import Ssh2         from '../upload/ssh2';
import _            from 'lodash';
import path         from 'path';
import fs           from 'fs';
import Util_File    from '../utils/file';

class FileReplace extends CommonNotify {
  constructor (opt) {
    super(opt);
    this.list =_.isArray(opt) ? opt : [opt];
  }

  async aliyunOss (param, options) {
    const oss = new AliyunOss(param, options);
    await oss.fileReplace();
  }

  async ftp (param, options) {
    const ftp = new Ftp(param, options);
    await ftp.fileReplace();
  }

  async sftp (param, options) {
    const sftp = new Sftp(param, options);
    await sftp.fileReplace();
  }

  async ssh2 (param, options) {
    const ssh2 = new Ssh2(param, options);
    await ssh2.fileReplace();
  }

  getFiles (dist, ignore, target) {
    const list = [];
    const fileList = Util_File.readFileList(dist) || [];
    const ignoreList = this.initIgnoreList(dist, ignore);
    for (const file of fileList) {
      if (ignoreList.indexOf(file.path) === -1) {
        let key;
        if (Util_File.isFile(dist)) {
          if (target) {
            key = target;
          } else {
            key = file.name;
          }
        } else if (Util_File.isDirectory(dist)) {
          if (target) {
            key = path.join(target, file.path.replace(dist, ''));
          } else {
            key = file.path.replace(dist, '');
          }
        }
        list.push({ file: file, key: key });
      }
    }
    return list;
  }

  initIgnoreList (dist, ignore = []) {
    let list = [];
    for (const file of ignore) {
      let p;
      if (!file) continue;
      if (Util_File.isDirectory(dist)) {
        p = path.resolve(dist, file);
      } else if (Util_File.isFile(dist)) {
        p = path.resolve(file);
      }
      if (Util_File.isDirectory(p)) {
        list = list.concat(_.map(Util_File.readFileList(p), 'path'));
      } else if (Util_File.isFile(p)) {
        list.push(p);
      }
    }
    return list;
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
