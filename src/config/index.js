import Yml        from 'yml';

class Config {
  constructor (options) {
    this.ymlPath = options.yml || '.rishiqing-deploy.yml';
    this.env     = options.env || process.env.NODE_ENV;
  }
  // 从yml文件解析配置参数
  parseYml () {
    const c = Yml.load(this.ymlPath, this.env);
    // 替换${KEY} 包裹的环境变量
    const dataString = JSON.stringify(c).replace(/\$\{([^\{\}]+)\}/g, (match, key) => {
      return process.env[key];
    });
    return JSON.parse(dataString);
  }
}

export default Config;
