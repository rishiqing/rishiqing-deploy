import request from 'sync-request';

export default function (hook, opt) {
  const json = {
    text: opt.text
  };
  if (opt.channel) {
    json.channel = opt.channel;
  }
  if (opt.user) {
    json.user = opt.user;
  }
  if (opt.notification) {
    json.notification = opt.notification;
  }
  if (opt.attachments) {
    json.attachments = opt.attachments;
  }
  request('POST', hook, {
    'headers': {
      'Content-Type': 'application/json'
    },
    'json': json
  });
}
