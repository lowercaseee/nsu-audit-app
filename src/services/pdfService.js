const PDFDocument = require('pdfkit');

class PdfService {
  static async generate(data) {
    return new Promise((resolve) => {
      const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      const page = doc.page;
      doc.rect(0, 0, page.width, page.height).fill('#F7E8CC');

      doc.fillColor('#003366').fontSize(28).text('North South University', { align: 'center' });
      doc.moveDown(2);

      doc.fillColor('#000').fontSize(12).text('UPON RECOMMENDATION OF THE', { align: 'center' });
      doc.fontSize(14).text('School of Business', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).text('AND BY THE AUTHORITY VESTED IN THE BOARD OF TRUSTEES OF THE NORTH SOUTH UNIVERSITY', { align: 'center' });
      doc.text('AND THE BOARD OF GOVERNORS OF THE NORTH SOUTH UNIVERSITY FOUNDATION UNDER THE PRIVATE UNIVERSITY ACT 2010', { align: 'center' });
      doc.moveDown();

      doc.fontSize(12).text('HAS CONFERRED THE DEGREE OF', { align: 'center' });
      doc.moveDown();

      doc.fontSize(20).text(data.student.degree || 'Bachelor of Business Administration', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(12).text('UPON', { align: 'center' });
      doc.moveDown();

      doc.fontSize(22).text(data.student.name || 'Student Name', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(11).text('WITH ALL RIGHTS, PRIVILEGES AND OBLIGATIONS PERTAINING THERETO.', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).text('AWARDED AT NORTH SOUTH UNIVERSITY IN DHAKA, BANGLADESH', { align: 'center' });
      doc.moveDown(2);

      doc.fontSize(11).text('ON THE ' + (data.summary?.degreeCompleted ? data.summary.degreeCompleted.toUpperCase().replace(/(\d+)\s+(\w+)/, '$1 $2') : 'THIRD DAY OF JANUARY TWO THOUSAND AND TWELVE') + '.', { align: 'center' });
      doc.moveDown(3);

      doc.fontSize(10);
      doc.text('_______________________________', { align: 'center' });
      doc.text('CHAIRMAN / VICE CHANCELLOR', { align: 'center' });
      doc.text('BOARD OF TRUSTEES', { align: 'center' });
      doc.text('NORTH SOUTH UNIVERSITY', { align: 'center' });
      doc.moveDown();

      doc.text('_______________________________', { align: 'center' });
      doc.text('REGISTRAR', { align: 'center' });
      doc.end();
    });
  }
}

module.exports = PdfService;