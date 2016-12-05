import Upload     from '../../common/upload';
import { Client } from 'ssh2';
import path       from 'path';

const existPathMap = {}; // 用来缓存被验证过已经存在的路径，再次验证的时候，就不用再调用ftp的接口了

class Sftp extends Upload {
  get uploadType () {
    return 'sftp';
  }
  constructor (param, options) {
    super(param, options);
  }

  getClient (config) {
    return new Promise( function (resolve) {
      const client = new Client();
      client.on('ready', function () {
        resolve(client);
      }).connect(config);
    });
  }

  getSftp (client) {
    return new Promise(function (resolve, reject) {
      client.sftp(function (err, sftp) {
        if (err) {
          reject(err);
        } else {
          resolve(sftp);
        }
      });
    });
  }

  isPathExist (_path) {
    return new Promise((resolve) => {
      this.sftp.stat(_path, function (err) {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  mkdir (_path) {
    return new Promise((resolve, reject) => {
      this.client.exec('mkdir -p ' + _path, function (err) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async ftpPathExistAndMkdir (_path) {
    if (existPathMap[this.param.host].indexOf(_path) === -1) {
      const exist = await this.isPathExist(_path);
      if (!exist) {
        await this.mkdir(_path);
      }
      existPathMap[this.param.host].push(_path);
    }
  }

  putFile (file, destPath, key) {
    return new Promise(async (resolve, reject) => {
      const destFilePath = path.join(destPath, key);
      const result = path.parse(destFilePath); // root, dir, base, ext, name
      await this.ftpPathExistAndMkdir(result.dir);
      this.sftp.fastPut(file.file.path, destFilePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 重命名
  rename (one, to) {
    return new Promise((resolve) => {
      this.sftp.rename(one, to, (err) => {
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
      process.stdout.write(e.message + ' : ' + file.file.path);
    }
  }

  async init () {
    this.client = await this.getClient(this.param);
    this.sftp = await this.getSftp(this.client);
    existPathMap[this.param.host] = existPathMap[this.param.host] || [];
  }

  async resource () {
    await this.init();
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, file.key);
      count++;
      process.stdout.write(`sftp process: ${count}/${this.options.files.length}\n`);
    }

    this.client.end();
    this.uploadEndNotify();
  }

  async fileReplace () {
    await this.init();
    const {one, to} = this.getFileReplaceData();
    await this.rename(one, to);
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, this.options.target);
      count++;
      process.stdout.write(`sftp process: ${count}/${this.options.files.length}\n`);
    }

    this.client.end();
    this.uploadEndNotify();
  }
}

export default Sftp;
