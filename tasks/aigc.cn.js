const path = require('path');
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');


const dataPath = path.join(__dirname, '../data/aigc');

async function getPageHtml(url) {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get(url);
            resolve(res.data);
        }
        catch(e) {
            console.log(url, JSON.stringify(e));
            resolve && resolve(null);
        }
    });    
}

/**
 * 分解出分类
 * @param {*} html 
 */
async function getCategories(html, lis) {
    const $ = typeof html ==='string'?cheerio.load(html): html;
    lis = lis || $('div.sidebar-menu-inner>ul>li.sidebar-item'); // 分类标签
    const res = [];
    for(const li of lis) {
        const $li = $(li);
        const cat = {};
        const link = $li.find('>a');
        cat.text = link.text().trim();
        cat.hash =link.attr('href').trim();
        cat.icon = link.find('i').attr('class');
        
        console.log(cat);

        const idIndex = cat.hash.lastIndexOf('-');
        if(idIndex > -1) {
            cat.id = cat.hash.substring(idIndex + 1);
            cat.url = `https://www.aigc.cn/wp-admin/admin-ajax.php?id=${cat.id}&taxonomy=favorites&action=load_home_tab&post_id=0&sidebar=0`;

            const catHtml = await getPageHtml(cat.url);
            if(catHtml) fs.writeFileSync(path.join(dataPath, 'html', 'categories', cat.id + '.html'), catHtml);

        }
        const clis = $li.find('ul>li');
        if(clis && clis.length) {
            cat.children = await getCategories($, clis);
        }
        res.push(cat);
    }
    //console.log(res);
    return res;  
}


async function catchCategories(url) {
    const html = await getPageHtml(url);

    if(html) { 
        fs.writeFileSync(path.join(dataPath, 'html', 'index.html'), html);

        const categories = await getCategories(html);

        const catJson = JSON.stringify(categories);
        fs.writeFileSync(path.join(dataPath, 'json', 'categories.json'), catJson);
        return categories;
    }
}

// 抓取AI应用配置
async function catchItems(categories, items = []) {
    for(const cat of categories) {
        if(!cat.id) continue;
        
        if(cat.children && cat.children.length) {
            await catchItems(cat.children, items);
            continue;
        }

        const htmlPath = path.join(dataPath, 'html', 'categories', cat.id + '.html');
        const html = fs.readFileSync(htmlPath, 'utf8');
        const $ = cheerio.load(html);
        const itemCards = $('div.url-card a.card');
        for(const card of itemCards) {
            const dom = $(card);
            const id = dom.attr('data-id');

            const existsItems = items.find(p=>p.id === id);            
            if(!existsItems) {
                const item = await getItemDetail(dom);
                item.categoryId = cat.id;
                items.push(item);

                console.log('get item', item);
            }
        }
    }
    const itemsJson = JSON.stringify(items);
    fs.writeFileSync(path.join(dataPath, 'json', 'items.json'), itemsJson);
    return items;
}

async function getItemDetail(itemDom) {
    const item = {};
    item.id = itemDom.attr('data-id');
    item.aboutUrl = itemDom.attr('href');
    item.url = itemDom.attr('data-url');
    item.title = itemDom.attr('title');
    item.name = itemDom.find('strong').text().trim();
    item.icon = itemDom.find('img').attr('data-src');

    const htmlPath = path.join(dataPath, 'html', 'items', item.id + '.html');
    if(!fs.existsSync(htmlPath)) {
        const itemHtml = await getPageHtml(item.aboutUrl);
        if(itemHtml) {
            fs.writeFileSync(htmlPath, itemHtml);
        }
    }
    return item;
}

async function start() {
    const categories = await catchCategories('https://www.aigc.cn/');
    if(categories) {
        const items = await catchItems(categories);
    }
}


