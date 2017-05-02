import CommonNotify from './notify';
import IgnoreUtil   from './ignore';
import AliyunOss    from '../upload/aliyunOss';
import Ftp          from '../upload/ftp';
import Sftp         from '../upload/sftp';
import Ssh2         from '../upload/ssh2';
import Util_File    from '../utils/file';
import path         from 'path';

const Uploaders = {
  aliyunOss: AliyunOss,
  ftp: Ftp,
  sftp: Sftp,
  ssh2: Ssh2
};

class DealFile extends CommonNotify {
  get type () {
    return ''; // resource | fileReplace
  }

  async execUpload (uploadConfig, options = {}) {
    const uploaderType = uploadConfig.type;
    const param = uploadConfig.param;
    if (Uploaders[uploaderType]) {
      const { distPath, ignore, target } = options;
      const files = this.getFiles(distPath, ignore, target);
      const uploader = new Uploaders[uploaderType](param, { files, target });
      await uploader[this.type]();
    }
  }

  getFiles (dist, ignore, target) { // target 用来指定文件上传到服务器之后的名字
    const list = [];
    const fileList = Util_File.readFileList(dist) || [];
    const ignoreUtil = new IgnoreUtil({ dist, ignore });
    for (const file of fileList) {
      if (ignoreUtil.isNotInIgnore(file.path)) {
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
}

export default DealFile;
