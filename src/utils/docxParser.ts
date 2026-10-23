import JSZip from 'jszip';
import mammoth from 'mammoth';
import { Question, PartType, CognitiveLevel, MultipleChoiceOption, TrueFalseItem } from '../types';
import { convertOmmlElementToLatex } from './ommlToLatex';

export interface ParseResult {
  title: string;
  subject: string;
  grade: number;
  durationMinutes: number;
  chapter: string;
  questions: Question[];
  unparsedBlocks: string[];
  extractedImages: string[];
  partsFound: {
    part1: number;
    part2: number;
    part3: number;
    hasAnswerGrid: boolean;
    hasExplanations: boolean;
  };
  warnings: string[];
}

/**
 * Extracts cognitive level and custom tag from question text.
 * Matches:
 * - [BIẾT], (BIẾT), [NHẬN BIẾT]
 * - [HIỂU], (HIỂU), [THÔNG HIỂU]
 * - [HIỂU – VẬN DỤNG], [HIỂU - VẬN DỤNG]
 * - [VẬN DỤNG], (VẬN DỤNG)
 * - [VẬN DỤNG – VẬN DỤNG CAO], [VẬN DỤNG - VẬN DỤNG CAO]
 * - [VẬN DỤNG CAO], (VẬN DỤNG CAO), [VDC]
 */
export function extractCognitiveLevel(text: string): { 
  level: CognitiveLevel; 
  customTag?: string;
  cleanText: string 
} {
  let level: CognitiveLevel = 'THONG_HIEU';
  let customTag: string | undefined = undefined;
  let cleanText = text;

  // Combination 1: [VẬN DỤNG – VẬN DỤNG CAO]
  if (/\[\s*VẬN\s+DỤNG\s*[–—-]\s*VẬN\s+DỤNG\s+CAO\s*\]|\(\s*VẬN\s+DỤNG\s*[–—-]\s*VẬN\s+DỤNG\s+CAO\s*\)/i.test(cleanText)) {
    level = 'VAN_DUNG_CAO';
    customTag = '[VẬN DỤNG – VẬN DỤNG CAO]';
    cleanText = cleanText.replace(/\[\s*VẬN\s+DỤNG\s*[–—-]\s*VẬN\s+DỤNG\s+CAO\s*\]|\(\s*VẬN\s+DỤNG\s*[–—-]\s*VẬN\s+DỤNG\s+CAO\s*\)/gi, ' ');
  }
  // Combination 2: [HIỂU – VẬN DỤNG]
  else if (/\[\s*HIỂU\s*[–—-]\s*VẬN\s+DỤNG\s*\]|\(\s*HIỂU\s*[–—-]\s*VẬN\s+DỤNG\s*\)/i.test(cleanText)) {
    level = 'THONG_HIEU';
    customTag = '[HIỂU – VẬN DỤNG]';
    cleanText = cleanText.replace(/\[\s*HIỂU\s*[–—-]\s*VẬN\s+DỤNG\s*\]|\(\s*HIỂU\s*[–—-]\s*VẬN\s+DỤNG\s*\)/gi, ' ');
  }
  // Single levels
  else if (/\[\s*(?:VẬN\s+DỤNG\s+CAO|VDC)\s*\]|\(\s*(?:VẬN\s+DỤNG\s+CAO|VDC)\s*\)/i.test(cleanText)) {
    level = 'VAN_DUNG_CAO';
    customTag = '[VẬN DỤNG CAO]';
    cleanText = cleanText.replace(/\[\s*(?:VẬN\s+DỤNG\s+CAO|VDC)\s*\]|\(\s*(?:VẬN\s+DỤNG\s+CAO|VDC)\s*\)/gi, ' ');
  }
  else if (/\[\s*VẬN\s+DỤNG\s*\]|\(\s*VẬN\s+DỤNG\s*\)/i.test(cleanText)) {
    level = 'VAN_DUNG';
    customTag = '[VẬN DỤNG]';
    cleanText = cleanText.replace(/\[\s*VẬN\s+DỤNG\s*\]|\(\s*VẬN\s+DỤNG\s*\)/gi, ' ');
  }
  else if (/\[\s*(?:HIỂU|THÔNG\s+HIỂU|TH)\s*\]|\(\s*(?:HIỂU|THÔNG\s+HIỂU|TH)\s*\)/i.test(cleanText)) {
    level = 'THONG_HIEU';
    customTag = '[HIỂU]';
    cleanText = cleanText.replace(/\[\s*(?:HIỂU|THÔNG\s+HIỂU|TH)\s*\]|\(\s*(?:HIỂU|THÔNG\s+HIỂU|TH)\s*\)/gi, ' ');
  }
  else if (/\[\s*(?:BIẾT|NHẬN\s+BIẾT|NB)\s*\]|\(\s*(?:BIẾT|NHẬN\s+BIẾT|NB)\s*\)/i.test(cleanText)) {
    level = 'NHAN_BIET';
    customTag = '[BIẾT]';
    cleanText = cleanText.replace(/\[\s*(?:BIẾT|NHẬN\s+BIẾT|NB)\s*\]|\(\s*(?:BIẾT|NHẬN\s+BIẾT|NB)\s*\)/gi, ' ');
  }

  return { level, customTag, cleanText: cleanText.trim() };
}

