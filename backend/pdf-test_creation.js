// backend/createPlaceholderPDF.js
import fs from "fs";
import path from "path";

const __dirname = path.resolve();
const uploadsDir = path.join(__dirname, "test", "data");

// Ensure the folder exists
fs.mkdirSync(uploadsDir, { recursive: true });

// Placeholder PDF path
const placeholderPath = path.join(uploadsDir, "05-versions-space.pdf");

// Simple PDF content (minimal valid PDF)
const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 72 72 Td (Hello PDF Placeholder) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000110 00000 n 
0000000220 00000 n 
trailer
<< /Root 1 0 R /Size 5 >>
startxref
330
%%EOF`;

// Write the PDF
fs.writeFileSync(placeholderPath, pdfContent);
console.log(`✅ Placeholder PDF created at ${placeholderPath}`);
