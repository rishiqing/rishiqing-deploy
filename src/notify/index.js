// 通知与其他模块的耦合，采用事件的方式，其他模块负责传递事件，notify模块负责判断这个通知是否需要调用
import CommonNotify from '../common/notify';
import Bearychat    from './bearychat';
import _            from 'lodash';

const DefaultConfig = {
  title: 'rishiqing-deploy',
  nodes: [],
  list: []
};

class Notify {
  constructor (props) {
    this.config = Object.assign({}, DefaultConfig, props.config.notify);
    this.Events = CommonNotify.Events;
    this.Event  = CommonNotify.Event;
    this.Event.on(this.Events.ON_MESSAGE, this.onMessage.bind(this));
  }
  init () {}
  formatBearychatText (node, message) {
    return `**${node}** ${message}`;
  }
  bearychat (param) {
    param.text = this.formatBearychatText(param.node, param.text || param.message);
    param.notification = param.title || this.config.title || 'rishiqing-deploy';
    Bearychat(param.hook, param);
  }
  judgeNode (nodes, node) {
    if (nodes && _.isArray(nodes)) {
      if (nodes.indexOf(node) >= 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
  async onMessage (opt) {
    if (this.judgeNode(this.config.nodes, opt.node)) {
      await this.exec(opt);
    }
  }

  async exec (opt) {
    for (const item of this.config.list) {
      const fn = this[item.type];
      const param = Object.assign({}, item.param, opt);
      if (fn && typeof fn === 'function') {
        if (this.judgeNode(param.nodes, param.node)) {
          await fn.call(this, param);
        }
      }
    }
  }
}

export default Notify;
