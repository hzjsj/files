module.exports = {
    envId: "your-env-id", //请替换为你的环境ID
    functionRoot: "./functions",
    functions: [
        {
            name: "getTempFileURL",
            // 超时时间
            timeout: 5,
            // 环境变量
            envVariables: {},
            runtime: "Nodejs8.9",
            installDependency:true,
            handler: "index.main"
        }, 
        {
            name: "login",
            // 超时时间
            timeout: 5,
            // 环境变量
            envVariables: {},
            runtime: "Nodejs8.9",
            installDependency:true,
            handler: "index.main"
        }
    ]
};
