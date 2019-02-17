import Upload         from '../../common/upload';
import OSS            from 'ali-oss';
import guessType      from 'guess-content-type';
import path           from 'path';
import fs             from 'fs';

class AliyunOss extends Upload {
  get uploadType () {
    return 'aliyunOss';
  }
  constructor (param, options) {
    super(param, options);
    this.oss = new OSS({
      accessKeyId: this.param.accessKeyId,
      accessKeySecret: this.param.accessKeySecret || this.param.secretAccessKey,
      region: this.param.region,
      endpoint: this.param.endpoint, // endpoint takes priority over region
      apiVersion: '2013-10-15',
      bucket: this.param.bucket
    });
  }
  async upload (file, key) {
    const _key = path.join(this.param.prefix, key).replace(/\\/g, '/');
    const headers = {
      'Content-Type': guessType(_key)
    }
    if (file.file.isGzip) {
      headers['Content-Encoding'] = 'gzip';
    }
    await this.oss.put(_key, fs.createReadStream(file.file.path), {
      headers
    });
    this.uploadNotify(key);
    this.addStatistics(file.file, { distPath: this.options.distPath });
  }
  // 重命名
  async rename (one, to) {
    await this.copy(one, to);
  }

  // 从one copy 到 to
  async copy (one, to) {
    const name = to.replace(/\\/g, '/')
    const source = path.join('/', this.param.bucket, one).replace(/\\/g, '/'); // 把路径中的\替换成/，这是由于windows系统下，会有\出现，导致在oss上找不到对应的文件
    try {
      await this.oss.copy(name, source)
    } catch(e) {
      process.stdout.write(`${e.message} : ${one}\n`)
    }
  }

  async resource () {
    let count = 0;
    for (const file of this.options.files) {
      await this.upload(file, file.key);
      count++;
      process.stdout.write(`aliyunOss process: ${count}/${this.options.files.length}\n`);
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
      process.stdout.write(`aliyunOss fileReplace process: ${count}/${this.options.files.length}\n`);
    }
    this.uploadEndNotify();
  }
}

export default AliyunOss;
