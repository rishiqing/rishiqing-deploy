import request from 'sync-request';

export default function (hook, opt) {
  const json = {
    msgtype: 'markdown',
    markdown: {
      title: opt.title,
      text: opt.text
    }
  };
  request('POST', hook, {
    'json': json
  })
}