/**
 * Pre-processes DOCX file using JSZip to:
 * 1. Convert Word OMML equations (<m:oMath>) to LaTeX ($...$)
 * 2. Extract embedded images from word/media/* to base64 Data URLs
 */
async function preprocessDocxWithZip(arrayBuffer: ArrayBuffer): Promise<{
  modifiedBuffer: ArrayBuffer;
  extractedImages: string[];
}> {
  const extractedImages: string[] = [];

  try {
    const zip = await JSZip.loadAsync(arrayBuffer);

    // 1. Extract all media files into data URLs
    const mediaFiles: Record<string, string> = {};
    for (const [filename, fileObj] of Object.entries(zip.files)) {
      if (filename.startsWith('word/media/') && !fileObj.dir) {
        const ext = filename.split('.').pop()?.toLowerCase() || 'png';
        const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'gif' ? 'image/gif' : 'image/png';
        const base64Data = await fileObj.async('base64');
        const dataUrl = `data:${mimeType};base64,${base64Data}`;
        mediaFiles[filename] = dataUrl;
        extractedImages.push(dataUrl);
      }
    }

    // 2. Read word/document.xml
    const docXmlFile = zip.file('word/document.xml');
    if (!docXmlFile) {
      return { modifiedBuffer: arrayBuffer, extractedImages };
    }

    const docXmlStr = await docXmlFile.async('string');
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(docXmlStr, 'application/xml');

    // 3. Find all <m:oMath> and <m:oMathPara> elements and convert to LaTeX
    const oMathNodes = Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/math', 'oMath'));
    const oMathParaNodes = Array.from(xmlDoc.getElementsByTagNameNS('http://schemas.openxmlformats.org/officeDocument/2006/math', 'oMathPara'));
    const allMathNodes = [...oMathNodes, ...oMathParaNodes];

    if (allMathNodes.length > 0) {
      allMathNodes.forEach((mathNode) => {
        try {
          const latex = convertOmmlElementToLatex(mathNode);
          if (latex) {
            // Create a standard <w:r><w:t> element with $latex$
            const textRun = xmlDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:r');
            const textElem = xmlDoc.createElementNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'w:t');
            textElem.setAttribute('xml:space', 'preserve');
            textElem.textContent = ` $${latex}$ `;
            textRun.appendChild(textElem);

            // Replace mathNode with textRun
            if (mathNode.parentNode) {
              mathNode.parentNode.replaceChild(textRun, mathNode);
            }
          }
        } catch (e) {
          console.warn('Failed to convert an OMML node:', e);
        }
      });

      // Serialize modified XML and save back to zip
      const serializer = new XMLSerializer();
      const newXmlStr = serializer.serializeToString(xmlDoc);
      zip.file('word/document.xml', newXmlStr);

      const modifiedBuffer = await zip.generateAsync({ type: 'arraybuffer' });
      return { modifiedBuffer, extractedImages };
    }

    return { modifiedBuffer: arrayBuffer, extractedImages };
  } catch (err) {
    console.warn('JSZip pre-processing failed, falling back to standard mammoth:', err);
    return { modifiedBuffer: arrayBuffer, extractedImages };
  }
}

/**
 * Parses all answer tables from HTML or text.
 * Supports:
 * - Vertical Table: Câu | Mức độ | Đáp án (e.g., 1 | [BIẾT] | C)
 * - Transposed True/False Table: Lệnh hỏi | Câu 1 | Câu 2 (rows are a), b), c), d))
 * - Standard True/False Table: Câu | a) | b) | c) | d)
 * - Horizontal Table: Câu | 1 | 2 | 3 ... Đáp án | C | A | B ...
 */
