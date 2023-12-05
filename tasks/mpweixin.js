const puppeteer = require('puppeteer');
const fs = require('fs');

let Browser = null;
const maxDeep = 0;// 最深递归层数

async function start(biz) {
  
  Browser = await puppeteer.launch(); 
  
  const url = `https://mp.weixin.qq.com/mp/profile_ext?action=home&__biz=MzI5MjY0Njc5MA==&scene=110#wechat_redirect`;

  const data = await getWebData(url);
  await Browser.close();

  console.log(data.ua);

  fs.writeFileSync('data/mpweixin/' + biz + '.html', data.html);
}
start('MzU0OTk2MDk0Nw==');

async function getWebData(url, deep = 0) {
  if(deep > maxDeep) return null; // 限制层级

  console.log('start', url);

  return new Promise(async (resolve, reject) => {
    let page = new puppeteer.Page();
    try { 
      page = await Browser.newPage();
      page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.41(0x18002930) NetType/WIFI Language/zh_CN');

      await page.goto(url, {waitUntil: 'networkidle0'});  

      let meta = await getPageMeta(page); 

      if(meta.error) {

        console.log(meta.url, meta.error);
        throw meta.error;
      }
      

        
        page.close();

        resolve(meta);

      
    }
    catch(e) {
      console.error(e);
      page && page.close();

      resolve(null);
    }
  });  
}

async function getPageMeta(page = new puppeteer.Page()) {
  return new Promise(async (resolve, reject)=>{
      setTimeout(async () => {
        try {

          //await page.waitForNavigation();

          const meta = await page.evaluate(async ()=>{
            let obj = {
              links: []
            };
            try {
              window.scrollTo(0, document.body.scrollHeight);

              function deleteElement(selector) {
                document.querySelector(selector) && document.querySelector(selector).remove();
              }
              
              
              obj = {
                url: location.href,
                text: document.body.innerText,
                html: document.body.parentElement.innerHTML,
                head: document.head.innerHTML,
                title: document.title,
                ua: window.navigator.userAgent,
                categories: [],
                links: []
              };

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
    }, 5000);      
  });
}
