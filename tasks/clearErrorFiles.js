const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('data/baike');

for(const f of files) {
    const p = path.join('data/baike', f);
    const ext = path.extname(p);
    if(ext === '.html') {
        const html = fs.readFileSync(p, {
            encoding: 'utf8'
        });
        // 触发了验证的错误文件，移除
        if(html.includes('百度百科-验证')) {
            fs.unlinkSync(p);
            fs.unlinkSync(p.replace('.html', '.pdf'));
            console.log('移除验证文件，', p);
        }
    }
}

