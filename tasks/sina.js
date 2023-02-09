
const { get } = require('../lib/page');


get('https://finance.sina.com.cn/', {
    link: true
}).then(ret => {

    console.log(ret);
}).catch(e=>{
    console.log(e);
});
