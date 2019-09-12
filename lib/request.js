const simpleget = require("simple-get");
//const tunnel = require('tunnel');

/**
 * 请求WEB获取html
 */
 async function get(url) {
     const promise = new Promise((resolve, reject) => {
        //tunnel.httpsOverHttp({
        //    proxy: proxy
        //  });
        simpleget.concat(url, (err, res, data) => {
            if(err) {
                reject && reject(err);
            }
            else {
                resolve({
                    res,
                    data
                });
            }
        });
     });
    return promise;
 }


module.exports = get;