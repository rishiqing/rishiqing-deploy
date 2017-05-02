// 这个模块负责整合所有通知，包括整理通知内容
// 这里是一个中转站，负责把其他模块的通知内容，整合之后，发送到 notify里，进行真正的通知
import EventEmitter from 'events';
import nd           from './notifyNode';

const Event = new EventEmitter();
const Events = {
  ON_MESSAGE: 'on_message',
  ON_ERROR  : 'on_error'
};

class Notify {
  static get Event () {
    return Event;
  }
  static get Events () {
    return Events;
  }
  get notifyOrigin () {
    return 'default';
  }
  // 推送普通消息
  pushMessage (opt = {}) {
    Event.emit(Events.ON_MESSAGE, opt);
  }
  // 推送错误消息
  pushError (error = {}) {
    Event.emit(Events.ON_ERROR, error);
  }
}

for (const node in nd) {
  const entry = nd[node];
  Notify.prototype[entry.method] = ((node, entry) => {
    return (_message) => {
      const message = _message || entry.message;
      this.pushMessage({ node, message });
    };
  })(node, entry);
}

export default Notify;
