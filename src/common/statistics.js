
class Statistics {
  static getFileSize (bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const radix = Math.floor(Math.log(bytes) / Math.log(1024));
    const i = parseInt(radix, 10);
    return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
  }
  static analyze (store = []) {
    const brief = this.brief(store);
    return brief;
  }

  // 生成概要
  static brief (store) {
    const data = { count: 0, size: 0, fileType: {}, max: { size: 0, name: '' } };
    store.reduce(function (prev, item) {
      prev.count += 1;
      prev.size  += item.size;

      if (item.size > prev.max.size) {
        prev.max.size = item.size;
        prev.max.name = item.name;
      }

      if (!prev.fileType[item.type]) { prev.fileType[item.type] = { count: 0, size: 0, max: { size: 0, name: '' } }; }
      prev.fileType[item.type].count += 1;
      prev.fileType[item.type].size  += item.size;
      if (item.size > prev.fileType[item.type].max.size) {
        prev.fileType[item.type].max.size = item.size;
        prev.fileType[item.type].max.name = item.name;
      }
      return prev;
    }, data);
    const fileTypeList = Object.keys(data.fileType);
    const as = this.getFileSize(data.size / data.count); // average size
    let str = `brief: count ${data.count}, size ${this.getFileSize(data.size)}, average-size ${as}; max: size ${this.getFileSize(data.max.size)}, name ${data.max.name}`;
    fileTypeList.forEach((type) => {
      const item = data.fileType[type];
      const ias = this.getFileSize(item.size / item.count); // item average size
      str += `\n    ${type}: ` + `count ${item.count}, size ${this.getFileSize(item.size)}, average-size ${ias}; max: size ${this.getFileSize(item.max.size)}, name ${item.max.name}`;
    });
    return str;
  }
}

export default Statistics;
