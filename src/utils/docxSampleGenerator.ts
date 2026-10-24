import JSZip from 'jszip';

/**
 * Creates and downloads a valid Microsoft Word (.docx) sample file for teachers.
 * Built with standard OpenXML structure, fully compatible with MS Word, LibreOffice, Google Docs,
 * and EduChem Studio's DOCX parser.
 */
export async function downloadEduChemWordSample(): Promise<void> {
  const zip = new JSZip();

  // 1. [Content_Types].xml
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`;

  // 2. _rels/.rels
  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  // Helper to escape XML special chars
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  // Helper to build a standard OpenXML paragraph
  const p = (
    text: string,
    opts: {
      bold?: boolean;
      italic?: boolean;
      size?: number; // half-points, e.g. 24 = 12pt, 28 = 14pt
      color?: string; // hex RRGGBB
      align?: 'left' | 'center' | 'right' | 'both';
      spacingAfter?: number; // twips, e.g. 120 = 6pt
    } = {}
  ) => {
    const boldXml = opts.bold ? '<w:b/><w:bCs/>' : '';
    const italicXml = opts.italic ? '<w:i/><w:iCs/>' : '';
    const sizeVal = opts.size || 24;
    const colorXml = opts.color ? `<w:color w:val="${opts.color}"/>` : '';
    const alignXml = opts.align ? `<w:jc w:val="${opts.align}"/>` : '';
    const spaceXml = opts.spacingAfter ? `<w:spacing w:after="${opts.spacingAfter}"/>` : '<w:spacing w:after="80"/>';

    return `
    <w:p>
      <w:pPr>
        ${alignXml}
        ${spaceXml}
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>
          ${boldXml}
          ${italicXml}
          <w:sz w:val="${sizeVal}"/>
          <w:szCs w:val="${sizeVal}"/>
          ${colorXml}
        </w:rPr>
        <w:t xml:space="preserve">${escapeXml(text)}</w:t>
      </w:r>
    </w:p>`;
  };

  // 3. word/document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    ${p('EDUCHEM STUDIO - MẪU SOẠN ĐỀ THI WORD CHUẨN GDPT 2018', {
      bold: true,
      size: 30,
      color: '1E3A8A',
      align: 'center',
      spacingAfter: 100
    })}
    ${p('Tài liệu hướng dẫn giáo viên soạn đề trắc nghiệm Hóa học & Khoa học tự nhiên', {
      italic: true,
      size: 22,
      color: '475569',
      align: 'center',
      spacingAfter: 240
    })}

    ${p('HƯỚNG DẪN SOẠN ĐỀ CHO GIÁO VIÊN:', { bold: true, size: 24, color: '0F172A', spacingAfter: 100 })}
    ${p('1. Giữ nguyên ký hiệu và cấu trúc câu hỏi mẫu theo chuẩn GDPT 2018.', { size: 22, spacingAfter: 60 })}
    ${p('2. Viết câu dẫn trước, sau đó xuống dòng để trình bày các phương án A, B, C, D hoặc các phát biểu a), b), c), d).', { size: 22, spacingAfter: 60 })}
    ${p('3. Không gộp nhiều phương án vào cùng một dòng nếu không cần thiết; mỗi phương án nên ở một dòng riêng.', { size: 22, spacingAfter: 60 })}
    ${p('4. Thầy/Cô có thể sử dụng công thức hóa học (H₂SO₄, Fe³⁺), phương trình phản ứng (2Na + 2H₂O → 2NaOH + H₂), biểu thức toán học LaTeX ($K_C = ...$), số liệu và hình ảnh chèn trực tiếp.', { size: 22, spacingAfter: 60 })}
    ${p('5. Có thể đặt mức độ nhận thức ở đầu câu: [BIẾT], [HIỂU], [VẬN DỤNG], [VẬN DỤNG CAO] hoặc [HIỂU – VẬN DỤNG].', { size: 22, spacingAfter: 60 })}
    ${p('6. Thầy cô hoàn toàn có thể thay đổi nội dung, thêm câu hỏi, chỉnh sửa đáp án theo đề thực tế của trường mình.', { size: 22, spacingAfter: 60 })}
    ${p('7. Sau khi soạn xong, lưu file và tải lên hệ thống EduChem Studio để kiểm tra và tạo bài thi online.', { size: 22, spacingAfter: 200 })}

    ${p('---------------------------------------------------------------------------------------------------------', {
      color: 'CBD5E1',
      align: 'center',
      spacingAfter: 200
    })}

    ${p('PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN', {
      bold: true,
      size: 26,
      color: '312E81',
      spacingAfter: 120
    })}
    ${p('(Thí sinh trả lời từ câu 1 đến câu 1. Mỗi câu hỏi thí sinh chỉ chọn một phương án)', {
      italic: true,
      size: 22,
      color: '64748B',
      spacingAfter: 140
    })}

    ${p('[BIẾT] Câu 1. Kim loại nào sau đây phản ứng với nước ở điều kiện thường tạo thành dung dịch kiềm và giải phóng khí hiđro?', {
      bold: true,
      size: 24,
      spacingAfter: 80
    })}
    ${p('A. Na', { size: 24, spacingAfter: 60 })}
    ${p('B. Fe', { size: 24, spacingAfter: 60 })}
    ${p('C. Cu', { size: 24, spacingAfter: 60 })}
    ${p('D. Ag', { size: 24, spacingAfter: 100 })}
    ${p('Đáp án: A', { bold: true, size: 24, color: '15803D', spacingAfter: 80 })}
    ${p('Lời giải: Natri (Na) là kim loại kiềm có tính khử mạnh, phản ứng mãnh liệt với nước ở nhiệt độ thường theo phương trình hóa học: 2Na + 2H₂O → 2NaOH + H₂↑.', {
      italic: true,
      size: 22,
      color: '334155',
      spacingAfter: 240
    })}

    ${p('PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI', {
      bold: true,
      size: 26,
      color: '065F46',
      spacingAfter: 120
    })}
    ${p('(Thí sinh trả lời các ý a, b, c, d. Trong mỗi ý, thí sinh chọn Đúng hoặc Sai)', {
      italic: true,
      size: 22,
      color: '64748B',
      spacingAfter: 140
    })}

    ${p('[HIỂU] Câu 2. Xét các phát biểu sau về tính chất hóa học của một số kim loại thông dụng:', {
      bold: true,
      size: 24,
      spacingAfter: 80
    })}
    ${p('a) Natri phản ứng mãnh liệt với nước ở điều kiện thường tỏa nhiều nhiệt.', { size: 24, spacingAfter: 60 })}
    ${p('b) Đồng phản ứng mạnh với nước lạnh giải phóng khí hiđro.', { size: 24, spacingAfter: 60 })}
    ${p('c) Sắt tác dụng được với dung dịch axit clohiđric loãng sinh ra muối sắt(II) và khí hiđro.', { size: 24, spacingAfter: 60 })}
    ${p('d) Bạc có thể phản ứng với dung dịch HCl loãng giải phóng khí hiđro.', { size: 24, spacingAfter: 100 })}
    ${p('Đáp án:', { bold: true, size: 24, color: '15803D', spacingAfter: 40 })}
    ${p('a) Đúng', { bold: true, size: 22, color: '15803D', spacingAfter: 40 })}
    ${p('b) Sai', { bold: true, size: 22, color: 'BE123C', spacingAfter: 40 })}
    ${p('c) Đúng', { bold: true, size: 22, color: '15803D', spacingAfter: 40 })}
    ${p('d) Sai', { bold: true, size: 22, color: 'BE123C', spacingAfter: 100 })}
    ${p('Lời giải:', { bold: true, italic: true, size: 22, color: '334155', spacingAfter: 40 })}
    ${p('a) Đúng. Kim loại kiềm Na tan nhanh trong nước, phản ứng tỏa nhiều nhiệt.', { italic: true, size: 22, color: '334155', spacingAfter: 40 })}
    ${p('b) Sai. Đồng (Cu) là kim loại hoạt động yếu, không phản ứng với nước ở nhiệt độ thường.', { italic: true, size: 22, color: '334155', spacingAfter: 40 })}
    ${p('c) Đúng. Phương trình phản ứng: Fe + 2HCl → FeCl₂ + H₂↑.', { italic: true, size: 22, color: '334155', spacingAfter: 40 })}
    ${p('d) Sai. Bạc đứng sau hiđro trong dãy hoạt động hóa học nên không khử được ion H⁺ trong dung dịch axit loãng.', { italic: true, size: 22, color: '334155', spacingAfter: 240 })}

    ${p('PHẦN III. CÂU TRẮC NGHIỆM TRẢ LỜI NGẮN', {
      bold: true,
      size: 26,
      color: '92400E',
      spacingAfter: 120
    })}
    ${p('(Thí sinh viết câu trả lời ngắn dưới dạng số hoặc số thập phân)', {
      italic: true,
      size: 22,
      color: '64748B',
      spacingAfter: 140
    })}

    ${p('[VẬN DỤNG] Câu 3. Hòa tan hoàn toàn một lượng kim loại nhôm trong dung dịch HCl dư thu được 11,2 lít khí hiđro (đo ở điều kiện tiêu chuẩn 0 °C, 1 atm). Tính số mol khí hiđro thu được.', {
      bold: true,
      size: 24,
      spacingAfter: 80
    })}
    ${p('Đáp án: 0,5', { bold: true, size: 24, color: '15803D', spacingAfter: 100 })}
    ${p('Lời giải: Ở điều kiện tiêu chuẩn (0 °C, 1 atm), thể tích 1 mol chất khí là 22,4 lít. Số mol khí H₂ thu được là: n = V / 22,4 = 11,2 / 22,4 = 0,5 mol.', {
      italic: true,
      size: 22,
      color: '334155',
      spacingAfter: 240
    })}

    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  // Add files to zip
  zip.file('[Content_Types].xml', contentTypesXml);
  zip.file('_rels/.rels', rootRelsXml);
  zip.file('word/document.xml', documentXml);

  // Generate blob and trigger browser download
  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EduChem_Studio_Mau_Nhap_Cau_Hoi.docx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
