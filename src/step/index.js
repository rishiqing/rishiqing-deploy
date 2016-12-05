import Build       from '../build';
import Resource    from '../resource';
import FileReplace from '../fileReplace';
const order = ['build', 'resource', 'fileReplace', 'endBuild'];
class Step {
  constructor (props) {
    this.config = props.config;
  }
  // 执行命令
  async build (param) {
    const build = new Build(param);
    await build.exec();
  }
  // 资源上传
  async resource (param) {
    const resource = new Resource(param);
    await resource.exec();
  }
  // 资源替换
  async fileReplace (param) {
    const fileReplace = new FileReplace(param);
    await fileReplace.exec();
  }
  // 结束时执行命令
  async endBuild (param) {
    const build = new Build(param);
    await build.exec();
  }
  // 开始执行
  async exec () {
    for (const item of order) {
      const fn = this[item];
      const params = this.config[item];
      if (fn && typeof fn === 'function' && params) {
        await fn.call(this, params);
      }
    }
  }
}

export default Step;
