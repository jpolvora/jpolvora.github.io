import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_FILE = path.join(ROOT_DIR, 'curriculo.html');
const OUTPUT_PDF = path.join(ROOT_DIR, 'curriculo-jone-polvora.pdf');

function findBrowserExecutable() {
  const possiblePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

export async function generateResumePdf() {
  console.log('\n📄 Generating Resume PDF (curriculo-jone-polvora.pdf)…');

  if (!fs.existsSync(HTML_FILE)) {
    console.error(`❌ Source HTML not found: ${HTML_FILE}`);
    return false;
  }

  const browserPath = findBrowserExecutable();
  if (!browserPath) {
    console.warn('⚠️ No Chrome/Edge browser found for automated PDF export.');
    return false;
  }

  const tempPdf = path.join(os.tmpdir(), `curriculo-jone-polvora-${Date.now()}.pdf`);
  const fileUrl = `file:///${HTML_FILE.replace(/\\/g, '/')}`;

  const cmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${tempPdf}" "${fileUrl}"`;
  
  try {
    execSync(cmd, { stdio: 'pipe' });
    
    // Wait slightly if needed to ensure file flush
    if (fs.existsSync(tempPdf)) {
      fs.copyFileSync(tempPdf, OUTPUT_PDF);
      try { fs.unlinkSync(tempPdf); } catch {}
      
      const stats = fs.statSync(OUTPUT_PDF);
      console.log(`✅ Resume PDF successfully created: ${OUTPUT_PDF} (${(stats.size / 1024).toFixed(1)} KB)`);
      return true;
    } else {
      console.warn('⚠️ Temp PDF was not created.');
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to generate PDF:', error.message);
    return false;
  }
}

// Allow direct execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  generateResumePdf();
}
