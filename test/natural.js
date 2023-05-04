
const natural = require('natural');

const classifier = new natural.BayesClassifier();

classifier.addDocument('中国', '国家');
classifier.addDocument('宾夕法尼亚州', '省');
classifier.addDocument('丁峰峰', '人名');
// 训练分类器
classifier.train();



const isCountry = classifier.classify('中国'); // true，是国家名
const isCity = classifier.classify('宾夕法尼亚州'); // true，是城市名
const isPerson = classifier.classify('丁峰峰'); // true，是人名


console.log(isCountry, isCity, isPerson);