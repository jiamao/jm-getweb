
const page = require('../lib/page');
const path = require('path');

const web = {
        "root":"https://finance.sina.com.cn",
        "domains":[
            "finance.sina.com.cn"
        ]
    };


async function start() {
    await page.getWeb(web);

    await page.destroy();
}

start();



