import Upload    from '../../common/upload';
import { spawn } from 'child_process';
import path      from 'path';
const existPathMap = {};
class Ssh2 extends Upload {
  get uploadType () {
    return 'ssh2';
  }
  constructor (param, options) {
    super(param, options);
    this.init();
  }

  isPathExist (_path) {
    return new Promise((resolve) => {
      const p = this.constructor.format(_path);
      const child = spawn('ssh', [`${this.param.user}@${this.param.host}`, `stat ${p}`]);
      child.stdout.on('data', () => {
        resolve(true);
      });
      child.stderr.on('data', () => {
        resolve(false);
      });
    });
  }

  mkdir (_path) {
    return new Promise((resolve, reject) => {
      const p = this.constructor.format(_path);
      const child = spawn('ssh', [`${this.param.user}@${this.param.host}`, `mkdir -p ${p}`]);
      child.on('close', (code) => {
        if (!code) {
          resolve();
        } else {
          reject(code);
        }
      });
    });
  }

  rename (one, to) {
    const _one = this.constructor.format(one);
    const _to  = this.constructor.format(to);
    return new Promise((resolve) => {
      const child = spawn('ssh', [`${this.param.user}@${this.param.host}`, `mv ${_one} ${_to}`]);
      child.on('close', (code) => {
        resolve(code);
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

  async putFile (file, destPath, key) {
    return new Promise(async (resolve, reject) => {
      const destFilePath = path.join(destPath, key);
      const result = path.parse(destFilePath); // root, dir, base, ext, name
      await this.ftpPathExistAndMkdir(result.dir);
      const _destFilePath = this.constructor.format(destFilePath);
      const child = spawn('scp', ['-q', file.file.path, `${this.param.user}@${this.param.host}:${_destFilePath}`], { stdio: 'inherit' });
      child.on('exit', (code) => {
        if (!code) {
          resolve();
        } else {
          reject(code);
        }
      });
    });
  }

  async upload (file, key) {
    try {
      await this.putFile(file, this.param.path, key);
      this.uploadNotify(key);
      this.addStatistics(file.file, { distPath: this.options.distPath });
    } catch (e) {
      process.stdout.write(e.message + ' : ' + file.file.path);
    }
  }

  init () {
    existPathMap[this.param.host] = existPathMap[this.param.host] || [];
  }

  async resource () {
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, file.key);
      count++;
      process.stdout.write(`ssh2 process: ${count}/${this.options.files.length}\n`);
    }
    this.uploadEndNotify();
  }

  async fileReplace () {
    const {one, to} = this.getFileReplaceData();
    await this.rename(one, to);
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, file.key);
      count++;
      process.stdout.write(`ssh2 process: ${count}/${this.options.files.length}\n`);
    }
    this.uploadEndNotify();
  }
}

export default Ssh2;