function parseAnswerTables(html: string): {
  part1Answers: Record<number, string>;
  part1Levels: Record<number, { level: CognitiveLevel; customTag?: string }>;
  part2Answers: Record<number, Record<string, 'D' | 'S'>>;
  part3Answers: Record<number, string>;
  part3Levels: Record<number, { level: CognitiveLevel; customTag?: string }>;
} {
  const part1Answers: Record<number, string> = {};
  const part1Levels: Record<number, { level: CognitiveLevel; customTag?: string }> = {};
  const part2Answers: Record<number, Record<string, 'D' | 'S'>> = {};
  const part3Answers: Record<number, string> = {};
  const part3Levels: Record<number, { level: CognitiveLevel; customTag?: string }> = {};

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tables = Array.from(doc.querySelectorAll('table'));

    const normalizeTF = (val: string): 'D' | 'S' | null => {
      const clean = val.toUpperCase().trim();
      if (clean.includes('Đ') || clean.includes('D') || clean === 'T' || clean.includes('TRUE')) return 'D';
      if (clean.includes('S') || clean === 'F' || clean.includes('FALSE')) return 'S';
      return null;
    };

    tables.forEach((table) => {
      const rows = Array.from(table.querySelectorAll('tr'));
      if (rows.length < 2) return;

      const rowTexts = rows.map((r) =>
        Array.from(r.querySelectorAll('td, th')).map((c) => (c.textContent || '').trim())
      );

      const headerRow = rowTexts[0];
      const headerStr = headerRow.join(' ').toLowerCase();

      // Case 1: Transposed True/False Table:
      // Row 0: "Lệnh hỏi" | "Câu 1" | "Câu 2" ...
      // Row 1: "a)" | "Đ" | "S"
      // Row 2: "b)" | "Đ" | "Đ"
      // Row 3: "c)" | "S" | "Đ"
      // Row 4: "d)" | "Đ" | "S"
      if (headerStr.includes('lệnh hỏi') || (headerRow[0] && headerRow[0].toLowerCase().includes('lệnh'))) {
        // Find columns corresponding to Câu 1, Câu 2...
        const colToQNum: Record<number, number> = {};
        for (let col = 1; col < headerRow.length; col++) {
          const match = headerRow[col].match(/\d+/);
          if (match) {
            colToQNum[col] = parseInt(match[0], 10);
            if (!part2Answers[colToQNum[col]]) {
              part2Answers[colToQNum[col]] = {};
            }
          }
        }

        // Iterate through rows (a, b, c, d)
        for (let r = 1; r < rowTexts.length; r++) {
          const row = rowTexts[r];
          const subItemMatch = row[0].match(/([a-d])\)?/i);
          if (subItemMatch) {
            const subLabel = subItemMatch[1].toLowerCase();
            for (let col = 1; col < row.length; col++) {
              const qNum = colToQNum[col];
              if (qNum && row[col]) {
                const tf = normalizeTF(row[col]);
                if (tf) {
                  part2Answers[qNum][subLabel] = tf;
                }
              }
            }
          }
        }
        return;
      }

      // Case 2: Standard True/False Table:
      // Row 0: "Câu" | "a)" | "b)" | "c)" | "d)"
      // Row 1: "Câu 1" | "Đ" | "S" | "Đ" | "Đ"
      const isStandardPart2Table =
        headerRow.some((cell) => /a\)|a\b/i.test(cell)) &&
        headerRow.some((cell) => /b\)|b\b/i.test(cell));

      if (isStandardPart2Table) {
        let colA = -1, colB = -1, colC = -1, colD = -1;
        headerRow.forEach((h, idx) => {
          if (/\ba\)?\b/i.test(h)) colA = idx;
          if (/\bb\)?\b/i.test(h)) colB = idx;
          if (/\bc\)?\b/i.test(h)) colC = idx;
          if (/\bd\)?\b/i.test(h)) colD = idx;
        });

        for (let r = 1; r < rowTexts.length; r++) {
          const row = rowTexts[r];
          const qMatch = (row[0] || '').match(/\d+/);
          if (qMatch) {
            const qNum = parseInt(qMatch[0], 10);
            const ansMap: Record<string, 'D' | 'S'> = {};
            if (colA >= 0 && row[colA]) { const v = normalizeTF(row[colA]); if (v) ansMap['a'] = v; }
            if (colB >= 0 && row[colB]) { const v = normalizeTF(row[colB]); if (v) ansMap['b'] = v; }
            if (colC >= 0 && row[colC]) { const v = normalizeTF(row[colC]); if (v) ansMap['c'] = v; }
            if (colD >= 0 && row[colD]) { const v = normalizeTF(row[colD]); if (v) ansMap['d'] = v; }
            if (Object.keys(ansMap).length > 0) part2Answers[qNum] = ansMap;
          }
        }
        return;
      }

      // Case 3: Vertical Table with Columns: Câu | Mức độ | Đáp án
      // e.g.:
      // 1 | [BIẾT] | C
      // 2 | [BIẾT] | A
      const hasCauCol = headerRow.some((c) => /câu/i.test(c));
      const hasDapAnCol = headerRow.some((c) => /đáp\s*án|đa/i.test(c));
      const hasMucDoCol = headerRow.some((c) => /mức\s*độ/i.test(c));

      if (hasCauCol && hasDapAnCol) {
        let colCau = -1;
        let colMucDo = -1;
        let colDapAn = -1;

        headerRow.forEach((c, idx) => {
          if (/câu/i.test(c)) colCau = idx;
          else if (/mức\s*độ/i.test(c)) colMucDo = idx;
          else if (/đáp\s*án|đa/i.test(c)) colDapAn = idx;
        });

        if (colCau >= 0 && colDapAn >= 0) {
          for (let r = 1; r < rowTexts.length; r++) {
            const row = rowTexts[r];
            const qNumMatch = (row[colCau] || '').match(/\d+/);
            const ans = (row[colDapAn] || '').trim();

            if (qNumMatch && ans) {
              const qNum = parseInt(qNumMatch[0], 10);
              let levelInfo = undefined;
              if (colMucDo >= 0 && row[colMucDo]) {
                levelInfo = extractCognitiveLevel(row[colMucDo]);
              }

              // Determine if multiple choice (A, B, C, D) or Short answer
              const upperAns = ans.toUpperCase();
              if (['A', 'B', 'C', 'D'].includes(upperAns)) {
                part1Answers[qNum] = upperAns;
                if (levelInfo) part1Levels[qNum] = { level: levelInfo.level, customTag: levelInfo.customTag };
              } else {
                part3Answers[qNum] = ans;
                if (levelInfo) part3Levels[qNum] = { level: levelInfo.level, customTag: levelInfo.customTag };
              }
            }
          }
          return;
        }
      }

      // Case 4: Horizontal Table:
      // Row 0: "Câu" | 1 | 2 | 3 ...
      // Row 1: "Đáp án" | C | A | B ...
      for (let r = 0; r < rowTexts.length - 1; r++) {
        const rowHeader = (rowTexts[r][0] || '').toLowerCase();
        const nextHeader = (rowTexts[r + 1][0] || '').toLowerCase();

        if (
          (rowHeader.includes('câu') || /^\d+$/.test(rowTexts[r][1] || '')) &&
          (nextHeader.includes('đáp') || nextHeader.includes('đa') || nextHeader.includes('ans'))
        ) {
          const qRow = rowTexts[r];
          const aRow = rowTexts[r + 1];

          for (let c = 1; c < Math.min(qRow.length, aRow.length); c++) {
            const qNumMatch = qRow[c].match(/\d+/);
            const ans = aRow[c].trim();
            if (qNumMatch && ans) {
              const qNum = parseInt(qNumMatch[0], 10);
              const upper = ans.toUpperCase();
              if (['A', 'B', 'C', 'D'].includes(upper)) {
                part1Answers[qNum] = upper;
              } else {
                part3Answers[qNum] = ans;
              }
            }
          }
        }
      }
    });
  } catch (err) {
    console.error('Error parsing answer tables:', err);
  }

  return { part1Answers, part1Levels, part2Answers, part3Answers, part3Levels };
}

