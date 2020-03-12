
const parseHtml = require('../lib/parseHtml');
const requestWeb = require('../lib/request');

async function getPage(url) {
    const html = await requestWeb(url);
    const result = parseHtml.parse(html);
    return result;
}

getPage('https://www.runoob.com/js/js-intro.html').then(ret => {

    console.log(ret);
}).catch(e=>{
    console.log(e);
});
