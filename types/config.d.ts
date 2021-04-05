/**
 * 通知节点类型
 */
export type NotifyNodeType = 'after-build' | 'one-build' | 'after-convert' | 'one-upload' | 'one-file-upload' | 'one-resource' | 'resource' | 'one-file-replace' | 'file-replace' | 'statistics' | 'success' | 'error' | 'deploy-log'

export interface NotifyType {
  /**
   * 通知类型, 钉钉, 熊
   */
  type: 'dingtalk' | 'bearychat'
  param: {
    /**
     * webhook
     */
    hook: string
    /**
     * 定义二级通知节点列表, 如果没有定义, 自会根据上一级定义的通知节点进行通知
     * 如果定义了, 则先经过父级定义的通知节点过滤，在经过这一级定义的通知节点的过滤, 如果都包含，
     * 则发送通知
     */
    nodes?: NotifyNodeType[]
  }
}

/**
 * 通知相关配置
 */
export interface NotifyConfigType {
  /**
   * 通知标题，比如配置的钉钉通知，这个标题会显示在电脑右上角弹出的通知里
   */
  title: string
  /**
   * 定义通知节点列表
   */
  nodes: NotifyNodeType[]

  list: NotifyType[]
}

export interface DeployLogType {
  title: string
  /**
   * 字符串正则表达式
   *
   * @default '/^((?!Merge branch).)+$/'
   */
  match?: string
  /**
   * @default false
   */
   replaceMatch?: boolean
   goToLink?: string
   version?: string
}

export interface UploaderParamType {
  path: string
}

export interface AliyunOssUploaderParamType extends UploaderParamType {
  accessKeyId: string
  accessKeySecret: string
  region: string
  endpoint: string
  bucket: string
  prefix: string
}

export interface FtpUploaderParamType extends UploaderParamType {
  host: string
  port: number
  username: string
  password: string
}

export interface SftpUploaderParamType extends FtpUploaderParamType {}

export interface SSh2UploaderParamType extends UploaderParamType {
  user: string
  host: string
}

export interface UploaderType<ParamType> {
  type: 'aliyunOss' | 'ftp' | 'sftp' | 'ssh2'
  param: ParamType
}

export interface DestType<ParamType> {
  dist: string
  ignore: string[]
  upload: UploaderType<ParamType>[]
}

/**
 * 配置文件类型
 */
export interface ConfigType<ParamType = UploaderParamType> {
  notify?: NotifyConfigType
  deployLog?: DeployLogType
  /**
   * 命令列表
   */
  build?: string[]
  resource?: DestType<ParamType>[]
  fileReplace?: DestType<ParamType>[]
  /**
   * 收尾命令列表
   */
  endBuild?: string[]
}
