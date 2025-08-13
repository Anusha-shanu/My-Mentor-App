const fs = require('fs');
const pdf = require('pdf-parse');

const dataBuffer = fs.readFileSync('sample.pdf'); // ensure sample.pdf is in backend folder

pdf(dataBuffer).then(function(data) {
    console.log("PDF text content:");
    console.log(data.text);
}).catch(err => {
    console.error("Error reading PDF:", err);
});
