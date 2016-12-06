import CommonNotify from './notify';
import path from 'path';
class Upload extends CommonNotify {
  // 过滤语法
  static format (c) {
    return c.replace(/\s/g, '\\ ').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }
  get uploadType () {
    return 'upload';
  }
  constructor (param, options) {
    super(param, options);
    this.param = param;
    this.options = options;
  }

  getFileReplaceData () {
    const prefix = this.param.path || this.param.prefix;
    const result = path.parse(this.options.target);
    const one = path.join(prefix, this.options.target);
    const base = result.name + '_' + (new Date()).getTime() + result.ext
    const to = path.join(prefix, path.format({ dir: result.dir, base: base }));
    return { one, to };
  }
  // 每一次upload一个文件的时候，就会触发
  uploadNotify (name) {
    this.oneFileUploadNotify(`${this.uploadType}[${this.param.host || this.param.bucket}] : ${name}`);
  }
  // 当upload全部结束的时候，触发
  uploadEndNotify () {
    this.oneUploadNotify(`${this.uploadType}[${this.param.host || this.param.bucket}]`);
  }
}

export default Upload;
