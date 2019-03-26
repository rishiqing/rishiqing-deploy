import Build        from '../build';
import Resource     from '../resource';
import FileReplace  from '../fileReplace';
import Convert      from '../convert';
import Notify       from '../notify';
import Upload       from '../common/upload';
import Statistics   from '../common/statistics';
import DeployLog    from '../common/deployLog';
import CommonNotify from '../common/notify';

const order = ['build', 'convert', 'resource', 'fileReplace', 'endBuild'];
class Step extends CommonNotify {
  constructor (props) {
    super(props);
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
  async convert (param) {
    const convert = new Convert(param);
    await convert.exec();
  }
  // 开始执行
  async exec () {
    try {
      const notify = new Notify({ config: this.config });
      notify.init();
      for (const item of order) {
        const fn = this[item];
        const params = this.config[item];
        if (fn && typeof fn === 'function' && params) {
          await fn.call(this, params);
        }
      }
      this.statisticsNotify(Statistics.analyze(Upload.UploadFileStatistics || []));
      try {
        const logs = await DeployLog.getLog(this.config.deployLog)
        this.deployLogNotify(logs);
      } catch(e) {
        console.error('deployLogNotify error: ', e.message, e); // eslint-disable-line
      }
      this.successNotify();
    } catch(e) {
      console.error(e); // eslint-disable-line
      process.exit(1);
    }
  }
}

export default Step;
