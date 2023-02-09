
const { get } = require('../lib/page');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '../data/sina');
const rootJson = path.join(dataDir, 'root.json');
const linksDir = path.join(dataDir, 'links');
if(!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
if(!fs.existsSync(linksDir)) fs.mkdirSync(linksDir);

const web = fs.existsSync(rootJson)? require(rootJson) : {};
Object.assign(web, {
        "root":"https://finance.sina.com.cn",
        "domains":[
            "finance.sina.com.cn"
        ]
    });
web.data = web.data||{};

// 是否在白名单域名内
function checkInDomains(url) {
    for(const domain of web.domains) {
        if(url.includes(domain)) return true;
    }
    return false;
}

// 开始获取页面信息
async function startGet(url) {
    try {
        if(url.startsWith('//')) url = 'https:' + url;
        else if(url.startsWith('/')) url = web.root + url;
        // 非正常的url不处理
        else if(!/^http(s)?:\/\//.test(url)) return;

        console.log('start get', url);
        // 已经存在的则表示重新拉取
        const data = web.data[url] || {
            id: Date.now() + Math.floor(Math.random()*1000),
            url,
        };
        const res = await get(url, { link: true });
        data.title = res.title;
        data.keywords = res.keywords;
        data.description = res.description;
        //data.text = res.text;
        //data.links = res.links;
        web.data[url] = data;
        let textPath = path.join(linksDir, `${data.id}.txt`);
        if(url === web.root) {
            textPath = path.join(dataDir, `root.txt`);
        }
        fs.writeFileSync(textPath, res.text);
        fs.writeFileSync(rootJson, JSON.stringify(web));

        // 有外链，则递归去抓取
        //console.log(res.resources.links);
        if(res.resources.links) {
            for(const link of res.resources.links) {
                if(!link) continue;
                //if(checkInDomains(link) && !web.data[link]) await startGet(link);
            }
        }
    }
    catch(e) {
        console.error(e);
    }
}

startGet(web.root);

