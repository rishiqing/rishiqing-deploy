import Yml           from 'yml';

class Config {
  constructor (options) {
    this.ymlPath = options.yml || '.rishiqing-deploy.yml';
    this.env     = options.env || process.env.NODE_ENV;
  }
  // 从yml文件解析配置参数
  parseYml () {
    const c = Yml.load(this.ymlPath, this.env);
    // 替换${KEY} 包裹的环境变量
    const NotFoundMap = {};
    const dataString = JSON.stringify(c).replace(/\$\{([^\{\}]+)\}/g, (match, key) => { // eslint-disable-line
      if (process.env[key] === undefined) {
        NotFoundMap[key] = true;
      }
      return process.env[key];
    });
    // 找不到环境变量，直接退出
    const NotFoundList = Object.keys(NotFoundMap);
    if (NotFoundList.length > 0) {
      process.stdout.write(`Error: ${NotFoundList.join()} environment not found\n`);
      process.exit(1);
    }
    return JSON.parse(dataString);
  }
}

export default Config;
