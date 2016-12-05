import Yml    from 'yml';
class Config {
  constructor (options) {
    this.ymlPath = options.yml || '.rishiqing-deploy.yml';
  }
  // 从yml文件解析配置参数
  parseYml () {
    const data = Yml.load(this.ymlPath);
    return data;
  }
}

export default Config;
