//const simpleget = require("simple-get");
//const tunnel = require('tunnel');
const puppeteer = require('puppeteer');
let browser = null;

async function open() {
    if(!(browser instanceof puppeteer.Browser))  {
        return browser = await puppeteer.launch({
            headless: true
        });
    }
    return browser;
}

/**
 * 请求WEB获取html
 * url: string || List<string>
 */
 async function get(url) {    
    const page = await (await open()).newPage();

    await page.goto(url);

    // Set screen size
    await page.setViewport({width: 1080, height: 1024});

    await page.setRequestInterception(true);     // 设为true 开启    false 关闭
    // 阻止不必要的资源加载
    page.on('request', req => {
        if (req.resourceType() === 'image')
            req.abort();
        else req.continue();
    });

    // Type into search box
    //await page.type('.search-box__input', 'automate beyond recorder');

    // Wait and click on first result
    //const searchResultSelector = '.search-box__link';
    //await page.waitForSelector(searchResultSelector);
    //await page.click(searchResultSelector);

    // Locate the full title with a unique string
    //const textSelector = await page.waitForSelector(
    //    'title'
    //);
    
    //const fullTitle = await textSelector.evaluate(el => el.textContent);

    // Print the full title
    //console.log('The title of this blog post is "%s".', fullTitle);
    return new Promise(resolve => {
        setTimeout(async ()=>{
            const res = await page.evaluate(async () => {
                try {
                    const obj = {
                        url: location.href,
                        text: document.body.innerText,
                        html: document.body.innerHTML,
                        head: document.head.innerHTML,
                        title: document.title,
                        links: []
                    };
        
                    const links = document.querySelectorAll('a');
                    for(const m of links) {
                        const link = m.href;
                        if(link) obj.links.push(link);
                    }
        
                    const metas = document.head.getElementsByTagName('meta') || [];
                    for(const m of metas) {
                        if(m.name === 'description') obj.description = m.content;
                        else if(m.name === 'keyword') obj.keyword = m.content;
                    }
                    return obj;  
                }
                catch(e) {
                    console.log(e);
                    return null;
                }
            }); 
            page.close();  
            resolve(res);   
        }, 3000);
        
    });
    
     
    
 }

async function close() {
    if(browser) await browser.close();
    browser = null;
}

module.exports = {
    get,
    close
};