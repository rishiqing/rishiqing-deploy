import Upload    from '../../common/upload';
import FtpClient from 'ftp';
import path      from 'path';

const existPathMap = {}; // 用来缓存被验证过已经存在的路径，再次验证的时候，就不用再调用ftp的接口了

class Ftp extends Upload {
  get uploadType () {
    return 'ftp';
  }
  constructor (param, options) {
    super(param, options);
  }

  getFtp (ftpConfig) {
    return new Promise( (resolve) => {
      const ftp = new FtpClient();
      ftp.on('ready', function () {
        resolve(ftp);
      })
      ftp.connect(ftpConfig);
    });
  }

  isPathExist (path) {
    return new Promise((resolve) => {
      this.ftp.list(path, function (err) {
        if (err && err.code === 550) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  mkdir (path) {
    return new Promise((resolve) => {
      this.ftp.mkdir(path, true, function () {
        resolve();
      });
    });
  }

  async ftpPathExistAndMkdir (path) {
    if (existPathMap[this.ftp.options.host].indexOf(path) === -1) {
      const exist = await this.isPathExist(path);
      if (!exist) {
        await this.mkdir(path);
      }
      existPathMap[this.ftp.options.host].push(path);
    }
  }

  putFile (file, destPath, key) {
    return new Promise(async (resolve, reject) => {
      const destFilePath = path.join(destPath, key);
      const result = path.parse(destFilePath); // root, dir, base, ext, name
      await this.ftpPathExistAndMkdir(result.dir);
      this.ftp.put(file.file.path, destFilePath, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve(file.key);
        }
      })
    });
  }

  // 重命名
  rename (one, to) {
    return new Promise((resolve) => {
      this.ftp.rename(one, to, (err) => {
        if (err) {
          resolve(err.message);
        } else {
          resolve();
        }
      });
    });
  }

  async upload (file, key) {
    try {
      await this.putFile(file, this.param.path, key);
      this.uploadNotify(key);
    } catch (e) {
      // console.log('e', e);
      process.stdout.write(e.message + ' : ' + file.file.path);
    }
  }

  async resource () {
    this.ftp = await this.getFtp(this.param);
    existPathMap[this.param.host] = existPathMap[this.param.host] || [];
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, file.key);
      count++;
      process.stdout.write(`ftp process: ${count}/${this.options.files.length}\n`);
    }
    this.ftp.end();
    this.uploadEndNotify();
  }

  async fileReplace () {
    this.ftp = await this.getFtp(this.param);
    existPathMap[this.param.host] = existPathMap[this.param.host] || [];
    const {one, to} = this.getFileReplaceData();
    await this.rename(one, to);
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, file.key);
      count++;
      process.stdout.write(`ftp process: ${count}/${this.options.files.length}\n`);
    }
    this.ftp.end();
    this.uploadEndNotify();
  }
}

export default Ftp;
