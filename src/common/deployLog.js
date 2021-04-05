import moment from 'moment-timezone';
import gitRawCommits from 'git-raw-commits';
import gitSemverTags from 'git-semver-tags';
import SimpleGit from 'simple-git';

const simpleGit = SimpleGit();

// 通过匹配标签找到上一个标签的sha，然后通过这个sha去找到对应的commits
async function getBeforeShaFromtTag (tagPrefix, tagMatch) {
  const reg = createRegex(tagMatch)
  return new Promise((resolve, reject) => {
    gitSemverTags((err, tags) => {
      if (err) {
        reject(err)
        return;
      }
      // 利用 tagMatch 过滤标签
      const filters = tags.filter(tag => reg.test(tag));
      // 取得上一个标签
      const lastTag = filters[1];
      if (!lastTag) {
        resolve(null)
        return;
      }
      simpleGit.revparse([lastTag], (err, hash) => {
        if (err) {
          reject(err);
          return;
        }
        // 把末尾的换行符给删掉
        resolve(hash.replace(/\n$/, ''));
      })
    }, {
      tagPrefix
    })
  })
}

// 从本地获取git commit
async function getCommitsFromGit (from) {
  const readable = gitRawCommits({
    from,
    format: '--rishiqing-deploy-read-commit--{"message": "%s", "body": "%b", "id": "%H", "short_id": "%h", "author_name": "%an", "committed_date": "%cD"}'
  })
  let logs = '';
  return new Promise((resolve, reject) => {
    readable.on('readable', () => {
      const chunk = readable.read()
      if (chunk) {
        logs += chunk.toString()
      } else {
        let logList = logs.split('--rishiqing-deploy-read-commit--')
        logList = logList.filter(log => log)
          .map(log => {
            let f = log.replace(/\n$/, '').replace(/\n/g, '\\n')
            try {
              return JSON.parse(f)
            } catch (e) {
              // eslint-disable-next-line
              console.error('json parse error stack: ', e)
              // eslint-disable-next-line
              console.error('json parse error string: ', f);
            }
          });
        resolve(logList)
      }
    })
    readable.on('error', (error) => {
      reject(error)
    })
  })
}

function createRegex (match) {
  if (isRegexString(match)) {
    // match 直接支持正则对象，方便js直接调用
    if (match instanceof RegExp) return match
    const matchs = match.match(/^\/([\s\S]+)\/([igm]*)$/i);
    const pattern = matchs[1];
    const attributes = matchs[2];
    return new RegExp(pattern, attributes);
  } else {
    return new RegExp();
  }
}

function isRegexString (match) {
  if (/^\/[\s\S]+\/[igm]*$/i.test(match)) {
    return true;
  } else {
    return false;
  }
}

async function getLogFromGitlab (param = {}) {
  if (!isRegexString(param.match)) {
    // eslint-disable-next-line
    console.warn('deployLog.param.match shoud be regex');
  }
  const reg = createRegex(param.match);
  // 分支默认是从 param里获取，如果 param里没有配置，则从 CI_COMMIT_REF_NAME 环境变量里获取
  const branch = param.branch || process.env.CI_COMMIT_REF_NAME;
  const projectUrl = param.projectUrl || process.env.CI_PROJECT_URL;
  const timeZone = param.timeZone || 'Asia/Shanghai';
  const timeFormat = param.timeFormat || 'YYYY-MM-DD HH:mm';
  const tagPrefix = param.tagPrefix || 'master-deploy-';

  let beforeSha = param.beforeSha || process.env.CI_COMMIT_BEFORE_SHA;
  // 如果beforeSha为空，或者beforeSha全是0
  if (
    (!beforeSha || /^0+$/.test(beforeSha))
    && param.tagPrefix
  ) {
    try {
      beforeSha = await getBeforeShaFromtTag(tagPrefix, param.tagMatch)
    } catch(e) {
      // eslint-disable-next-line
      console.error(`get before sha form tag error`, e);
    }
  }

  // eslint-disable-next-line
  console.log('branch: ', branch)
  // eslint-disable-next-line
  console.log('beforeSha: ', beforeSha)
  // eslint-disable-next-line
  console.log('projectUrl: ', projectUrl)

  let commits = []
  try {
    commits = await getCommitsFromGit(beforeSha)
  } catch (e) {
    commits = []
    // eslint-disable-next-line
    console.error(`get commits error`, e);
  }

  const logs = commits
    .filter(commit => commit && commit.message && reg.test(commit.message))
    .map(commit => {
      let message = param.replaceMatch ? commit.message.replace(reg, '') : commit.message
      // 替换掉换行符
      message = message.replace(/\n$/, '');
      if (projectUrl) {
        message = `[${commit.short_id}](${projectUrl}/commit/${commit.id}) ${message}`;
      } else {
        message = `**${commit.short_id}** ${message}`;
      }
      // 加上作者名字
      message += ` -- ${commit.author_name}`;
      // 加上时间
      const date = moment(new Date(commit.committed_date)).tz(timeZone).format(timeFormat)
      // eslint-disable-next-line no-console
      message += ` (${date} ${timeZone})`;
      message = `> ${message} \n\n`;
      message += `> ${commit.body.replace(/\n$/, '')}`;
      return message
    })

    const headerList = [];

    // 头部最左边标题部分
    headerList.push(`**${param.title || 'deploy log'}** --`);
    // 如果配置了版本号
    if (param.version) {
      headerList.push(`version: ${param.version}`);
    }
    if (branch) {
      // 如果配置了 projectUrl, 则用链接的方式
      if (projectUrl) {
        headerList.push(`branch: [${branch}](${projectUrl}/tree/${branch})`);
      } else {
        headerList.push(`branch: ${branch}`);
      }
    } else {
      headerList.push('branch: none branch');
    }
    // 如果配置了跳转链接
    if (param.goToLink) {
      headerList.push(`[GO_TO](${param.goToLink})`)
    }
    headerList.push(`time: (${moment().tz(timeZone).format(timeFormat)} ${timeZone})`)

  return [headerList.join(' | '), ...logs].join('\n\n')
}

// 从gitlab获取发布日志
export default {
  async getLog (config) {
    const logs = await getLogFromGitlab(config)
    return logs;
  }
};
