const fs = require('fs');
const path = require('path');
//const pdf2json = require('node-pdf-to-json');

const url = path.resolve(__dirname , '../data/baike/组织结构.pdf');

const cheerio = require('cheerio')
const html = fs.readFileSync(url, 'gb2312');
//const $ = cheerio.load(html);
 
//const text = $('body').text();
console.log(html);

/*
pdf2json.load(url).then((contents) => {
    let text = '';
    for(const item of contents) {
        text += combinItems(item);
    }
    console.log(text);
});

function combinItems(item) {
    let text = item.text;
    if(item.type) text += '\n';
    if(item.items && item.items.length) {
        for(const o of item.items) {
            text += combinItems(o);
        }
    }
    return text;
}*/