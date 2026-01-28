const AdmZip = require('adm-zip');

const zip = new AdmZip();
zip.addLocalFolder('dist', false);
zip.writeZip('dtm-fns.zip');

console.log('Created dtm-fns.zip');
