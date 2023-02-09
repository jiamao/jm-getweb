const cheerio = require('cheerio');

// 解析整个html  结构
function parse(html, option={}) {
    const result = {
        resources: {
            styles: [],
            images: [],
            scripts: [],
            links: [],
        },
        html
    };

    //result.html = html;
    const $ = cheerio.load(html.data);

    if(option.style) {
        const styles = Array.from($('link[rel="stylesheet"]'));    
        for(let n of styles) {
            result.resources.styles.push($(n));
        }
    }
   
    if(option.script) { 
        const scripts = Array.from($('script[src]'));    
        for(let n of scripts) {
            result.resources.scripts.push($(n));
        }
    }
    
    if(option.image) {
        const imgs = Array.from($('img[src]'));    
        for(let n of imgs) {
            result.resources.images.push($(n));
        }
    }    
    if(option.link) {
        const links = Array.from($('a[href]'));    
        for(let n of links) {
            result.resources.links.push($(n).attr('href'));
        }
    }

    result.$ = $;
    result.title = $('title').text()||'';
    const keywordDom = $('meta[name="keywords"]');
    result.keywords = keywordDom && keywordDom.length?$(keywordDom[0]).attr('content'):'';
    const descDom = $('meta[name="keywords"]');
    result.description = descDom&&descDom.length?$(descDom[0]).attr('content'):'';
    result.text = $('body').text()||'';

    return result;
}

module.exports = {
    parse
}