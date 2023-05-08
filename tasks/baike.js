const puppeteer = require('puppeteer');
const fs = require('fs');

const webCache = JSON.parse(fs.readFileSync('data/baike/web.json'));
const words = fs.readFileSync('data/baike/words.dict', {
  encoding: 'utf8'
}).split('\n');

let Browser = null;
const maxDeep = 0;// 最深递归层数

async function start(title) {
  Browser = await puppeteer.launch();

  for(let index=5565; index<words.length; index++) {
    await convertToPDF(Browser, words[index]);
    console.log('第', index);
  }  

  await Browser.close();

  fs.writeFileSync('data/baike/web.json', JSON.stringify(webCache));
}
start(webCache.title, webCache.root);

async function convertToPDF(browser, title, url, parentTitle, deep = 0) {
  if(deep > maxDeep) return null; // 限制层级
  if(!title) return null;
  if(!url) url = `https://baike.baidu.com/item/${encodeURIComponent(title)}`;

  if(title.includes('排名') || title.includes('排行榜') || title.includes('100强') || title.includes('500强') || title.includes('ST中') || title.includes('《') || /\d+年/.test(title)) {
    console.log(title, '不合规则，跳过');
    return null;
  }

  const titlePath = title.replace(/["'\.\/\\]/g, '');
  const htmlName = `data/baike/${titlePath}.html`;
  const pdfName = `data/baike/${titlePath}.pdf`;
  if(fs.existsSync(htmlName)) {
    console.log(title , '已经抓取过，跳过', htmlName);
    return null;
  }
  
  // 缓存
  /*
  webCache.data[title] = {
    title,
    url,
    parent: parentTitle || ''
  };
  */

  console.log('start', title, url);

  return new Promise(async (resolve, reject) => {
    try { 
      const page = await Browser.newPage();
      await page.goto(url, {waitUntil: 'networkidle0'});  

      let meta = await getPageMeta(page);      

      // 触发了验证，则新开了个进程来处理
      if(meta.error == '触发了百度验证') {
        console.log(meta.url, meta.error);
        Browser.close();
        Browser = await puppeteer.launch();
        const res = await convertToPDF(Browser, title, url, parentTitle, deep);
        resolve(res);
        return;
      }

      if(meta.error) {
        console.log(meta.url, meta.error);
        throw meta.error;
      }

      // 多义词不保存
      meta && !meta.subLemmaList && fs.writeFile(htmlName, meta.html, (err)=>{
        err && console.log(err);
      });

      if(meta && !meta.url.startsWith('https://baike.baidu.com/item/')) {
        console.log('302到了错误的地址,', meta.url);
        resolve(null);
        return;
      }
      //pageInfo.categories = meta.categories;

      /*fs.writeFile('data/baike/web.json', JSON.stringify(webCache), (err)=>{
        err && console.error(err);
      });*/
      
      meta.loading = true;
      setTimeout(async () => {
        // 递归抓取
        if(meta && meta.links && meta.links.length && (deep < maxDeep || meta.subLemmaList)) {
          
          for(const link of meta.links) {
            
            const d = webCache.data[link.name];
            if(d) {
              if(d.disabled) {
                console.log(link.name , '非合格的词汇，跳过');
                continue;
              }              
            }
            if(!words.includes(link.name) && !meta.subLemmaList) {
              console.log(link.name , '不在词典内，跳过');
              continue;
            }

            if(meta.subLemmaList) {
              console.log('多议词抓取', link);
            }
            await convertToPDF(Browser, link.name.trim(), link.href, title, meta.subLemmaList?0:(deep+1));            
          }
        }

        if(!meta.loading) resolve(meta);
        else meta.loading = false;

      }, 10);

      setTimeout(async ()=>{
        if(!meta.subLemmaList) {
          console.log(title, pdfName);
          await page.pdf({path: pdfName, format: 'a4', displayHeaderFooter: true});
        }
        else {
          console.log('多义词', title);
        }
        await page.close();

        if(!meta.loading) resolve(meta);
        else meta.loading = false;

      }, 500);

      
    }
    catch(e) {
      console.error(e);
      resolve(null);
    }
  });  
}

async function getPageMeta(page) {
  return new Promise(async (resolve, reject)=>{
      setTimeout(async () => {
        try {
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

              // 多义词列表
              const subLemmaList = document.querySelector('.lemmaWgt-subLemmaListTitle');
              if(subLemmaList && subLemmaList.innerText.indexOf('这是一个多义词，请在下列义项上选择浏览') > -1) {
                obj.subLemmaList = true;
              }

              // 错误的页
              if(obj.url.indexOf('error.html') > -1) {
                obj.error = '词条不存在';
                return obj;
              }

              if(document.title.indexOf('百度百科-验证') > -1) {
                obj.error = '触发了百度验证';
                return obj;
              }

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
                    if(href.indexOf(location.pathname) > 0 && href.indexOf(location.pathname + '/') < 0) continue;
                    if(href.indexOf(location.origin + '/item/') < 0) continue;
                    if(name.indexOf('帮助中心') > -1 || !/^[a-zA-Z0-9_：:\-\%\.\u4e00-\u9fa5]*$/.test(name)) continue;

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
      }
      catch(e) {
        console.log(e);
        reject(e);
      }
    }, 500);      
  });
}
