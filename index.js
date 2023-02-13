
const page = require('./lib/page');
const sina = require('./tasks/sina');


async function start() {
    await Promise.all([
        sina.start()
    ]);

    // 释放浏览器资源
    await page.destroy();
}

start();