const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let Browser = null;

async function start() {
  
  Browser = await puppeteer.launch();

  const files = fs.readdirSync(path.resolve(__dirname, '../data/baike/'));

  const whites = fs.readFileSync(path.resolve(__dirname, '../data/baike_md/list.txt'), 'utf8');

    let promiseQueue = [];
    for(let i=0; i<files.length; i++) {
      const f = files[i];
        const ext = path.extname(f);
        if(ext !== '.html' || !whites.includes(f)) continue;

        console.log(`${i}/${files.length}`, f);
    
        const mdfile = `data/baike_md/${f.replace(/\.html$/, '.md')}`;
        if(fs.existsSync(mdfile)) continue;

        const p = convertToPDF(path.resolve(__dirname, '../data/baike/' + f), mdfile);
        promiseQueue.push(p);

        if(promiseQueue.length >= 10 || i >= files.length-1) {
            await Promise.all(promiseQueue);
            promiseQueue = [];
        }
    }
  await Browser.close();
}
start();

async function convertToPDF(file, txtName) {

  const filename = path.basename(file);
  console.log(file, filename);

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

      meta && fs.writeFile(txtName, meta.md, (err)=>{
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
      //setTimeout(async () => {
        try {

          //await page.waitForNavigation();

          const meta = await page.evaluate(async ()=>{
            let obj = {
              links: []
            };
            try {
              window.scrollTo(0, document.body.scrollHeight);
              function deleteElement(selector) {
                const els = document.querySelectorAll(selector);
                if(!els) return;
                for(const el of els) {
                    el.remove();
                }
              }
              function getElementText(selector, parent=document) {
                const node = parent.querySelector(selector);
                if(node) return node.innerText;
                else return '';
              }

              deleteElement('.J-part-audio-play');
              deleteElement('.j-edit-link');
              let md = '';

              const wrapper = document.querySelector('.content-wrapper');
              const h1 = getElementText('.J-lemma-title');
              md += `# ${h1}`;
              const desc = getElementText('.lemma-desc');
              md += `\n${desc}`;

              const summary = getElementText('.lemma-summary.J-summary', wrapper);
              md += `\n${summary}`;

              //const cats = getElementText('.J-basic-info', wrapper);
              //md += `\n${cats}`;

              const contentEls = wrapper.querySelectorAll('.para-title.level-2,.para.MARK_MODULE');
              for(const el of contentEls) {
                if(el.classList.contains('level-2')) md += `\n## ${el.innerText}`;
                else md += `\n${el.innerText}`;
              }

              obj = {
                url: location.href,
                text: document.body.innerText,
                html: document.body.parentElement.innerHTML,
                head: document.head.innerHTML,
                title: document.title,
                md
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
    //}, 0);      
  });
}
