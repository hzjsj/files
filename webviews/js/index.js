const envID = 'your-env-id' //请替换为你的环境ID

const app = tcb.init({
    env: envID
});
const ticketUrl = 'https://'+envID+'.service.tcloudbase.com/login';
const auth = app.auth();
var db = app.database();
const _ = db.command;
var userId;
async function login() {
    const loginState = await auth.getLoginState();
    // 1. 建议登录前检查当前是否已经登录
    if (!loginState) {
        logins()
    } else {
        onLoad()
    }
}

async function getTicket(e) {
    // 2. 请求开发者自有服务接口获取ticket
    const ticket = await fetch(ticketUrl + '?userId=' + e)
        .then(async (res) => {
            if (res.status === 400) {
                console.log('获取 Ticket 失败，用户 Id 不符合规则')
            }

            if (res.status === 429) {
                console.log('API rate limit exceeded')
            }
            const data = await res.json()
            // 3. 登录 Cloudbase
            auth.signInWithTicket(data.ticket).then(res => {
                onLoad()
                layer.msg('登入成功', { icon: 1 });
            })
        })
}

// 时间格式转换
const formatNumber = n => {
    n = n.toString()
    return n[1] ? n : '0' + n
}
const formatTime = date => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hour = date.getHours()
    const minute = date.getMinutes()
    const second = date.getSeconds()

    return [year, month, day].map(formatNumber).join('-') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

//获取url参数，例如getQueryVariable('id');
function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) { return decodeURI(pair[1]); }
    }
    return ('');
}

//获取文件列表
function getFiles() {
    db.collection("files").orderBy('createTime', 'desc').get().then(res => {
        let html = '';
        for (let item of res.data) {
            html += '<tr><td>' + item.name + '</td><td>'
                + formatTime(item.createTime) + '</td> <td>' + item.download + '</td><td> <button type="button" k_id="'
                + item._id + '"fileID="'
                + item.fileID + '"onclick="download(this)" class="layui-btn layui-btn-sm layui-btn-normal">下载</button><button type="button" k_id="'
                + item._id + '" onclick="editFile(this)"  class="layui-btn layui-btn-sm layui-btn-primary">编辑</button><button type="button" k_id="'
                + item._id + '"fileID="'
                + item.fileID + '" onclick="delFile(this)"  class="layui-btn layui-btn-sm layui-btn-danger">删除</button></td></tr>'
        }
        if (res.data.length == 0) {
            html = '<tr><td colspan="4">无上传文件</td></tr>'
        }
        document.getElementById('FileList').innerHTML = html;
    })
}

//获取下载url
function download(e) {
    let fileID = e.getAttribute('fileID')
    let id = e.getAttribute('k_id')
    app.callFunction({
        name: 'getTempFileURL',
        data: { fileID: fileID }
    }).then((res) => {
        db.collection("files").doc(id).update({
            download: _.inc(1)
        }).then(function (res) {
            getFiles()
        })
        const result = res.result; //云函数执行结果

        let url = res.result.fileList[0]['download_url'];
        window.open(url, "_blank");
    });
}

