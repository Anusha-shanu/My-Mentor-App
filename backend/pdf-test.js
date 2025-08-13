import fs from 'fs';
import pdfParse from 'pdf-parse';

async function testPdfParse() {
  try {
    // ✅ Point directly to your PDF file
    const dataBuffer = fs.readFileSync('./sample.pdf');

    const data = await pdfParse(dataBuffer);

    console.log("\n=== PDF Text Content ===\n");
    console.log(data.text);
    console.log("\n=== End of PDF Text ===\n");
  } catch (err) {
    console.error("Error parsing PDF:", err.message);
  }
}

testPdfParse();
