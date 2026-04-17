const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const poppler = require('pdf-poppler');

const router = express.Router();

const TESSERACT_PATH = 'C:\\Users\\Admin\\AppData\\Local\\Programs\\Tesseract-OCR\\tesseract.exe';

async function runTesseract(imagePath) {
  return new Promise((resolve, reject) => {
    console.log('Running Tesseract on:', imagePath);
    
    const python = spawn('python', ['-c', `
import sys
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'${TESSERACT_PATH.replace(/\\/g, '\\\\')}'
img = Image.open('${imagePath.replace(/\\/g, '\\\\')}')
img = img.convert('L')
img = ImageEnhance.Contrast(img).enhance(2.5)
img = img.filter(ImageFilter.SHARPEN)
text = pytesseract.image_to_string(img, config='--psm 6')
print(text)
`], { timeout: 120000 });

    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => { output += data.toString(); });
    python.stderr.on('data', (data) => { errorOutput += data.toString(); });
    
    python.on('close', (code) => {
      console.log('Tesseract done, code:', code);
      if (code !== 0) {
        console.error('Tesseract error:', errorOutput);
        reject(new Error(errorOutput || 'Tesseract failed'));
        return;
      }
      resolve(output);
    });
    
    python.on('error', (err) => {
      console.error('Python spawn error:', err);
      reject(err);
    });
  });
}

function parseCoursesFromText(text) {
  const courses = [];
  const semesterPattern = /(Spring|Summer|Fall|Winter)\s*[\'"]?\s*(\d{4})/i;
  let currentSemester = '';
  const lines = text.split('\n');
  
  for (const line of lines) {
    const semMatch = line.match(semesterPattern);
    if (semMatch) {
      currentSemester = `${semMatch[1]} ${semMatch[2]}`;
      continue;
    }
    
    const cleanLine = line.replace(/[^A-Za-z0-9+\-./\s]/g, ' ').replace(/\s+/g, ' ').trim();
    
    const courseMatch = cleanLine.match(/([A-Z]{2,})\s*[\/\-.]?\s*(\d{3,})/);
    if (!courseMatch) continue;
    
    const code = (courseMatch[1] + courseMatch[2]).toUpperCase();
    if (code.length < 5) continue;
    
    const skipWords = ['THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'WITH', 'FROM', 
      'SCHOOL', 'UNIVERSITY', 'OFFICE', 'NORTH', 'SOUTH', 'PRIVATE', 'BANGLADESH',
      'FOUNDATION', 'CONFERRED', 'DEGREE', 'BACHELOR', 'AWARDED', 'REQUIREMENTS',
      'COMPLETED', 'ELECTIVE', 'CORE', 'MAJOR', 'MINOR', 'TOTAL', 'CREDITS', 'GPA',
      'CGPA', 'STATEMENT', 'TRANSCRIPT', 'ACADEMIC', 'CALENDAR', 'GRADING', 'SYSTEM'];
    
    if (skipWords.includes(code)) continue;
    
    const gradeMatch = cleanLine.match(/\b([A+-]|B(?!\w)|C(?!\w)|D(?!\w)|F|W)\b/i);
    if (!gradeMatch) continue;
    
    const grade = gradeMatch[1].toUpperCase();
    let credits = 3;
    const creditMatch = cleanLine.match(/(\d{1,2})\s*(?:cr|credit|units?)?/i);
    if (creditMatch) credits = Math.min(parseInt(creditMatch[1]), 6);
    
    if (['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'D', 'F', 'W'].includes(grade)) {
      courses.push({ code, credits, grade, semester: currentSemester });
    }
  }
  
  const seen = new Set();
  const unique = [];
  for (const c of courses) {
    const key = `${c.code}-${c.semester}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(c);
    }
  }
  return unique;
}

function extractInfo(text) {
  const result = { studentId: '', studentName: '', program: '', courses: [] };
  
  if (text.includes('Bachelor of Business Administration')) {
    result.program = 'Business Administration';
  } else if (text.includes('Computer Science')) {
    result.program = 'Computer Science & Engineering';
  } else {
    result.program = 'Computer Science & Engineering';
  }
  
  const idMatch = text.match(/\b(\d{7,})\b/);
  if (idMatch) result.studentId = idMatch[1];
  
  const namePatterns = [
    /(?:Rubapat|Rubayet|Md|Mohammad|Muhammad|Ahmed|Ali|Hossain|Hasan|Khan|Sinha|Chowdhury|Choudhury)\s+[A-Za-z]+\s+[A-Za-z]+/i,
    /UPON\s+([A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+)/i
  ];
  
  for (const p of namePatterns) {
    const m = text.match(p);
    if (m && m[1]) {
      result.studentName = m[1].trim();
      break;
    }
  }
  
  if (!result.studentName) result.studentName = 'Student Name';
  result.courses = parseCoursesFromText(text);
  
  return result;
}

async function convertPdfToImages(pdfPath, outputDir) {
  const popplerPath = path.join(__dirname, '..', 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin');
  process.env.PATH = popplerPath + ';' + process.env.PATH;
  
  const opts = {
    format: 'png',
    dpi: 300,
    out_dir: outputDir,
    out_prefix: 'ocr_page_',
    page: null
  };
  
  return poppler.convert(pdfPath, opts);
}

router.post('/', async (req, res) => {
  console.log('OCR request received');
  
  try {
    let filePath;
    const uploadDir = path.join(__dirname, '..', 'uploads', 'ocr');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    if (req.body.image) {
      console.log('Processing image...');
      const base64Data = req.body.image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      filePath = path.join(uploadDir, `ocr_${Date.now()}.png`);
      fs.writeFileSync(filePath, buffer);
      
      const text = await runTesseract(filePath);
      const result = extractInfo(text);
      fs.unlinkSync(filePath);
      
      return res.json({ success: true, data: result, rawText: text });
      
    } else if (req.body.pdf) {
      console.log('Processing PDF...');
      const base64Data = req.body.pdf.replace(/^data:application\/pdf;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      filePath = path.join(uploadDir, `ocr_${Date.now()}.pdf`);
      fs.writeFileSync(filePath, buffer);
      
      const outputDir = path.join(uploadDir, 'temp');
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
      
      await convertPdfToImages(filePath, outputDir);
      const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).sort();
      console.log('PDF converted to', files.length, 'images');
      
      let fullText = '';
      for (const file of files) {
        console.log('OCR on', file);
        const text = await runTesseract(path.join(outputDir, file));
        fullText += text + '\n';
      }
      
      fs.readdirSync(outputDir).forEach(f => fs.unlinkSync(path.join(outputDir, f)));
      fs.unlinkSync(filePath);
      
      const result = extractInfo(fullText);
      console.log('Extracted:', result.courses.length, 'courses');
      return res.json({ success: true, data: result, rawText: fullText });
    } else {
      return res.status(400).json({ success: false, error: 'No image or PDF provided' });
    }
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
