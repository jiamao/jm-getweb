
const fs = require('fs');

const aigcCategories = JSON.parse(fs.readFileSync('./json/categories.json', 'utf8'));
const myCategories = JSON.parse(fs.readFileSync('./categories.json', 'utf8'));

for(const aigc of aigcCategories) {
    if(aigc.icon) {
        for(const myCat of myCategories) {
            if(aigc.text === myCat.name) {
                myCat.icon = aigc.icon;
            }
        }
    }
}

fs.writeFileSync('./categories.json', JSON.stringify(myCategories), 'utf8')