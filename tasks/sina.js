
const page = require('../lib/page');

const web = {
        "name": 'sina',
        "root":"https://finance.sina.com.cn",
        "domains":[
            "finance.sina.com.cn",
            "stock.finance.sina.com.cn"
        ]
    };


async function start() {
    await page.getWeb(web.name, web);

    await page.destroy();
}

start();



