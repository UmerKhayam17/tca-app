const PDFDocument = require('pdfkit');

async function renderResultCardPdf(result) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.fontSize(18).text('Academy Result Card', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Exam: ${result.exam?.title || ''}`);
      doc.text(`Percentage: ${result.percentage}%`);
      doc.text(`Grade: ${result.grade || ''}`);
      doc.text(`GPA: ${result.gpa ?? ''}`);
      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}

module.exports = { renderResultCardPdf };
