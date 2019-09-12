const get = require('../lib/request');
const parseHtml = require("../lib/parseHtml");
const tunnel = require('tunnel');
const fs = require('fs');
const path = require('path');

const host = 'nodejs.org';
const protol = 'https';
const opts = {
    url: 'https://nodejs.org/zh-cn/',
    /*agent: tunnel.httpsOverHttps({
      proxy: {
        host: '127.0.0.1',
        port: 12639
      }
    })*/
  }

get(opts).then((ret) => {
    //console.log(res.toString('utf8'));
    //fs.writeFileSync(path.join(__dirname, "node.html"), res);

    let result = parseHtml.parse(ret.data);
    if(result.styles && result.styles.length) {
        for(let n of result.styles) {
            let href = n.attr('href');
            if(/^\/[^\/]/.test(href)) {
                href
            }
        }
    }
    console.log(ret.res.req);
}).catch( err => {
    console.log(err);
});

