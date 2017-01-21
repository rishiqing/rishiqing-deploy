import Util_File    from '../utils/file';
import path         from 'path';
import _            from 'lodash';

class Ignore {
  constructor (props) {
    this.dist = props.dist;
    this.ignore = props.ignore || [];
    this.initIgnoreList(this.dist, this.ignore);
  }

  initIgnoreList (dist, ignore = []) {
    let pathList = [], regList = []; // pathList 用来存放路径， reg用来存放正则表达式
    for (const file of ignore) {
      let p;
      if (!file) continue;
      if (/^\/[\s\S]+\/[igm]*$/i.test(file)) { // 如果是正则表达式
        const matchs = file.match(/^\/([\s\S]+)\/([igm]*)$/i);
        const pattern = matchs[1];
        const attributes = matchs[2];
        if (typeof pattern === 'string' && typeof attributes === 'string') {
          const reg = new RegExp(pattern, attributes);
          regList.push(reg);
        }
      } else {
        if (Util_File.isDirectory(dist)) {
          p = path.resolve(dist, file);
        } else if (Util_File.isFile(dist)) {
          p = path.resolve(file);
        }
        if (Util_File.isDirectory(p)) {
          pathList = pathList.concat(_.map(Util_File.readFileList(p), 'path'));
        } else if (Util_File.isFile(p)) {
          pathList.push(p);
        }
      }
    }
    this.pathList = pathList;
    this.regList  = regList;
  }

  isNotInRegList (path) {
    let notIn = true;
    for (let i = 0; i < this.regList.length; i++) {
      const reg = this.regList[i];
      const match = reg.test(path);
      if (match) {
        notIn = false;
        break;
      }
    }
    return notIn;
  }

  isNotInPathList (path) {
    return this.pathList.indexOf(path) === -1;
  }

  isNotInIgnore (path) {
    const isNotInPathList = this.isNotInPathList(path);
    const isNotInRegList  = this.isNotInRegList(path);
    return isNotInPathList && isNotInRegList;
  }
}

export default Ignore;