let idIndex = 1000;// id增量
// 转换成需要的格式
async function convertToJTData() {
    const categories = JSON.parse(fs.readFileSync(path.join(dataPath, 'json', 'categories.json'), 'utf8'));
    const items = JSON.parse(fs.readFileSync(path.join(dataPath, 'json', 'items.json'), 'utf8'));

    const categoriesData = [];
    const itemsData = [];

    for(const cat of categories) {
        const res = await convertCategoryData(cat, items);
        categoriesData.push(res.cat);
        itemsData.push(...res.items);


        fs.writeFileSync(path.join(dataPath, 'categories.json'), JSON.stringify(categoriesData));
        fs.writeFileSync(path.join(dataPath, 'items.json'), JSON.stringify(itemsData));
    }

}

async function saveImage(url, path) {
    try {
        const res = await axios({
            method: 'get',
            url,
            responseType: 'arraybuffer'
        });
        const buffer = Buffer.from(res.data, 'binary');
        const ws = fs.createWriteStream(path);
        ws.write(buffer);
        ws.end();
        console.log('save img', url, path);
        return path;
    }
    catch(e) {
        console.error('load img error');
    }
}

async function convertCategoryData(cat, items) {
    
    const newcat = {
        name: cat.text,
        aigcId: cat.id,
        children: []
    };
    newcat.id = idIndex ++ ;
   
    const newitems = await convertItemsData(newcat, items);
    
    if(cat.children && cat.children.length) {
        for(const c of cat.children) {
            const res = await convertCategoryData(c, items);
            newcat.children.push(res.cat);
            newitems.push(...res.items);
        }
    }
    return {
        cat: newcat,
        items: newitems
    }
}

// 处理分类下的所有项
async function convertItemsData(cat, items) {
    const res = [];

    const imagePAth = path.join(dataPath, 'images');
    for(const item of items) {
        if(item.categoryId !== cat.aigcId) continue;
        const newitem = {
            id: idIndex ++,
            name: item.name,
            url: item.url,
            title: item.title,
            categoryId: cat.id,
            aigcId: item.id,
        }
        if(item.icon) {
            newitem.icon = 'item_icons/' + newitem.id + '.png';
            await saveImage(item.icon, path.join(imagePAth, newitem.icon))
        }
        res.push(newitem);
        newitem.contentUrl = 'items/' + newitem.id + '.html';
        const contentPath = path.join(dataPath, newitem.contentUrl);
        
        console.log('convert item', cat.aigcId, contentPath, newitem);
        if(fs.existsSync(contentPath)) continue;

        if(item.icon) {
            const iconPath = 'item_icons/' + newitem.id + '.png';
            newitem.icon = 'https://jtcospublic.ciccten.com/jt-aigc/images/' + iconPath;
            await saveImage(item.icon, path.join(imagePAth, iconPath));
        }

        const htmlPath = path.join(dataPath, 'html', 'items', item.id + '.html');
        let html = fs.readFileSync(htmlPath, 'utf8');

        const $ = cheerio.load(html);
        

        const imgs = $('img');
        for(const img of imgs) {
            const src = $(img).attr('data-src') || $(img).attr('src');
            if(src && !src.includes('jtcospublic')) {
                const p = 'content/' + Math.floor(Math.random()*100000 + Date.now()) + '.png';
                const imgUrl = 'https://jtcospublic.ciccten.com/jt-aigc/images/' + p;
                const r = await saveImage(src, path.join(imagePAth, p));
                if(r) {
                    //content = content.replace(src, imgUrl).replace(src, imgUrl).replace(src, imgUrl).replace(src, imgUrl);
                    //html = html.replace(src, imgUrl).replace(src, imgUrl).replace(src, imgUrl).replace(src, imgUrl);
                    $(img).attr('src', imgUrl).attr('data-src', '');
                }
            }
        }
        const $content = $('.content-wrap .panel-body');
        let content = $content.html();
        if(!content) {
            delete newitem.contentUrl;
            continue;
        }
        fs.writeFileSync(htmlPath, $.html());
        fs.writeFileSync(contentPath, content);
    }
    return res;
}

// 抓取分类
start();
convertToJTData();


convertToJTData();