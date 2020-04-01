# 项目介绍：
这个项目是我参加腾讯云云开发实战营【web云开发赛道-FILES存储】时开发的，通过这个项目你将学到以下功能：
- web端自定义登入
- web端操作数据库
- web端上传、下载、删除文件
- 云函数内转换文件临时地址
- 云函数http触发

# 技术使用
- 后端服务使用腾讯云云开发提供的一体化解决方案，包括云函数、云数据库、云存储能力

- 前端使用原生JavaScript和[layui前端框架](https://www.layui.com)，配合腾讯云云开发提供的JS-SDK完成后端服务的对接

- 前端静态资源部署在腾讯云云开发的静态网站托管服务上

# 部署步骤
##### 一、创建云开发环境

- 访问[腾讯云云开发控制台](https://console.cloud.tencent.com/tcb),新建【按量计费云开发环境】，记住云开发环境ID。
- 进入[静态网站控制页](https://console.cloud.tencent.com/tcb/hosting)，开通静态网站托管服务
- 进入[数据库控制页](https://console.cloud.tencent.com/tcb/database)，添加个集合；集合名字分别为files、files_old


##### 二、安装、登入 CloudBase CLI
- 安装
``` bash
npm install -g @cloudbase/cli
```
- 在安装之后，执行如下代码，如果可以正常的显示版本号，则安装成功！
``` bash
cloudbase -v
```
- 登入
``` bash
tcb login
```

##### 三、下载并配置项目
- 先将本项目clone到本地(或者直接下载压缩包)
``` bash
git clone https://github.com/hzjsj/files.git
```
- 用代码工具打开项目目录，将以下文件中标注有【云开发环境ID】处替换成自己的云开发环境ID -- /cloudbaserc.js 第2行 -- webviews/getTempFileURL/index.js 第1行 -- function/getTempFileURL/index.js 第5行

- 进入[环境设置控制页](https://console.cloud.tencent.com/tcb/env/setting)-登录方式下，点击私钥复制，将复制内容配置到webviews/login/index.js文件中

##### 四、上传并部署云函数
- 使用CloudBase CLI工具登录后，进入files/目录，依次执行以下代码： ::: warning注意：envID 替换成自己的云开发环境ID:::
``` bash
tcb functions:deploy -e envID getTempFileURL
tcb functions:deploy -e envID login
tcb service:create -e envID -p /login -f login
```
- 上面两行是部署云函数，最后一行是为 login云函数创建HTTP服务

##### 五、本地运行、部署
- 进入webviews
``` bash
cd webviews
```
- 本地运行项目
``` bash
npx serve
```
即可打开一个本地静态服务器，然后访问 http://localhost:5000
- 部署到网站托管
``` bash
# 将 webviews 目录下的所有文件部署到根目录
tcb hosting:deploy webviews -e envId
```
- 查看静态网站域名和状态
``` bash
tcb hosting:detail -e envId
```
在浏览器打开静态网站域名，就可以看到部署的文件管理项目了