/**
 * Extracts explanations with full formula preservation
 */
function extractExplanations(text: string): Record<string, string> {
  const explanations: Record<string, string> = {};
  
  const explMarkers = [
    /HƯỚNG\s+DẪN\s+GIẢI\s+CHI\s+TIẾT/i,
    /LỜI\s+GIẢI\s+CHI\s+TIẾT/i,
    /HƯỚNG\s+DẪN\s+CHẤM/i,
    /LỜI\s+GIẢI/i
  ];

  let explStartIndex = -1;
  for (const marker of explMarkers) {
    const match = text.search(marker);
    if (match !== -1 && (explStartIndex === -1 || match < explStartIndex)) {
      explStartIndex = match;
    }
  }

  if (explStartIndex === -1) return explanations;

  const explContent = text.slice(explStartIndex);
  const chunks = explContent.split(/(?=(?:PHẦN\s+[I|II|III|1|2|3][\s\S]*?)?Câu\s+\d+[:.])/i);

  chunks.forEach((chunk) => {
    const match = chunk.match(/Câu\s+(\d+)[:.]/i);
    if (match) {
      const qNum = match[1];
      const body = chunk.replace(/^(?:PHẦN\s+[^\n]+\n+)?Câu\s+\d+[:.]/i, '').trim();
      if (body) {
        explanations[qNum] = body;
      }
    }
  });

  return explanations;
}

/**
 * Main DOCX Parser with JSZip OMML, Media support, and line-preserving semantic recognition
 */