//layui模块引入
layui.use(['upload', 'form', 'layer'], function () {
    var layer = layui.layer, form = layui.form, upload = layui.upload, $ = layui.jquery;
    //执行文件上传实例
    var uploadInst = upload.render({
        elem: '#test1' //绑定元素
        , url: '/upload/' //上传接口
        , auto: false
        , accept: 'file' //允许上传的文件类型
        , choose: function (obj) {
            //将每次选择的文件追加到文件队列
            var files = obj.pushFile();
            //预读本地文件，如果是多文件，则会遍历。(不支持ie8/9)
            obj.preview(function (index, file, result) {
                // return
                var index = layer.msg('上传中', {
                    icon: 16
                    , shade: 0.01
                });
                app.uploadFile({
                    cloudPath: `file/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}/` + file.name,
                    filePath: file,
                    onUploadProgress: function (progressEvent) {
                        var percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                    }
                }).then(res => {
                    db.collection("files").add({
                        name: file.name,
                        fileID: res.fileID,
                        download: 0,
                        createTime: new Date()
                    }).then((res) => {
                        getFiles()
                    }).catch((e) => {

                    });
                    layer.close(index);
                    layer.msg('上传成功', { icon: 1 });


                })
            })

        }
        , done: function (res) {
            //上传完毕回调
        }
        , error: function () {
            //请求异常回调
        }
    });

    window.logins = function () {
        layer.prompt({
            title: '自定义登入', formType: 0,
            btn2: function () {
                return false //开启该代码可禁止点击该按钮关闭
            }
        }, function (value, index) {
            layer.close(index);
            getTicket(value)
        });
    }
    login();
    //文件删除
    window.delFile = function (e) {
        let id = e.getAttribute('k_id')
        let fileID = e.getAttribute('fileID')
        layer.confirm('真的删除行么', function (index) {
            layer.close(index);
            //向服务端发送删除指令
            db.collection("files").doc(id).remove()
                .then((res) => {
                    deleteFile(fileID);
                    getFiles()
                    layer.msg('删除成功', { icon: 1 });

                })
                .catch((e) => {

                });
        });
    }

    //打开编辑文件页面
    window.editFile = function (e) {
        let id = e.getAttribute('k_id')
        layer.open({
            type: 2,
            title: '编辑文件',
            shadeClose: true,
            shade: 0.8,
            area: ['50%', '80%'],
            content: 'editFile?id=' + id //iframe的url，部署时这样写'editFile.html?id='
            ,end: function () {
                getFiles();
	        }
        });
    }

    //获取单个文件列表
    window.getFile = function () {

        db.collection("files").doc(id).get()
            .then(res => {
                data = res.data[0];
                form.val("formTest", {
                    "name": data.name
                    , "fileID": data.fileID
                    , "createTime": formatTime(data.createTime)
                    , "download": data.download
                });
            });
    }
    //执行修改文件上传实例
    var uploadInsts = upload.render({
        elem: '#test3' //绑定元素
        , url: '/upload/' //上传接口
        , auto: false
        , accept: 'file' //允许上传的文件类型
        , choose: function (obj) {
            //将每次选择的文件追加到文件队列
            var files = obj.pushFile();
            //预读本地文件，如果是多文件，则会遍历。(不支持ie8/9)
            obj.preview(function (index, file, result) {
                var index = layer.msg('上传中', {
                    icon: 16
                    , shade: 0.01
                });
                app.uploadFile({
                    cloudPath: `file/${Date.now()}-${Math.floor(Math.random(0, 1) * 1000)}/` + file.name,
                    filePath: file,
                    onUploadProgress: function (progressEvent) {
                        var percentCompleted = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total
                        );
                    }
                }).then(res => {
                    form.val("formTest", {
                        "name": file.name
                        , "fileID": res.fileID
                    })
                    layer.close(index);
                    layer.msg('上传成功', { icon: 1 });
                })
            })

        }
    });

    //编辑文件提交
    form.on('submit(formDemo)', function (obj) {
        db.collection("files_old")
            .add({
                files_id: data._id,
                name: data.name,
                createTime: data.createTime,
                fileID: data.fileID,
                updateTime: new Date()
            })
            .then(res => {
                
            });
        db.collection("files")
            .doc(id)
            .update({
                name: obj.field.name,
                fileID: obj.field.fileID,
                createTime: new Date()
            })
            .then(res => {
                files_old()
                layer.msg('修改成功', { icon: 1 });
                
            });
        return false;
    });

    //文件删除
    window.delFile_old = function (e) {
        let id = e.getAttribute('k_id')
        let fileID = e.getAttribute('fileID')
        layer.confirm('真的删除行么', function (index) {
            layer.close(index);
            //向服务端发送删除指令
            db.collection("files_old").doc(id).remove()
                .then((res) => {
                    files_old();
                    deleteFile(fileID);
                    layer.msg('删除成功', { icon: 1 });
                })
                .catch((e) => {

                });
        });
    }
});


//获取文件更新历史
function files_old() {
    db.collection("files_old").where({
        files_id: id
    }).orderBy('updateTime', 'desc').get().then(res => {
        let html = '';
        for (let item of res.data) {
            html += '<tr><td>' + item.name + '</td><td>'
                + formatTime(item.updateTime) + '</td><td> <button type="button" k_id="'
                + item._id + '"fileID="'
                + item.fileID + '"onclick="download(this)" class="layui-btn layui-btn-sm layui-btn-normal">下载</button><button type="button" k_id="'
                + item._id + '"fileID="'
                + item.fileID + '" onclick="delFile_old(this)"  class="layui-btn layui-btn-sm layui-btn-danger">删除</button></td></tr>'
        }
        if (res.data.length == 0) {
            html = '<tr><td colspan="3">无更新历史</td></tr>'
        }
        document.getElementById('Files').innerHTML = html;
    })
}

//删除云端文件
function deleteFile(e) {
    app.deleteFile({
        fileList: [e]
    }).then((res) => {
        
    });
}