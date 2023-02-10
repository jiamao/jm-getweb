
const path = require('path');
const fs = require('fs');
const requestWeb = require('./request');

async function getPage(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await requestWeb.get(url);
            resolve(res);
        }
        catch(e) {
            reject && reject(e);
        }
    });    
}

// 并发请求
async function getPages(urls, callback) {
    
    let item = [];
    for(let i=0; i <urls.length; i++) {
        if(i % 5 === 0 && item.length) {
            // 每批量执行一次
            const res = await Promise.all(item);
            callback && callback(res);
            item = [];
        }
        item.push(requestWeb.get(urls[i]));
    }
    if(item.length) {
        // 每批量执行一次
        const res = await Promise.all(item);
        callback && callback(res);
    }    
}

async function getWeb(key, web={}) {
    web.dataDir = path.join(__dirname, '../data/' + key);
    web.rootJson = path.join(web.dataDir, 'root.json');
    web.linksDir = path.join(web.dataDir, 'links');
    if(!fs.existsSync(web.dataDir)) fs.mkdirSync(web.dataDir);
    if(!fs.existsSync(web.linksDir)) fs.mkdirSync(web.linksDir);
    
    web.data = web.data || {};
}

// 是否在白名单域名内
function checkInDomains(url, web) {
    for(const domain of web.domains) {
        const reg = new RegExp(`^(http(s)?:)?\\/\\/${domain}(\\/|$)`, 'i');
        //console.log(reg, url, reg.test(url));
        if(reg.test(url)) return true;
    }
    return false;
}

// 开始获取页面信息
async function startGet(url, web) {
    try {
        if(!url) return ;
        if(url.startsWith('//')) url = 'https:' + url;
        else if(url.startsWith('/')) url = web.root + url;
        // 非正常的url不处理
        else if(!/^http(s)?:\/\//.test(url) || !checkInDomains(url, web)) return;

        console.log('start get', url);
        // 已经存在的则表示重新拉取
        const data = web.data[url] || (web.data[url]={
            id: Date.now() + Math.floor(Math.random()*1000),
            url,
        });
        const res = await page.get(url);
        data.title = res.title;
        data.keywords = res.keywords;
        data.description = res.description;
        //data.text = res.text;
        //data.links = res.links;
        
        let textPath = path.join(web.linksDir, `${data.id}.txt`);
        let htmlPath = path.join(web.linksDir, `${data.id}.html`);
        if(url === web.root) {
            textPath = path.join(web.dataDir, `root.txt`);
            htmlPath = path.join(web.dataDir, `root.html`);
        }
        fs.writeFileSync(textPath, res.text);
        fs.writeFileSync(htmlPath, res.html);
        fs.writeFileSync(web.rootJson, JSON.stringify(web));

        // 有外链，则递归去抓取
        //console.log(res.links);
        if(res.links) {
            await mutilGet(res.links, web);
        }
    }
    catch(e) {
        console.error(e);
    }
}

// 批量获取
async function mutilGet(urls, web) {
    let item = [];
    for(let i=0; i <urls.length; i++) {
        if(web.data[urls[i]]) continue;

        if(item.length === 5) {
            // 每批量执行一次
            await Promise.all(item);
            item = [];
        }
        item.push(startGet(urls[i], web));
    }
    if(item.length) {
        // 每批量执行一次
        await Promise.all(item);
    }    
}

exports.get = getPage;
exports.getPages = getPages;
exports.startGet = startGet;
exports.getWeb = getWeb;

exports.destroy = async function(){
    await requestWeb.close();
};