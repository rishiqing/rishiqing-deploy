import Yml    from 'yml';
class Config {
  constructor (options) {
    this.ymlPath = options.yml || '.rishiqing-deploy.yml';
    this.env     = options.env || process.env.NODE_ENV;
  }
  // 从yml文件解析配置参数
  parseYml () {
    const data = Yml.load(this.ymlPath, this.env);
    return data;
  }
}

export default Config;
