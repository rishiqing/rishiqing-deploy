export default {
  'after-build': {
    method: 'afterBuildNotify',
    message: 'After Build'
  },
  'one-build': {
    method: 'oneBuildNotify',
    message: 'One Build'
  },
  'after-convert': {
    method: 'afterConvertNotify',
    message: 'After Convert'
  },
  'one-upload': {
    method: 'oneUploadNotify',
    message: 'One Upload'
  },
  'one-file-upload': {
    method: 'oneFileUploadNotify',
    message: 'One File Upload'
  },
  'one-resource': {
    method: 'oneResourceNotify',
    message: 'One Resource'
  },
  'resource': {
    method: 'resourceNotify',
    message: 'Resource'
  },
  'one-file-replace': {
    method: 'oneFileReplaceNotify',
    message: 'One File Replace'
  },
  'file-replace': {
    method: 'fileReplaceNotify',
    message: 'File Replace'
  },
  'statistics': {
    method: 'statisticsNotify',
    message: 'Statistics'
  },
  'success': {
    method: 'successNotify',
    message: 'Success'
  },
  'error': {
    method: 'errorNotify',
    message: 'Error'
  }
};