export async function parseDocxFile(file: File): Promise<ParseResult> {
  const originalArrayBuffer = await file.arrayBuffer();

  // 1. Preprocess with JSZip: converts OMML equations to LaTeX and extracts all media images
  const { modifiedBuffer, extractedImages } = await preprocessDocxWithZip(originalArrayBuffer);

  // 2. Convert to HTML and raw text with Mammoth, converting embedded images to data URLs
  const [htmlResult, textResult] = await Promise.all([
    mammoth.convertToHtml(
      { arrayBuffer: modifiedBuffer },
      {
        convertImage: mammoth.images.imgElement((image) => {
          return image.read('base64').then((imageBuffer) => ({
            src: `data:${image.contentType};base64,${imageBuffer}`
          }));
        })
      }
    ),
    mammoth.extractRawText({ arrayBuffer: modifiedBuffer })
  ]);

  const rawHtml = htmlResult.value;
  const rawText = textResult.value;

  const warnings: string[] = [...htmlResult.messages.map((m) => m.message)];
  const unparsedBlocks: string[] = [];

  // Extract meta info (Title, Subject, Grade, Duration)
  let title = file.name.replace(/\.[^/.]+$/, '');
  let subject = 'Hóa học';
  let grade = 11;
  const durationMinutes = 50;
  const chapter = 'Cân bằng hóa học';

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const headerBlock = lines.slice(0, 15).join(' ');

  if (/HÓA\s+HỌC|CÂN\s+BẰNG\s+HÓA\s+HỌC/i.test(headerBlock)) subject = 'Hóa học';
  else if (/TOÁN/i.test(headerBlock)) subject = 'Toán học';

  if (/11/i.test(headerBlock)) grade = 11;
  else if (/12/i.test(headerBlock)) grade = 12;
  else if (/10/i.test(headerBlock)) grade = 10;

  const titleMatch = headerBlock.match(/(?:CHỦ\s+ĐỀ\s+[^\n–—]+|ĐỀ\s+KIỂM\s+TRA[^\n–—]+|BÀI\s+KIỂM\s+TRA[^\n–—]+)/i);
  if (titleMatch) title = titleMatch[0].trim();

  // Parse Answer Tables & Explanations from HTML / rawText
  const { part1Answers, part1Levels, part2Answers, part3Answers, part3Levels } = parseAnswerTables(rawHtml);
  const explanations = extractExplanations(rawText);

  // Parse document into semantic lines preserving DOM paragraphs, <sub>, <sup>, $latex$, <img>, tables
  interface DocLine {
    text: string;
    html: string;
    isTable?: boolean;
  }

  const doc = new DOMParser().parseFromString(rawHtml, 'text/html');
  const allDocLines: DocLine[] = [];

  // Determine where questions stop and answer tables/explanations begin
  const bodyNodes = Array.from(doc.body.children);
  let stopExamBody = false;

  for (const node of bodyNodes) {
    if (stopExamBody) break;

    const nodeText = (node.textContent || '').trim();
    const nodeUpper = nodeText.toUpperCase();

    // Check if this node marks the start of the Answer Sheet or Detailed Explanations
    if (
      /^(?:BẢNG\s+)?(?:ĐÁP\s+ÁN|HƯỚNG\s+DẪN\s+CHẤM|HƯỚNG\s+DẪN\s+GIẢI|LỜI\s+GIẢI)/i.test(nodeUpper) &&
      !/^(?:BẢNG\s+)?ĐÁP\s+ÁN\s+CHO\s+CÂU/i.test(nodeUpper)
    ) {
      stopExamBody = true;
      break;
    }

    if (node.tagName.toLowerCase() === 'table') {
      // Check if this table is an answer table
      const tableText = (node.textContent || '').toLowerCase();
      const isAnswerTable =
        (tableText.includes('lệnh hỏi') && (tableText.includes('câu 1') || tableText.includes('câu 2'))) ||
        (tableText.includes('đáp án') && (tableText.includes('câu') || tableText.includes('đa'))) ||
        (tableText.includes('mức độ') && tableText.includes('câu'));

      if (!isAnswerTable) {
        // Chemistry/Physics data table belonging to a question
        allDocLines.push({
          text: nodeText,
          html: (node as HTMLElement).outerHTML,
          isTable: true
        });
      }
      continue;
    }

    // For paragraph, list, or heading elements: handle embedded <br> to retain true line breaks
    const innerHtml = (node as HTMLElement).innerHTML || '';
    if (/<br\s*\/?>/i.test(innerHtml)) {
      const parts = innerHtml.split(/<br\s*\/?>/i);
      parts.forEach((partHtml) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = partHtml;
        const pText = (tempDiv.textContent || '').replace(/\u00A0/g, ' ').trim();
        if (pText || /<img/i.test(partHtml)) {
          allDocLines.push({
            text: pText,
            html: partHtml.trim()
          });
        }
      });
    } else {
      const pText = nodeText.replace(/\u00A0/g, ' ').trim();
      if (pText || /<img/i.test(innerHtml)) {
        allDocLines.push({
          text: pText,
          html: innerHtml.trim()
        });
      }
    }
  }

  // Group DocLines into question blocks based on explicit section markers and "Câu X"
  interface RawQuestionBlock {
    qNum: number;
    sectionHint: PartType | null;
    lines: DocLine[];
    headerText: string;
  }

  const rawQuestionBlocks: RawQuestionBlock[] = [];
  let currentSectionHint: PartType | null = null;
  let activeBlock: RawQuestionBlock | null = null;

  for (const line of allDocLines) {
    const text = line.text;

    // Check for Section Header line
    if (/^PHẦN\s+(?:I\b|1\b)|CÂU\s+TRẮC\s+NGHIỆM\s+(?:NHIỀU|4)\s+LỰA\s+CHỌN/i.test(text)) {
      currentSectionHint = 'PART_I';
      continue;
    }
    if (/^PHẦN\s+(?:II\b|2\b)|CÂU\s+TRẮC\s+NGHIỆM\s+ĐÚNG\s*\/?\s*SAI/i.test(text)) {
      currentSectionHint = 'PART_II';
      continue;
    }
    if (/^PHẦN\s+(?:III\b|3\b)|CÂU\s+TRẮC\s+NGHIỆM\s+TRẢ\s+LỜI\s+NGẮN/i.test(text)) {
      currentSectionHint = 'PART_III';
      continue;
    }

    // Check for Question start:
    // e.g. "Câu 1.", "Câu 1:", "Câu 1 -", "[BIẾT] Câu 1.", "(HIỂU) Câu 2:", "Bài 1:"
    const qStartMatch = text.match(/^(?:\[[^\]]+\]|\([^\)]+\))?\s*(?:Câu|Bài)\s+(\d+)[:.\-–—]?\s*(.*)$/i);

    if (qStartMatch) {
      if (activeBlock && activeBlock.lines.length > 0) {
        rawQuestionBlocks.push(activeBlock);
      }

      const qNum = parseInt(qStartMatch[1], 10);
      const remainderText = qStartMatch[2].trim();

      // Clean the header from the first line's HTML for the prompt
      let firstLineHtml = line.html.replace(/^(?:\[[^\]]+\]|\([^\)]+\))?\s*(?:Câu|Bài)\s+\d+[:.\-–—]?\s*/i, '').trim();

      activeBlock = {
        qNum,
        sectionHint: currentSectionHint,
        lines: [
          {
            text: remainderText,
            html: firstLineHtml || remainderText
          }
        ],
        headerText: text
      };
    } else if (activeBlock) {
      // Append non-header line to the active question block
      activeBlock.lines.push(line);
    }
  }

  // Push the final question block if present
  if (activeBlock && activeBlock.lines.length > 0) {
    rawQuestionBlocks.push(activeBlock);
  }

  // Helper to split a line containing multiple options into individual options
  // e.g. "A. 1,2 gam.   B. 2,4 gam.   C. 3,6 gam.   D. 4,8 gam."
  const splitInlineOptions = (rawHtml: string, rawText: string): MultipleChoiceOption[] | null => {
    // Only search for B, C, D if line starts with A
    if (!/^[A-D](?![a-zA-Z0-9_])\s*[.):\-]\s+/i.test(rawText)) return null;

    // Matches option indicators preceded by space/tab/semicolon
    const optRegex = /(?:^|[\s\t\u00A0]{2,}|;\s*)([A-D])(?![a-zA-Z0-9_])\s*[.):\-]\s*([\s\S]*?)(?=(?:[\s\t\u00A0]{2,}|;\s*)[A-D](?![a-zA-Z0-9_])\s*[.):\-]\s*|$)/gi;
    const matches: MultipleChoiceOption[] = [];
    let match: RegExpExecArray | null;

    while ((match = optRegex.exec(rawText)) !== null) {
      const label = match[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
      const content = match[2].trim();
      matches.push({ label, content });
    }

    if (matches.length >= 2) {
      return matches;
    }
    return null;
  };

  // Helper to split a line containing multiple True/False statements:
  // e.g. "a) ...   b) ..."
  const splitInlineStatements = (rawHtml: string, rawText: string): TrueFalseItem[] | null => {
    if (!/^[a-d](?![a-zA-Z0-9_])\s*[.):\-–—]\s+/i.test(rawText)) return null;

    const stmtRegex = /(?:^|[\s\t\u00A0]{2,}|;\s*)([a-d])(?![a-zA-Z0-9_])\s*[.):\-–—]\s*([\s\S]*?)(?=(?:[\s\t\u00A0]{2,}|;\s*)[a-d](?![a-zA-Z0-9_])\s*[.):\-–—]\s*|$)/gi;
    const matches: TrueFalseItem[] = [];
    let match: RegExpExecArray | null;

    while ((match = stmtRegex.exec(rawText)) !== null) {
      const label = match[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
      let content = match[2].trim();
      let ans: 'D' | 'S' | null = null;

      if (/\((?:Đúng|Đ|True|T)\)|\[(?:Đúng|Đ|True|T)\]/i.test(content)) {
        ans = 'D';
        content = content.replace(/\s*(?:\((?:Đúng|Đ|True|T)\)|\[(?:Đúng|Đ|True|T)\])/gi, '').trim();
      } else if (/\((?:Sai|S|False|F)\)|\[(?:Sai|S|False|F)\]/i.test(content)) {
        ans = 'S';
        content = content.replace(/\s*(?:\((?:Sai|S|False|F)\)|\[(?:Sai|S|False|F)\])/gi, '').trim();
      }

      matches.push({ label, content, correctAnswer: ans });
    }

    if (matches.length >= 2) {
      return matches;
    }
    return null;
  };

  // Process all rawQuestionBlocks into finalized Question objects
  const parsedQuestions: Question[] = [];
  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;

  for (const block of rawQuestionBlocks) {
    const qNum = block.qNum;
    const lines = block.lines;

    // Extract cognitive level from header or early lines
    const fullTextSample = lines.map((l) => l.text).join(' ');
    const headerLevel = extractCognitiveLevel(block.headerText + ' ' + fullTextSample.slice(0, 100));
    let level: CognitiveLevel = headerLevel.level;
    let customTag: string | undefined = headerLevel.customTag;

    // 1. Check for DẠNG 2: Đúng / Sai 4 phát biểu (a, b, c, d)
    // Rule: Prompt followed by statements starting with a), b), c), d) or a., b., c., d.
    // Must NOT mistake mid-sentence units or formulas like (a) mol or pH for statement labels.
    const trueFalseStatements: TrueFalseItem[] = [];
    let tfPromptLines: string[] = [];
    let currentTfIndex = -1;
    let foundTfMarkers = false;

    for (const line of lines) {
      // Check inline multiple statements in one line
      const inlineStmts = splitInlineStatements(line.html, line.text);
      if (inlineStmts) {
        foundTfMarkers = true;
        inlineStmts.forEach((st) => trueFalseStatements.push(st));
        currentTfIndex = trueFalseStatements.length - 1;
        continue;
      }

      // Check single line statement: ^([a-d])(?![a-zA-Z0-9_])\s*[.):\-–—]\s*(.*)$
      const stmtMatch = line.text.match(/^([a-d])(?![a-zA-Z0-9_])\s*[.):\-–—]\s*(.*)$/i);

      if (stmtMatch) {
        foundTfMarkers = true;
        const label = stmtMatch[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
        let content = stmtMatch[2].trim();
        let ans: 'D' | 'S' | null = null;

        // Check inline Đúng/Sai tag in statement
        if (/\((?:Đúng|Đ|True|T)\)|\[(?:Đúng|Đ|True|T)\]/i.test(content)) {
          ans = 'D';
          content = content.replace(/\s*(?:\((?:Đúng|Đ|True|T)\)|\[(?:Đúng|Đ|True|T)\])/gi, '').trim();
        } else if (/\((?:Sai|S|False|F)\)|\[(?:Sai|S|False|F)\]/i.test(content)) {
          ans = 'S';
          content = content.replace(/\s*(?:\((?:Sai|S|False|F)\)|\[(?:Sai|S|False|F)\])/gi, '').trim();
        }

        trueFalseStatements.push({
          label,
          content,
          correctAnswer: ans
        });
        currentTfIndex = trueFalseStatements.length - 1;
      } else if (currentTfIndex >= 0) {
        // Multi-line statement support: append line to active statement
        const active = trueFalseStatements[currentTfIndex];
        active.content = active.content ? `${active.content}<br/>${line.html}` : line.html;
      } else {
        // Line belongs to prompt before statement a)
        if (line.html) tfPromptLines.push(line.html);
      }
    }

    const hasValidTfSequence =
      trueFalseStatements.length >= 2 &&
      trueFalseStatements.some((it) => it.label === 'a') &&
      trueFalseStatements.some((it) => it.label === 'b');

    // 2. Check for DẠNG 1: Trắc nghiệm nhiều lựa chọn (A, B, C, D)
    // Rule: Line starts with A., B., C., D. Must NOT mistake Al, Ag, Ca, CO2, C2H5OH for options.
    const mcOptions: MultipleChoiceOption[] = [];
    let mcPromptLines: string[] = [];
    let currentMcIndex = -1;
    let detectedCorrectOpt: string | null = null;

    for (const line of lines) {
      // Check inline multiple options in one line
      const inlineOpts = splitInlineOptions(line.html, line.text);
      if (inlineOpts) {
        inlineOpts.forEach((opt) => {
          if (opt.content.includes('*') || opt.content.includes('<u>') || opt.content.includes('[x]')) {
            detectedCorrectOpt = opt.label;
            opt.content = opt.content.replace(/\*|\[x\]/g, '').trim();
          }
          mcOptions.push(opt);
        });
        currentMcIndex = mcOptions.length - 1;
        continue;
      }

      // Check single line option: ^([A-D])(?![a-zA-Z0-9_])\s*[.):\-]\s*(.*)$
      const optMatch = line.text.match(/^([A-D])(?![a-zA-Z0-9_])\s*[.):\-]\s*(.*)$/);

      if (optMatch) {
        const label = optMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
        let content = optMatch[2].trim();

        // Check if option was marked correct with asterisk or underline
        if (line.text.includes('*') || line.html.includes('<u>') || line.text.includes('[x]')) {
          detectedCorrectOpt = label;
          content = content.replace(/\*|\[x\]/g, '').trim();
        }

        mcOptions.push({
          label,
          content
        });
        currentMcIndex = mcOptions.length - 1;
      } else if (currentMcIndex >= 0) {
        // Multi-line option support: append line to active option
        const active = mcOptions[currentMcIndex];
        active.content = active.content ? `${active.content}<br/>${line.html}` : line.html;
      } else {
        // Line belongs to prompt before option A
        if (line.html) mcPromptLines.push(line.html);
      }
    }

    const hasValidMcSequence =
      mcOptions.length >= 2 &&
      mcOptions.some((o) => o.label === 'A') &&
      mcOptions.some((o) => o.label === 'B');

    // 3. CLASSIFICATION & STRUCTURE ASSIGNMENT
    // Priority:
    // A) If section hint is PART_II or valid a, b statements found -> Dạng 2 (Đúng / Sai)
    // B) If section hint is PART_I or valid A, B options found -> Dạng 1 (Nhiều lựa chọn)
    // C) If section hint is PART_III or neither found -> Dạng 3 (Trả lời ngắn)

    const rawFullText = lines.map((l) => l.text).join('\n');
    const rawFullHtml = lines.map((l) => l.html).join('<br/>');

    // Lookup Table Answers (both absolute qNum and relative index)
    const relPart1 = part1Count + 1;
    const relPart2 = part2Count + 1;
    const relPart3 = part3Count + 1;

    // Check if Question is DẠNG 2: TRUE_FALSE
    if (
      (block.sectionHint === 'PART_II' && trueFalseStatements.length > 0) ||
      (hasValidTfSequence && (!hasValidMcSequence || block.sectionHint === 'PART_II'))
    ) {
      part2Count++;
      const warningsList: string[] = [];

      // Reconcile statement answers from table if not found inline
      const tableAnswers = part2Answers[qNum] || part2Answers[relPart2] || {};
      trueFalseStatements.forEach((st) => {
        if (!st.correctAnswer && tableAnswers[st.label]) {
          st.correctAnswer = tableAnswers[st.label];
        }
      });

      const missingAnswers = trueFalseStatements.filter((it) => it.correctAnswer === null).length;
      if (missingAnswers > 0) {
        warningsList.push(`Còn ${missingAnswers}/4 ý chưa có đáp án Đúng/Sai`);
      }

      if (trueFalseStatements.length < 4) {
        warningsList.push(`Chưa xác định – cần kiểm tra: Chỉ nhận diện được ${trueFalseStatements.length}/4 ý a, b, c, d`);
      }

      const promptHtml = tfPromptLines.length > 0 ? tfPromptLines.join('<br/>') : rawFullHtml;

      parsedQuestions.push({
        id: `q-p2-${qNum}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        subject,
        grade,
        chapter,
        part: 'PART_II',
        type: 'TRUE_FALSE',
        level,
        customLevelTag: customTag,
        content: promptHtml,
        items: trueFalseStatements,
        explanation: explanations[qNum.toString()] || explanations[`PART_II_${relPart2}`] || '',
        images: extractedImages,
        isVerified: missingAnswers === 0 && trueFalseStatements.length === 4,
        validationWarnings: warningsList,
        rawText: rawFullText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    // Check if Question is DẠNG 1: MULTIPLE_CHOICE
    else if (
      (block.sectionHint === 'PART_I' && mcOptions.length > 0) ||
      hasValidMcSequence
    ) {
      part1Count++;
      const warningsList: string[] = [];

      // Check level from table
      if (part1Levels[qNum]) {
        level = part1Levels[qNum].level;
        if (part1Levels[qNum].customTag) customTag = part1Levels[qNum].customTag;
      } else if (part1Levels[relPart1]) {
        level = part1Levels[relPart1].level;
        if (part1Levels[relPart1].customTag) customTag = part1Levels[relPart1].customTag;
      }

      // Check table answer
      if (!detectedCorrectOpt) {
        detectedCorrectOpt = part1Answers[qNum] || part1Answers[relPart1] || null;
      }

      if (!detectedCorrectOpt) {
        warningsList.push('Chưa xác nhận đáp án đúng');
      }

      if (mcOptions.length < 4) {
        warningsList.push(`Chưa xác định – cần kiểm tra: Chỉ nhận diện được ${mcOptions.length}/4 phương án A, B, C, D (thiếu phương án)`);
      }

      const promptHtml = mcPromptLines.length > 0 ? mcPromptLines.join('<br/>') : rawFullHtml;

      parsedQuestions.push({
        id: `q-p1-${qNum}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        subject,
        grade,
        chapter,
        part: 'PART_I',
        type: 'MULTIPLE_CHOICE',
        level,
        customLevelTag: customTag,
        content: promptHtml,
        options: mcOptions,
        correctOption: detectedCorrectOpt,
        explanation: explanations[qNum.toString()] || explanations[`PART_I_${relPart1}`] || '',
        images: extractedImages,
        isVerified: !!detectedCorrectOpt && mcOptions.length === 4,
        validationWarnings: warningsList,
        rawText: rawFullText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    // DẠNG 3: SHORT_ANSWER (Calculation / Problem without A-D options or a-d statements)
    else {
      part3Count++;
      const warningsList: string[] = [];

      // Cognitive level from table
      if (part3Levels[qNum]) {
        level = part3Levels[qNum].level;
        if (part3Levels[qNum].customTag) customTag = part3Levels[qNum].customTag;
      } else if (part3Levels[relPart3]) {
        level = part3Levels[relPart3].level;
        if (part3Levels[relPart3].customTag) customTag = part3Levels[relPart3].customTag;
      }

      // Look for detected answer in text or table
      let detectedAns: string | null = part3Answers[qNum] || part3Answers[relPart3] || null;

      let promptHtml = rawFullHtml;
      const textAnsMatch = rawFullText.match(/(?:Đáp\s+án|Trả\s+lời|Kết\s+quả|ĐS|KQ)[:.]\s*([^\n\r<]+)/i);
      if (textAnsMatch) {
        if (!detectedAns) {
          detectedAns = textAnsMatch[1].trim();
        }
        // Remove answer declaration line from prompt so it's not given away to students
        promptHtml = promptHtml.replace(/(?:<p>|<div>)?(?:Đáp\s+án|Trả\s+lời|Kết\s+quả|ĐS|KQ)[:.][^\n<]*(?:<\/p>|<\/div>)?/gi, '').trim();
      }

      if (!detectedAns) {
        warningsList.push('Chưa xác nhận đáp án ngắn');
      }

      // If document explicitly declared Phần I or II but no options were found, alert teacher
      if (block.sectionHint === 'PART_I') {
        warningsList.push('Nằm trong Phần I nhưng không tìm thấy cấu trúc phương án A, B, C, D - Chưa xác định, cần kiểm tra');
      } else if (block.sectionHint === 'PART_II') {
        warningsList.push('Nằm trong Phần II nhưng không tìm thấy 4 ý a, b, c, d - Chưa xác định, cần kiểm tra');
      }

      parsedQuestions.push({
        id: `q-p3-${qNum}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        subject,
        grade,
        chapter,
        part: 'PART_III',
        type: 'SHORT_ANSWER',
        level,
        customLevelTag: customTag,
        content: promptHtml,
        shortAnswer: detectedAns,
        explanation: explanations[qNum.toString()] || explanations[`PART_III_${relPart3}`] || '',
        images: extractedImages,
        isVerified: !!detectedAns,
        validationWarnings: warningsList,
        rawText: rawFullText,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
  }

  // Cross-check duplicate questions
  const contentMap = new Map<string, number>();
  parsedQuestions.forEach((q) => {
    const key = q.content.slice(0, 80).toLowerCase().trim();
    if (key.length > 10) {
      const count = (contentMap.get(key) || 0) + 1;
      contentMap.set(key, count);
      if (count > 1) {
        q.validationWarnings = q.validationWarnings || [];
        q.validationWarnings.push('Có thể bị trùng lặp với câu hỏi khác trong tệp');
      }
    }
  });

  return {
    title,
    subject,
    grade,
    durationMinutes,
    chapter,
    questions: parsedQuestions,
    unparsedBlocks,
    extractedImages,
    partsFound: {
      part1: part1Count,
      part2: part2Count,
      part3: part3Count,
      hasAnswerGrid: Object.keys(part1Answers).length > 0 || Object.keys(part2Answers).length > 0 || Object.keys(part3Answers).length > 0,
      hasExplanations: Object.keys(explanations).length > 0
    },
    warnings
  };
}

