const $ = require('cheerio');

// 解析整个html  结构
function parse(html) {
    const result = {
        resources: {
            styles: [],
            images: [],
            scripts: []
        }
    };

    //result.html = html;
    const dom = $.load(html);

    const styles = Array.from(dom('link[rel="stylesheet"]'));    
    for(let n of styles) {
        result.resources.styles.push($(n));
    }
    
    const scripts = Array.from(dom('script[src]'));    
    for(let n of scripts) {
        result.resources.scripts.push($(n));
    }

    const imgs = Array.from(dom('img[src]'));    
    for(let n of imgs) {
        result.resources.images.push($(n));
    }

    result.dom = dom;

    return result;
}

module.exports = {
    parse
}