const puppeteer = require('puppeteer');
const fs = require('fs');

const webCache = JSON.parse(fs.readFileSync('data/baike/web.json'));
const words = fs.readFileSync('data/baike/words.dict', {
  encoding: 'utf8'
}).split('\n');

async function start(title) {
  const browser = await puppeteer.launch();

  await convertToPDF(browser, title);
  

  await browser.close();

  fs.writeFileSync('data/baike/web.json', JSON.stringify(webCache));
}
start(webCache.title, webCache.root);

async function convertToPDF(browser, title, url, parentTitle) {

  if(!title) return null;
  if(!url) url = `https://baike.baidu.com/item/${encodeURIComponent(title)}`;

  const htmlName = `data/baike/${title}.html`;
  if(fs.existsSync(htmlName)) {
    console.log(title , '已经抓取过，跳过');
    return null;
  }
  
  // 缓存
  webCache.data[title] = {
    title,
    url,
    parent: parentTitle || ''
  };

  console.log('start', title, url);

  return new Promise(async (resolve, reject) => {
    try { 
      const page = await browser.newPage();
      await page.goto(url, {waitUntil: 'networkidle0'});  

      let meta = await getPageMeta(page);      

      if(meta.error) {
        console.log(meta.url, meta.error);
        throw meta.error;
      }

      meta && fs.writeFile(htmlName, meta.html, (err)=>{
        err && console.log(err);
      });
      //pageInfo.categories = meta.categories;

      /*fs.writeFile('data/baike/web.json', JSON.stringify(webCache), (err)=>{
        err && console.error(err);
      });*/
      
      meta.loading = true;
      setTimeout(async () => {
        // 递归抓取
        if(meta && meta.links && meta.links.length) {
          for(const link of meta.links) {
            const d = webCache.data[link.name];
            if(d) {
              if(d.disabled) {
                console.log(link.name , '非合格的词汇，跳过');
                continue;
              }              
            }
            if(!words.includes(link.name)) {
              console.log(link.name , '不在词典内，跳过');
              continue;
            }
            await convertToPDF(browser, link.name.trim(), link.href, title);            
          }
        }

        if(!meta.loading) resolve(meta);
        else meta.loading = false;

      }, 10);

      setTimeout(async ()=>{
        await page.pdf({path: `data/baike/${title}.pdf`, format: 'a4', displayHeaderFooter: true});
        await page.close();

        if(!meta.loading) resolve(meta);
        else meta.loading = false;

      }, 1000);

      
    }
    catch(e) {
      console.error(e);
      resolve(null);
    }
  });  
}

async function getPageMeta(page) {
  return new Promise(async (resolve)=>{
    setTimeout(async () => {
      const meta = await page.evaluate(async ()=>{
        let obj = {
          links: []
        };
        try {
          window.scrollTo(0, document.body.scrollHeight);

          function deleteElement(selector) {
            document.querySelector(selector) && document.querySelector(selector).remove();
          }
          
          deleteElement('.lemmaWgt-searchHeader');
          deleteElement('.header-wrapper');
          deleteElement('.navbar-wrapper');
          deleteElement('.side-content');
          deleteElement('.top-tool');
          deleteElement('.new-bdsharebuttonbox');
          deleteElement('.tashuo-bottom');
          deleteElement('.after-content');
          deleteElement('.wgt-footer-main');
          deleteElement('.btn-list');
          document.querySelector('.main-content') && (document.querySelector('.main-content').style.width = '95%');
          document.querySelector('.content') && (document.querySelector('.content').style.width = '90%');
          
          obj = {
            url: location.href,
            text: document.body.innerText,
            html: document.body.parentElement.innerHTML,
            head: document.head.innerHTML,
            title: document.title,
            categories: [],
            links: []
        };

        // 分类
        const cats = document.querySelectorAll('ul.polysemantList-wrapper li');
          for(const c of cats) {
              const name = c.innerText.replace('▪', '');
              name && obj.categories.push(name);
          }

          const links = document.querySelectorAll('a');
          for(const m of links) {
              const href = m.href;
              if(href) {
                const name = m.getAttribute('data-lemmatitle') || m.text;
                if(href.indexOf(location.pathname) > 0) continue;
                if(href.indexOf(location.origin + '/item/') < 0) continue;
                if(name.indexOf('帮助中心') > -1 || !/^[a-zA-Z0-9_\.\u4e00-\u9fa5]*$/.test(name)) continue;

                obj.links.push({
                  href,
                  name: name
                });
              }
          }

          deleteElement('.before-content');

          return obj;  
      }
      catch(e) {
          console.log(e);
          obj.error = e.message;
          return obj;
      }
    });
    resolve(meta);
    }, 500);      
  });
}
