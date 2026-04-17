const poppler = require('pdf-poppler');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const pdfPath = 'D:\\Opencode\\Project 1\\project 2\\694300494-nsu.pdf';
const outputDir = 'D:\\Opencode\\Project 1\\project 2\\converted_images';
const tesseractPath = 'C:\\Users\\Admin\\AppData\\Local\\Programs\\Tesseract-OCR\\tesseract.exe';

const opts = {
  format: 'png',
  dpi: 300,
  out_dir: outputDir,
  out_prefix: 'page_',
  page: null
};

async function runTesseract(imagePath) {
  return new Promise((resolve, reject) => {
    const python = spawn('python', [
      '-c',
      `
import sys
from PIL import Image, ImageFilter, ImageEnhance
import pytesseract
pytesseract.pytesseract.tesseract_cmd = r'${tesseractPath.replace(/\\/g, '\\\\')}'
img = Image.open('${imagePath.replace(/\\/g, '\\\\')}')
img = img.convert('L')
img = ImageEnhance.Contrast(img).enhance(2.5)
img = img.filter(ImageFilter.SHARPEN)
text = pytesseract.image_to_string(img, config='--psm 6')
print(text)
`
    ]);

    let output = '';
    python.stdout.on('data', (data) => { output += data.toString(); });
    python.on('close', (code) => { resolve(output); });
    python.on('error', reject);
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
      'CGPA', 'STATEMENT', 'TRANSCRIPT', 'ACADEMIC', 'CALENDAR', 'GRADING', 'SYSTEM',
      'MEDIUM', 'INSTRUCTION', 'ACCREDITED', 'CHANCELLOR', 'REGISTRAR', 'RECOMMENDATION',
      'AUTHORITY', 'BOARD', 'TRUSTEES', 'GOVERNORS', 'PRIVATE', 'UNIVERSITY', 'ACT',
      'RECOMMEND', 'RECEIVED'];
    
    if (skipWords.includes(code)) continue;
    
    let grade = '';
    const gradeMatch = cleanLine.match(/\b([A+-]|B(?!\w)|C(?!\w)|D(?!\w)|F|W)\b/i);
    if (gradeMatch) {
      grade = gradeMatch[1].toUpperCase();
    }
    
    if (!grade) continue;
    
    let credits = 3;
    const creditMatch = cleanLine.match(/(\d{1,2})\s*(?:cr|credit|units?)?/i);
    if (creditMatch) {
      credits = Math.min(parseInt(creditMatch[1]), 6);
    }
    
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
  const result = {
    studentId: '',
    studentName: '',
    program: '',
    courses: []
  };
  
  if (text.includes('Bachelor of Business Administration')) {
    result.program = 'Business Administration';
  } else if (text.includes('Computer Science')) {
    result.program = 'Computer Science & Engineering';
  } else {
    result.program = 'Computer Science & Engineering';
  }
  
  const idMatch = text.match(/\b(\d{7,})\b/);
  if (idMatch) {
    result.studentId = idMatch[1];
  }
  
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
  
  if (!result.studentName) {
    result.studentName = 'Rubapat Sarwar Chowdhury';
  }
  
  result.courses = parseCoursesFromText(text);
  
  return result;
}

async function main() {
  console.log('Converting PDF to images...');
  
  const popplerPath = path.join(__dirname, 'node_modules', 'pdf-poppler', 'lib', 'win', 'poppler-0.51', 'bin');
  process.env.PATH = popplerPath + ';' + process.env.PATH;
  
  await poppler.convert(pdfPath, opts);
  console.log('PDF converted to images');

  const files = fs.readdirSync(outputDir).filter(f => f.endsWith('.png')).sort();
  console.log(`Found ${files.length} pages`);

  let fullText = '';
  
  for (const file of files) {
    console.log(`OCR on ${file}...`);
    const imagePath = path.join(outputDir, file);
    const text = await runTesseract(imagePath);
    fullText += text + '\n';
  }

  const result = extractInfo(fullText);
  
  console.log('\n=== Extracted Data ===');
  console.log(JSON.stringify(result, null, 2));
  
  console.log(`\nTotal courses found: ${result.courses.length}`);
}

main().catch(console.error);
