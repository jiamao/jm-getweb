
const page = require('../lib/page');

const web = {
        "root":"https://finance.sina.com.cn",
        "domains":[
            "finance.sina.com.cn"
        ]
    };


async function start() {
    await page.getWeb('sina', web);

    await page.destroy();
}

start();



