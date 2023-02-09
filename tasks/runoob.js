
const { get } = require('../lib/page');


get('https://www.runoob.com/js/js-intro.html').then(ret => {

    console.log(ret.$.text());
}).catch(e=>{
    console.log(e);
});
