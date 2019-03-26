// 通知与其他模块的耦合，采用事件的方式，其他模块负责传递事件，notify模块负责判断这个通知是否需要调用
import CommonNotify from '../common/notify';
import Bearychat    from './bearychat';
import DingTalk     from './dingtalk';
import _            from 'lodash';

// 生成普通节点信息
function generateNodeMessage (param) {
  const text = param.text || param.message
  // 如果是 发布日志，则直接返回 text
  if (param.node === 'deploy-log') {
    return text
  } else {
    return `**${param.node}** ${text}`;
  }
}

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
  // 生成消息体
  generateNotificationBody (param) {
    const text = generateNodeMessage(param);
    const title = param.title || this.config.title || 'rishiqing-deploy';
    const body = {
      // 把标题拼接到前面
      text: [`**${title}** `, text].join('\n\n'),
      title
    }
    return body;
  }
  bearychat (param) {
    const body = this.generateNotificationBody(param);
    param.text = body.text;
    param.notification = body.title;
    Bearychat(param.hook, param);
  }
  dingtalk (param) {
    const body = this.generateNotificationBody(param);
    param.text = body.text;
    param.title = body.title;
    DingTalk(param.hook, param);
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
