
const parseHtml = require('./parseHtml');
const requestWeb = require('./request');

async function getPage(url, option) {
    const html = await requestWeb(url);
    const result = parseHtml.parse(html, option);

    
    return result;
}

exports.get = getPage;