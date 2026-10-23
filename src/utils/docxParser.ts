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
 * Main DOCX Parser with JSZip OMML & Media support
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

  // Extract meta info
  let title = file.name.replace(/\.[^/.]+$/, '');
  let subject = 'Hóa học';
  let grade = 11;
  let durationMinutes = 50;
  let chapter = 'Cân bằng hóa học';

  const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);
  const headerBlock = lines.slice(0, 15).join(' ');

  if (/HÓA\s+HỌC|CÂN\s+BẰNG\s+HÓA\s+HỌC/i.test(headerBlock)) subject = 'Hóa học';
  else if (/TOÁN/i.test(headerBlock)) subject = 'Toán học';

  if (/11/i.test(headerBlock)) grade = 11;
  else if (/12/i.test(headerBlock)) grade = 12;
  else if (/10/i.test(headerBlock)) grade = 10;

  const titleMatch = headerBlock.match(/(?:CHỦ\s+ĐỀ\s+[^\n–—]+|ĐỀ\s+KIỂM\s+TRA[^\n–—]+|BÀI\s+KIỂM\s+TRA[^\n–—]+)/i);
  if (titleMatch) title = titleMatch[0].trim();

  // Parse Answer Tables & Explanations
  const { part1Answers, part1Levels, part2Answers, part3Answers, part3Levels } = parseAnswerTables(rawHtml);
  const explanations = extractExplanations(rawText);

  // Split into sections
  const sectionSplitRegex = /(?=(?:PHẦN\s+(?:I|II|III|1|2|3)|(?:BẢNG\s+)?ĐÁP\s+ÁN|HƯỚNG\s+DẪN\s+GIẢI))/i;
  const rawSections = rawText.split(sectionSplitRegex);

  const parsedQuestions: Question[] = [];
  let part1Count = 0;
  let part2Count = 0;
  let part3Count = 0;

  // Helper: Part I parser
  const parsePart1Chunk = (chunkText: string) => {
    const qChunks = chunkText.split(/(?=(?:\[[^\]]+\]\s*)?Câu\s+\d+[:.])/i);
    qChunks.forEach((qc) => {
      const qNumMatch = qc.match(/Câu\s+(\d+)[:.]/i);
      if (!qNumMatch) return;

      const qNum = parseInt(qNumMatch[1], 10);
      const afterQHeader = qc.replace(/^[\s\S]*?Câu\s+\d+[:.]/i, '').trim();

      // Extract cognitive level
      let { level, customTag, cleanText } = extractCognitiveLevel(qc.slice(0, 60) + ' ' + afterQHeader);
      
      // If table provided cognitive level, honor it
      if (part1Levels[qNum]) {
        level = part1Levels[qNum].level;
        if (part1Levels[qNum].customTag) customTag = part1Levels[qNum].customTag;
      }

      // Extract options: A. B. C. D.
      const optionSplitRegex = /(?=[A-D][.):\-])/;
      const optParts = cleanText.split(optionSplitRegex);

      if (optParts.length >= 4) {
        const questionPrompt = optParts[0].trim();
        const options: MultipleChoiceOption[] = [];
        let detectedCorrect: string | null = part1Answers[qNum] || null;

        for (let i = 1; i < optParts.length; i++) {
          const part = optParts[i].trim();
          const labelMatch = part.match(/^([A-D])[.):\-]\s*([\s\S]*)$/);
          if (labelMatch) {
            const label = labelMatch[1].toUpperCase() as 'A' | 'B' | 'C' | 'D';
            const content = labelMatch[2].trim();

            if (part.includes('*') || part.includes('<u>') || part.includes('[x]')) {
              detectedCorrect = label;
            }

            options.push({ label, content });
          }
        }

        const warningsList: string[] = [];
        if (!detectedCorrect) warningsList.push('Chưa xác nhận đáp án đúng');
        if (options.length < 4) warningsList.push(`Chỉ nhận diện được ${options.length}/4 phương án`);

        parsedQuestions.push({
          id: `q-p1-${qNum}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          subject,
          grade,
          chapter,
          part: 'PART_I',
          type: 'MULTIPLE_CHOICE',
          level,
          customLevelTag: customTag,
          content: questionPrompt,
          options,
          correctOption: detectedCorrect,
          explanation: explanations[qNum.toString()] || '',
          images: extractedImages,
          isVerified: !!detectedCorrect && options.length === 4,
          validationWarnings: warningsList,
          rawText: qc.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        part1Count++;
      } else {
        unparsedBlocks.push(qc.trim());
      }
    });
  };

  // Helper: Part II parser
  const parsePart2Chunk = (chunkText: string) => {
    const qChunks = chunkText.split(/(?=(?:\[[^\]]+\]\s*)?Câu\s+\d+[:.])/i);
    qChunks.forEach((qc) => {
      const qNumMatch = qc.match(/Câu\s+(\d+)[:.]/i);
      if (!qNumMatch) return;

      const qNum = parseInt(qNumMatch[1], 10);
      const afterQHeader = qc.replace(/^[\s\S]*?Câu\s+\d+[:.]/i, '').trim();

      const { level, customTag, cleanText } = extractCognitiveLevel(qc.slice(0, 80) + ' ' + afterQHeader);

      // Extract sub-items a) b) c) d)
      const subItemSplitRegex = /(?=[a-d][.)\-]\s+)/i;
      const parts = cleanText.split(subItemSplitRegex);

      if (parts.length >= 2) {
        const questionPrompt = parts[0].trim();
        const items: TrueFalseItem[] = [];
        const tableAnswers = part2Answers[qNum] || {};

        for (let i = 1; i < parts.length; i++) {
          const itemText = parts[i].trim();
          const match = itemText.match(/^([a-d])[.)\-]\s*([\s\S]*)$/i);
          if (match) {
            const label = match[1].toLowerCase() as 'a' | 'b' | 'c' | 'd';
            let content = match[2].trim();

            let ans: 'D' | 'S' | null = tableAnswers[label] || null;

            if (/\((?:Đúng|D|True)\)/i.test(content)) {
              ans = 'D';
              content = content.replace(/\s*\((?:Đúng|D|True)\)/i, '');
            } else if (/\((?:Sai|S|False)\)/i.test(content)) {
              ans = 'S';
              content = content.replace(/\s*\((?:Sai|S|False)\)/i, '');
            }

            items.push({
              label,
              content,
              correctAnswer: ans
            });
          }
        }

        const missingAnswers = items.filter((it) => it.correctAnswer === null).length;
        const warningsList: string[] = [];
        if (missingAnswers > 0) warningsList.push(`Còn ${missingAnswers}/4 ý chưa có đáp án Đúng/Sai`);
        if (items.length < 4) warningsList.push(`Chỉ nhận diện được ${items.length}/4 ý a, b, c, d`);

        parsedQuestions.push({
          id: `q-p2-${qNum}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          subject,
          grade,
          chapter,
          part: 'PART_II',
          type: 'TRUE_FALSE',
          level,
          customLevelTag: customTag,
          content: questionPrompt,
          items,
          explanation: explanations[qNum.toString()] || '',
          images: extractedImages,
          isVerified: missingAnswers === 0 && items.length === 4,
          validationWarnings: warningsList,
          rawText: qc.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        part2Count++;
      } else {
        unparsedBlocks.push(qc.trim());
      }
    });
  };

  // Helper: Part III parser
  const parsePart3Chunk = (chunkText: string) => {
    const qChunks = chunkText.split(/(?=(?:\[[^\]]+\]\s*)?Câu\s+\d+[:.])/i);
    qChunks.forEach((qc) => {
      const qNumMatch = qc.match(/Câu\s+(\d+)[:.]/i);
      if (!qNumMatch) return;

      const qNum = parseInt(qNumMatch[1], 10);
      const afterQHeader = qc.replace(/^[\s\S]*?Câu\s+\d+[:.]/i, '').trim();

      let { level, customTag, cleanText } = extractCognitiveLevel(qc.slice(0, 80) + ' ' + afterQHeader);

      if (part3Levels[qNum]) {
        level = part3Levels[qNum].level;
        if (part3Levels[qNum].customTag) customTag = part3Levels[qNum].customTag;
      }

      let detectedAns: string | null = part3Answers[qNum] || null;

      const textAnsMatch = cleanText.match(/(?:Đáp\s+án|Trả\s+lời|Kết\s+quả)[:.]\s*([^\n]+)/i);
      let prompt = cleanText;
      if (textAnsMatch) {
        if (!detectedAns) detectedAns = textAnsMatch[1].trim();
        prompt = prompt.replace(/(?:Đáp\s+án|Trả\s+lời|Kết\s+quả)[:.]\s*[^\n]+/i, '').trim();
      }

      const warningsList: string[] = [];
      if (!detectedAns) warningsList.push('Chưa xác nhận đáp án ngắn');

      parsedQuestions.push({
        id: `q-p3-${qNum}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        subject,
        grade,
        chapter,
        part: 'PART_III',
        type: 'SHORT_ANSWER',
        level,
        customLevelTag: customTag,
        content: prompt,
        shortAnswer: detectedAns,
        explanation: explanations[qNum.toString()] || '',
        images: extractedImages,
        isVerified: !!detectedAns,
        validationWarnings: warningsList,
        rawText: qc.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      part3Count++;
    });
  };

  // Parse according to sections
  let hasExplicitParts = false;

  rawSections.forEach((section) => {
    const trimmed = section.trim();
    if (!trimmed) return;

    if (/^PHẦN\s+(?:I\b|1\b)|TRẮC\s+NGHIỆM\s+4\s+LỰA\s+CHỌN/i.test(trimmed)) {
      hasExplicitParts = true;
      parsePart1Chunk(trimmed);
    } else if (/^PHẦN\s+(?:II\b|2\b)|ĐÚNG\s*\/?\s*SAI/i.test(trimmed)) {
      hasExplicitParts = true;
      parsePart2Chunk(trimmed);
    } else if (/^PHẦN\s+(?:III\b|3\b)|TRẢ\s+LỜI\s+NGẮN/i.test(trimmed)) {
      hasExplicitParts = true;
      parsePart3Chunk(trimmed);
    }
  });

  // If no explicit "PHẦN I/II/III" headings, auto-detect
  if (!hasExplicitParts || parsedQuestions.length === 0) {
    const allQuestions = rawText.split(/(?=(?:\[[^\]]+\]\s*)?Câu\s+\d+[:.])/i);
    allQuestions.forEach((qBlock) => {
      if (!/Câu\s+\d+[:.]/i.test(qBlock.trim())) return;

      if (/[A-D][.)\-]\s+/i.test(qBlock) && qBlock.split(/(?=[A-D][.):\-])/).length >= 4) {
        parsePart1Chunk(qBlock);
      } else if (/[a-d][.)\-]\s+/i.test(qBlock) && qBlock.split(/(?=[a-d][.)\-]\s+)/i).length >= 3) {
        parsePart2Chunk(qBlock);
      } else {
        parsePart3Chunk(qBlock);
      }
    });
  }

  // Cross-check duplicates
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
