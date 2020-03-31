// 初始化
const tcb = require('tcb-admin-node')

const app = tcb.init({
  env: 'your-env-id' //请替换为你的环境ID
})
// 返回输入参数
exports.main = async (event) => {
    console.log('Hello World')
    const result = await app.getTempFileURL({
      fileList: [event.fileID]
    })
  
    result.fileList.forEach(item => {
      console.log(item.tempFileURL) // 打印文件访问链接
    })

    return result
}
