import Upload         from '../../common/upload';
import { OSS }        from 'aliyun-sdk';
import ALY_OSS_STREAM from 'aliyun-oss-upload-stream';
import guessType      from 'guess-content-type';
import path           from 'path';
import fs             from 'fs';

function ossUpload (upload) {
  return new Promise(function (resolve, reject) {
    upload.on('error', reject);
    upload.on('part', function (part) {
      process.stdout.write(`aliyunOss part ${part.PartNumber}\n`);
    });
    upload.on('uploaded', resolve);
  });
}


class AliyunOss extends Upload {
  get uploadType () {
    return 'aliyunOss';
  }
  constructor (param, options) {
    super(param, options);
    this.oss = new OSS({
      accessKeyId: this.param.accessKeyId,
      secretAccessKey: this.param.secretAccessKey,
      endpoint: this.param.endpoint,
      apiVersion: '2013-10-15'
    });
    this.ossStream = ALY_OSS_STREAM(this.oss);
  }
  async upload (file, key) {
    const _key = path.join(this.param.prefix, key).replace(/\\/g, '/');
    const data = {
      Bucket: this.param.bucket,
      Key: _key,
      ContentType: guessType(_key)
    };
    if (file.file.isGzip) {
      data.ContentEncoding = 'gzip';
    }
    const uploader = this.ossStream.upload(data);
    uploader.minPartSize(4194304); // 每4M分一块
    const read = fs.createReadStream(file.file.path);
    read.pipe(uploader);
    await ossUpload(uploader);
    this.uploadNotify(key);
    this.addStatistics(file.file, { distPath: this.options.distPath });
  }
  // 重命名
  async rename (one, to) {
    await this.copy(one, to);
  }

  // 从one copy 到 to
  async copy (one, to) {
    return new Promise((resolve) => {
      const source = path.join('/', this.param.bucket, one).replace(/\\/g, '/'); // 把路径中的\替换成/，这是由于windows系统下，会有\出现，导致在oss上找不到对应的文件
      this.oss.copyObject({
        Bucket: this.param.bucket,
        CopySource: source,
        Key: to.replace(/\\/g, '/')
      }, (err) => {
        if (err) {
          process.stdout.write(err.message + '\n');
        }
        resolve();
      });
    });
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
