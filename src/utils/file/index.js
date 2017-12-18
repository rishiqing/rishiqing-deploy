/*
* @Author: apple
* @Date:   2016-01-15 12:11:47
* @Last Modified by:   qinyang
* @Last Modified time: 2017-12-18 10:53:46
*/

import File from './file';
import fs   from 'fs';
import path from 'path';

class Index {
  constructor (config) {
    const isOk = this._isConfigOk(config);
    this.file  = null;
    if (isOk.path) {
      this.file = new File(isOk);
    }
  }
  // public

  // 以_开头的方法都是私有方法 privite
  // 判断config里的参数是否正确
  _isConfigOk (config) {
    let p = '';
    if (!config) return false;
    if (typeof config === 'string') {
      p = config;
    } else if (typeof config === 'object') {
      p = config.path;
    }
    if (typeof p !== 'string') {
      return false;
    }
    this.path = p;
    const stat = Index.isExist(p);
    if (!stat) {
      return false;
    }
    return {path: p};
  }
  static isDirectory (p) {
    if (!p || typeof p !== 'string') {
      return;
    }
    if (!Index.isExist(p)) {
      return;
    }
    const pathStates = fs.statSync(p);
    return pathStates.isDirectory();
  }
  static isFile (p) {
    if (!p || typeof p !== 'string') {
      return;
    }
    if (!Index.isExist(p)) {
      return;
    }
    const pathStates = fs.statSync(p);
    return pathStates.isFile();
  }
  static type (p) {
    const isDirectory = Index.isDirectory(p);
    const isFile = Index.isFile(p);
    if (isDirectory) {
      return 'directory';
    } else if (isFile) {
      return 'file';
    }
  }
  // static method
  static isExist (p) {
    let stat = {};
    try {
      stat = fs.statSync(p);
    } catch (e) {
      return false;
    }
    return stat;
  }
  static readFileList (p) {
    if (!p || typeof p !== 'string') {
      return;
    }
    if (!Index.isExist(p)) {
      return;
    }
    const fileList = [];
    const pathStates = fs.statSync(p);
    if (!pathStates.isDirectory()) {// 如果是文件
      const states = fs.statSync(p);
      const obj   = new Object();
      obj.size    = states.size;
      obj.name    = path.basename(p);
      obj.path    = p;
      const f     = new File(obj);
      obj.md5     = f.getMd5();
      obj.isGzip  = f.isGzip();
      obj.type    = f.fileType();
      obj.extname = f.extname;
      fileList.push(obj);
      return fileList;
    }


    const traverse = function (_p) {
      const files = fs.readdirSync(_p);
      files.forEach(function (file) {
        const states = fs.statSync(path.join(_p, file));
        if (states.isDirectory()) {
          traverse(path.join(_p, file));
        } else {
          const obj   = new Object();
          obj.size    = states.size;
          obj.name    = file;
          obj.path    = path.join(_p, file);
          const f     = new File(obj);

          obj.md5     = f.getMd5();

          obj.isGzip  = f.isGzip();
          obj.type    = f.fileType();
          obj.extname = f.extname;

          fileList.push(obj);
        }
      });
    }
    traverse(p);
    return fileList;
  }

  static createFile (file, data, options) {
    return fs.writeFileSync(file, data, options);
  }
}

export default Index;
