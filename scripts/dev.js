const { context } = require('esbuild')

const path = require('path')

const target = 'vue'

// 配置修改后需要重启
context({
    // 打包入口
    entryPoints: [path.resolve(__dirname, `../packages/${target}/src/index.ts`)],
    outfile: path.resolve(__dirname, `../packages/${target}/dist/${target}.js`),
    bundle: true, // 将文件中的依赖也同时打包进来
    sourcemap: true, // 生成sourcemap
    format: 'esm', // 打包成esm模块
    platform: 'browser',
    /** esbuild定义的变量，可以在代码中直接使用 */
    define: {
        __DEV__: `true`
    }
}).then(ctx => {
    // 监听到文件变化，只要发生了改动，就重新打包编译结果
    ctx.watch().then(() => {
        console.log('正在监听文件变化......')
    })
})
