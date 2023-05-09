const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let Browser = null;

async function start() {
  
  Browser = await puppeteer.launch();

  const files = fs.readdirSync(path.resolve(__dirname, '../data/baike/'));

    for(const f of files) {
        const ext = path.extname(f);
        if(ext !== '.html') continue;
        
        await convertToPDF(path.resolve(__dirname, '../data/baike/' + f));
    }
  await Browser.close();
}
start();

async function convertToPDF(file) {

  const filename = path.basename(file);
  console.log(file, filename);

  const txtName = `data/baike/${filename.replace(/\.html$/, '.txt')}`;
  if(fs.existsSync(txtName)) {
    console.log(file , '已经转换过，跳过', txtName);
    return null;
  }

  return new Promise(async (resolve, reject) => {
    let page = null;
    try { 
      page = await Browser.newPage();
      await page.goto(file, {waitUntil: 'networkidle0'});  

      let meta = await getPageMeta(page);      


      if(meta.error) {

        console.log(meta.url, meta.error);
        throw meta.error;
      }

      meta && fs.writeFile(txtName, meta.text, (err)=>{
        err && console.log(err);
      });    

      await page.close();
      
    }
    catch(e) {
      console.error(e);
      page && page.close();
    }
    resolve(page);
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

              
              deleteElement('#J-second-wrapper');
               
              obj = {
                url: location.href,
                text: document.body.innerText,
                html: document.body.parentElement.innerHTML,
                head: document.head.innerHTML,
                title: document.title,
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
    }, 200);      
  });
}
