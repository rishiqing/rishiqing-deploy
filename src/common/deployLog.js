import Gitlab from 'gitlab';
import _ from 'lodash';
import moment from 'moment';

// 获取 beforeSha 之前的所有commits
// options = { projectId, beforeSha, page, branch }
async function getCommitsFromGitlab (api, options) {
  const {
    projectId, // 项目id
    beforeSha, // 上一次构建的 sha
    page = 1, // 获取第几页数据
    branch // 分支
  } = options
  const list = [];
  // 最多只能获取3页数据，每页20条，也即共60条
  if (page > 3) return list
  const commits = await api.Commits.all(projectId, {
    perPage: 20,
    page,
    ref_name: branch
  })
  // 看能否通过before sha找到指定的commit
  const index = _.findIndex(commits, { id: beforeSha })
  if (index !== -1) {
    list.push(...commits.slice(0, index));
  } else {
    list.push(...commits)
    if (commits.length === 20) {
      const templist = await getCommitsFromGitlab(api, {
        projectId,
        beforeSha,
        branch,
        page: page + 1
      });
      list.push(...templist)
    }
  }
  return list
}

async function getLogFromGitlab (param) {
  let pattern;
  let attributes;
  if (/^\/[\s\S]+\/[igm]*$/i.test(param.match)) {
    const matchs = param.match.match(/^\/([\s\S]+)\/([igm]*)$/i);
    pattern = matchs[1];
    attributes = matchs[2];
  } else {
    // eslint-disable-next-line
    console.warn('deployLog.param.match shoud be regex');
  }
  const reg = new RegExp(pattern, attributes);
  // 分支默认是从 param里获取，如果 param里没有配置，则从 CI_COMMIT_REF_NAME 环境变量里获取
  const branch = param.branch || process.env.CI_COMMIT_REF_NAME;
  const projectId = param.projectId || process.env.CI_PROJECT_ID;
  const beforeSha = param.beforeSha || process.env.CI_COMMIT_BEFORE_SHA;
  const projectUrl = param.projectUrl || process.env.CI_PROJECT_URL;
  const gitlabUrl = param.url || process.env.CI_PAGES_URL;
  const jobToken = param.jobToken || process.env.CI_JOB_TOKEN;

  if (!gitlabUrl) {
    // eslint-disable-next-line
    console.warn('deployLog.param.url not define, it will be https://gitlab.com by default');
  }
  const data = {
    url: gitlabUrl
  }
  // 优先使用param.token
  if (param.token) {
    data.token = param.token;
  } else if (jobToken) {
    data.jobToken = jobToken;
  }

  const api = new Gitlab(data);

  const commits = await getCommitsFromGitlab(api, {
    projectId,
    branch,
    beforeSha
  });

  const logs = commits
    .filter(commit => reg.test(commit.message))
    .map(commit => {
      let message = param.replaceMatch ? commit.message.replace(reg, '') : commit.message
      // 替换掉换行符
      message = message.replace(/\n/g, '');
      if (projectUrl) {
        message = `[${commit.short_id}](${projectUrl}/commit/${commit.id}) ${message}`;
      } else {
        message = `${commit.short_id} ${message}`;
      }
      // 加上作者名字
      message += ` -- ${commit.author_name}`;
      // 加上时间
      const deta = moment(commit.committed_date).format('YYYY-MM-DD HH:mm')
      message += ` (${deta})`;
      message = `> ${message}`
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
    headerList.push(`time: (${moment().format('YYYY-MM-DD HH:mm')})`)

  return [headerList.join(' | '), ...logs].join('\n\n')
}

// 从gitlab获取发布日志
export default {
  async getLog (config) {
    let logs = '';
    if (config.type === 'gitlab') {
      logs = await getLogFromGitlab(config.param)
    }
    return logs;
  }
};
