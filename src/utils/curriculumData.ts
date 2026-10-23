export interface SubjectCurriculum {
  id: string;
  name: string;
  grades: number[]; // e.g. [6, 7, 8, 9] or [10, 11, 12]
  topicsByGrade: Record<number, { chapter: string; lessons: string[] }[]>;
}

export const CURRICULUM_DATA: Record<string, SubjectCurriculum> = {
  'Hóa học': {
    id: 'chemistry',
    name: 'Hóa học',
    grades: [8, 9, 10, 11, 12],
    topicsByGrade: {
      8: [
        {
          chapter: 'Chất - Nguyên tử - Phân tử',
          lessons: ['Chất', 'Chất tinh khiết và hỗn hợp', 'Nguyên tử', 'Nguyên tố hóa học', 'Đơn chất và hợp chất - Phân tử']
        },
        {
          chapter: 'Phản ứng hóa học & Định luật bảo toàn khối lượng',
          lessons: ['Sự biến đổi chất', 'Phản ứng hóa học', 'Định luật bảo toàn khối lượng', 'Phương trình hóa học']
        },
        {
          chapter: 'Mol và tính toán hóa học',
          lessons: ['Mol', 'Chuyển đổi giữa khối lượng, thể tích và lượng chất', 'Tỉ khối của chất khí', 'Nồng độ dung dịch']
        },
        {
          chapter: 'Oxy - Không khí - Hydro - Nước',
          lessons: ['Tính chất của oxy', 'Sự oxy hóa - Phản ứng hóa hợp', 'Hydro và tính chất của hydro', 'Nước và dung dịch']
        }
      ],
      9: [
        {
          chapter: 'Các loại hợp chất vô cơ',
          lessons: ['Tính chất hóa học của Oxide', 'Tính chất hóa học của Acid (HCl, H2SO4)', 'Tính chất hóa học của Base', 'Muối và mối quan hệ giữa các hợp chất vô cơ']
        },
        {
          chapter: 'Kim loại',
          lessons: ['Tính chất vật lí và hóa học của kim loại', 'Dãy hoạt động hóa học của kim loại', 'Nhôm (Al) và hợp chất', 'Sắt (Fe) và hợp kim của sắt']
        },
        {
          chapter: 'Phi kim - Bảng tuần hoàn',
          lessons: ['Tính chất của phi kim', 'Carbon và các oxide của carbon', 'Sơ lược về bảng tuần hoàn các nguyên tố hóa học']
        },
        {
          chapter: 'Hydrocarbon & Nhiên liệu',
          lessons: ['Methane (CH4)', 'Ethylene (C2H4)', 'Acetylene (C2H2)', 'Benzene (C6H6)', 'Dầu mỏ và khí thiên nhiên']
        },
        {
          chapter: 'Dẫn xuất của Hydrocarbon - Polymer',
          lessons: ['Rượu etylic (Ethanol)', 'Axit axetic (Acetic acid)', 'Chất béo', 'Gluxit (Glucose, Saccarozo)', 'Polymer']
        }
      ],
      10: [
        {
          chapter: 'Chương 1: Cấu tạo nguyên tử',
          lessons: ['Thành phần của nguyên tử', 'Nguyên tố hóa học', 'Cấu trúc lớp vỏ electron của nguyên tử']
        },
        {
          chapter: 'Chương 2: Bảng tuần hoàn các nguyên tố hóa học',
          lessons: ['Cấu tạo bảng tuần hoàn', 'Xu hướng biến đổi một số tính chất trong chu kì và nhóm', 'Định luật tuần hoàn và ý nghĩa']
        },
        {
          chapter: 'Chương 3: Liên kết hóa học',
          lessons: ['Quy tắc Octet', 'Liên kết ion', 'Liên kết cộng hóa trị', 'Liên kết hydrogen và tương tác van der Waals']
        },
        {
          chapter: 'Chương 4: Phản ứng oxi hóa - khử',
          lessons: ['Số oxi hóa', 'Phản ứng oxi hóa - khử và cách cân bằng', 'Ý nghĩa của phản ứng oxi hóa - khử']
        },
        {
          chapter: 'Chương 5: Năng lượng hóa học',
          lessons: ['Phản ứng tỏa nhiệt và thu nhiệt', 'Biến thiên enthalpy chuẩn của phản ứng hóa học', 'Tính biến thiên enthalpy theo nhiệt tạo thành và năng lượng liên kết']
        },
        {
          chapter: 'Chương 6: Tốc độ phản ứng hóa học',
          lessons: ['Khái niệm tốc độ phản ứng', 'Các yếu tố ảnh hưởng đến tốc độ phản ứng']
        },
        {
          chapter: 'Chương 7: Nguyên tố nhóm VIIA (Halogen)',
          lessons: ['Đơn chất halogen', 'Hydrogen halide và một số phản ứng của ion halide']
        }
      ],
      11: [
        {
          chapter: 'Chương 1: Cân bằng hóa học',
          lessons: ['Khái niệm về cân bằng hóa học', 'Hằng số cân bằng Kc', 'Sự chuyển dịch cân bằng và nguyên lí Le Chatelier', 'Cân bằng trong dung dịch nước (Thuyết Brønsted - Lowry, pH, Chuẩn độ)']
        },
        {
          chapter: 'Chương 2: Nitrogen và Sulfur',
          lessons: ['Đơn chất nitrogen', 'Ammonia và muối ammonium', 'Một số hợp chất của nitrogen với oxygen (HNO3, muối nitrate)', 'Đơn chất sulfur', 'Sulfur dioxide (SO2)', 'Sulfuric acid và muối sulfate']
        },
        {
          chapter: 'Chương 3: Đại cương hóa học hữu cơ',
          lessons: ['Hợp chất hữu cơ và hóa học hữu cơ', 'Phương pháp tách biệt và tinh chế', 'Công thức phân tử hợp chất hữu cơ', 'Cấu trúc phân tử hợp chất hữu cơ']
        },
        {
          chapter: 'Chương 4: Hydrocarbon',
          lessons: ['Alkane', 'Hydrocarbon không no (Alkene, Alkyne)', 'Arene (Hydrocarbon thơm)']
        },
        {
          chapter: 'Chương 5: Dẫn xuất Halogen - Alcohol - Phenol',
          lessons: ['Dẫn xuất halogen', 'Alcohol', 'Phenol']
        },
        {
          chapter: 'Chương 6: Hợp chất Carbonyl - Carboxylic Acid',
          lessons: ['Hợp chất carbonyl (Aldehyde - Ketone)', 'Carboxylic acid']
        }
      ],
      12: [
        {
          chapter: 'Chương 1: Ester - Lipid. Xà phòng và chất giặt rửa',
          lessons: ['Ester', 'Lipid và chất béo', 'Xà phòng và chất giặt rửa tổng hợp']
        },
        {
          chapter: 'Chương 2: Carbohydrate',
          lessons: ['Glucose và Fructose', 'Saccharose và Maltose', 'Tinh bột và Cellulose']
        },
        {
          chapter: 'Chương 3: Hợp chất chứa nitrogen',
          lessons: ['Amine', 'Amino acid', 'Peptide và protein', 'Enzyme']
        },
        {
          chapter: 'Chương 4: Polymer',
          lessons: ['Đại cương về polymer', 'Vật liệu polymer (Chất dẻo, tơ, cao su, keo dán)']
        },
        {
          chapter: 'Chương 5: Pin điện và điện phân',
          lessons: ['Thế điện cực và nguồn điện hóa học', 'Điện phân và ứng dụng']
        },
        {
          chapter: 'Chương 6: Đại cương về kim loại',
          lessons: ['Cấu tạo và tính chất vật lí của kim loại', 'Tính chất hóa học của kim loại', 'Tách kim loại và tái chế', 'Sự ăn mòn kim loại']
        },
        {
          chapter: 'Chương 7: Kim loại chuyển tiếp dãy thứ nhất và phức chất',
          lessons: ['Đại cương về kim loại chuyển tiếp dãy thứ nhất', 'Sơ lược về phức chất', 'Sự tạo phức trong dung dịch']
        }
      ]
    }
  },
  'Khoa học tự nhiên': {
    id: 'khtn',
    name: 'Khoa học tự nhiên',
    grades: [6, 7, 8, 9],
    topicsByGrade: {
      6: [
        {
          chapter: 'Mở đầu: Phương pháp học tập môn KHTN',
          lessons: ['Giới thiệu về Khoa học tự nhiên', 'Các lĩnh vực chủ yếu của KHTN', 'Quy định an toàn trong phòng thực hành', 'Đo chiều dài, khối lượng và thời gian', 'Thang nhiệt độ Celsius, đo nhiệt độ']
        },
        {
          chapter: 'Chất và sự biến đổi của chất',
          lessons: ['Các thể của chất và sự chuyển thể', 'Oxygen và không khí', 'Một số vật liệu, nhiên liệu, nguyên liệu, lương thực - thực phẩm', 'Chất tinh khiết và hỗn hợp', 'Tách chất ra khỏi hỗn hợp']
        },
        {
          chapter: 'Vật sống và tổ chức cơ thể',
          lessons: ['Tế bào - Đơn vị cơ sở của sự sống', 'Từ tế bào đến cơ thể', 'Đa dạng thế giới sống']
        },
        {
          chapter: 'Năng lượng và Trái Đất',
          lessons: ['Lực và tác dụng của lực', 'Năng lượng và sự truyền năng lượng', 'Trái Đất và bầu trời']
        }
      ],
      7: [
        {
          chapter: 'Nguyên tử - Nguyên tố hóa học - Phân tử',
          lessons: ['Phương pháp và kĩ năng học tập KHTN', 'Nguyên tử', 'Nguyên tố hóa học', 'Sơ lược về bảng tuần hoàn', 'Phân tử, đơn chất, hợp chất', 'Hóa trị và công thức hóa học']
        },
        {
          chapter: 'Âm thanh - Ánh sáng - Từ trường',
          lessons: ['Tốc độ chuyển động', 'Sóng âm và độ to của âm', 'Ánh sáng và tia sáng', 'Sự phản xạ ánh sáng', 'Từ trường và nam điện']
        },
        {
          chapter: 'Trao đổi chất và chuyển hóa năng lượng ở sinh vật',
          lessons: ['Khái quát trao đổi chất', 'Quang hợp ở thực vật', 'Hô hấp tế bào', 'Trao đổi khí ở sinh vật', 'Vận chuyển các chất trong cơ thể']
        }
      ],
      8: [
        {
          chapter: 'Phản ứng hóa học và các hợp chất vô cơ',
          lessons: ['Biến đổi vật lí và biến đổi hóa học', 'Phản ứng hóa học', 'Định luật bảo toàn khối lượng và phương trình hóa học', 'Mol và tỉ khối của chất khí', 'Nồng độ dung dịch', 'Oxide', 'Acid', 'Base và thang pH', 'Muối', 'Phân bón hóa học']
        },
        {
          chapter: 'Khối lượng riêng và Áp suất - Tác dụng của lực',
          lessons: ['Khối lượng riêng', 'Áp suất chất lỏng và chất khí', 'Lực đẩy Archimedes', 'Đòn bẩy và moment lực']
        },
        {
          chapter: 'Điện và nhiệt lượng',
          lessons: ['Dòng điện và mạch điện', 'Tác dụng của dòng điện', 'Nhiệt năng và sự truyền nhiệt']
        },
        {
          chapter: 'Cơ thể người và môi trường sống',
          lessons: ['Hệ vận động ở người', 'Hệ tiêu hóa', 'Hệ tuần hoàn', 'Hệ hô hấp', 'Hệ bài tiết', 'Hệ thần kinh']
        }
      ],
      9: [
        {
          chapter: 'Kim loại và Hóa học vô cơ',
          lessons: ['Tính chất chung của kim loại', 'Dãy hoạt động hóa học của kim loại', 'Tách kim loại', 'Sự ăn mòn và bảo vệ kim loại']
        },
        {
          chapter: 'Hợp chất hữu cơ và Nhiên liệu',
          lessons: ['Hợp chất hữu cơ và hóa học hữu cơ', 'Alkane và Alkene', 'Nguồn nhiên liệu', 'Ethylic alcohol và Acetic acid', 'Lipid - Carbohydrate - Protein', 'Polymer']
        },
        {
          chapter: 'Năng lượng và Điện từ học',
          lessons: ['Năng lượng cơ học (Cơ năng)', 'Ánh sáng và thấu kính', 'Điện năng và công suất điện', 'Cảm ứng điện từ']
        },
        {
          chapter: 'Di truyền học và Tiến hóa',
          lessons: ['Định luật di truyền Mendel', 'Nhiễm sắc thể và phân bào', 'DNA và RNA', 'Đột biến di truyền', 'Tiến hóa và sinh thái']
        }
      ]
    }
  },
  'Toán học': {
    id: 'math',
    name: 'Toán học',
    grades: [6, 7, 8, 9, 10, 11, 12],
    topicsByGrade: {
      6: [
        { chapter: 'Số tự nhiên', lessons: ['Tập hợp số tự nhiên', 'Phép tính với số tự nhiên', 'Tính chia hết và số nguyên tố'] },
        { chapter: 'Số nguyên', lessons: ['Tập hợp số nguyên', 'Cộng, trừ, nhân, chia số nguyên'] },
        { chapter: 'Phân số và số thập phân', lessons: ['Phân số', 'Các phép tính phân số', 'Số thập phân'] },
        { chapter: 'Hình học trực quan', lessons: ['Tam giác đều, hình vuông, lục giác đều', 'Hình chữ nhật, hình thoi, hình bình hành, hình thang cân'] }
      ],
      7: [
        { chapter: 'Số hữu tỉ và Số thực', lessons: ['Tập hợp số hữu tỉ', 'Cộng, trừ, nhân, chia số hữu tỉ', 'Số vô tỉ và số thực', 'Căn bậc hai số học'] },
        { chapter: 'Hình học và đo lường', lessons: ['Góc ở vị trí đặc biệt', 'Tia phân giác', 'Hai đường thẳng song song', 'Tam giác bằng nhau'] },
        { chapter: 'Biểu thức đại số', lessons: ['Biểu thức đại số', 'Đa thức một biến', 'Phép cộng, trừ, nhân, chia đa thức'] }
      ],
      8: [
        { chapter: 'Đa thức và Phân thức đại số', lessons: ['Đơn thức và đa thức nhiều biến', 'Hằng đẳng thức đáng nhớ', 'Phân thức đại số và các phép tính'] },
        { chapter: 'Phương trình bậc nhất và Hàm số', lessons: ['Phương trình bậc nhất một ẩn', 'Hàm số và đồ thị bậc nhất'] },
        { chapter: 'Định lí Thalès và Tam giác đồng dạng', lessons: ['Định lí Thalès', 'Tam giác đồng dạng', 'Hình khối trong thực tiễn'] }
      ],
      9: [
        { chapter: 'Phương trình và Hệ phương trình', lessons: ['Phương trình quy về bậc nhất', 'Hệ hai phương trình bậc nhất hai ẩn', 'Giải bài toán bằng cách lập hệ phương trình'] },
        { chapter: 'Phương trình bậc hai một ẩn', lessons: ['Hàm số y = ax^2', 'Công thức nghiệm phương trình bậc hai', 'Định lí Viète và ứng dụng'] },
        { chapter: 'Hệ thức lượng và Đường tròn', lessons: ['Hệ thức lượng trong tam giác vuông', 'Tỉ số lượng giác góc nhọn', 'Đường tròn và góc với đường tròn'] }
      ],
      10: [
        { chapter: 'Mệnh đề - Tập hợp - Bất phương trình', lessons: ['Mệnh đề toán học', 'Tập hợp và các phép toán', 'Bất phương trình bậc nhất hai ẩn', 'Hệ bất phương trình bậc nhất hai ẩn'] },
        { chapter: 'Hàm số và đồ thị', lessons: ['Khái niệm hàm số', 'Hàm số bậc hai và đồ thị', 'Dấu của tam thức bậc hai'] },
        { chapter: 'Hệ thức lượng và Vectơ', lessons: ['Giá trị lượng giác góc từ 0 đến 180 độ', 'Định lí côsin và sin', 'Khái niệm vectơ', 'Tổng và hiệu hai vectơ', 'Tích vô hướng'] }
      ],
      11: [
        { chapter: 'Lượng giác', lessons: ['Góc lượng giác', 'Giá trị lượng giác của góc lượng giác', 'Công thức lượng giác', 'Hàm số lượng giác', 'Phương trình lượng giác cơ bản'] },
        { chapter: 'Dãy số - Cấp số cộng - Cấp số nhân', lessons: ['Dãy số', 'Cấp số cộng', 'Cấp số nhân'] },
        { chapter: 'Giới hạn và Hàm số liên tục', lessons: ['Giới hạn của dãy số', 'Giới hạn của hàm số', 'Hàm số liên tục'] },
        { chapter: 'Đạo hàm', lessons: ['Định nghĩa đạo hàm', 'Các quy tắc tính đạo hàm', 'Đạo hàm cấp hai'] }
      ],
      12: [
        { chapter: 'Ứng dụng đạo hàm khảo sát hàm số', lessons: ['Tính đơn điệu của hàm số', 'Cực trị của hàm số', 'Giá trị lớn nhất và nhỏ nhất', 'Đường tiệm cận', 'Khảo sát và vẽ đồ thị hàm số'] },
        { chapter: 'Tọa độ không gian Oxyz', lessons: ['Hệ tọa độ trong không gian', 'Phương trình mặt cầu', 'Phương trình mặt phẳng', 'Phương trình đường thẳng'] },
        { chapter: 'Nguyên hàm và Tích phân', lessons: ['Khái niệm nguyên hàm', 'Tích phân và tính chất', 'Ứng dụng tích phân tính diện tích và thể tích'] },
        { chapter: 'Xác suất có điều kiện', lessons: ['Xác suất có điều kiện', 'Công thức xác suất toàn phần và Bayes'] }
      ]
    }
  },
  'Vật lí': {
    id: 'physics',
    name: 'Vật lí',
    grades: [10, 11, 12],
    topicsByGrade: {
      10: [
        { chapter: 'Mở đầu & Động học', lessons: ['Mô tả chuyển động', 'Chuyển động thẳng biến đổi đều', 'Chuyển động rơi tự do', 'Chuyển động ném'] },
        { chapter: 'Động lực học', lessons: ['Các định luật Newton', 'Một số lực thường gặp', 'Cân bằng của vật rắn'] },
        { chapter: 'Năng lượng & Động lượng', lessons: ['Công và công suất', 'Động năng và thế năng', 'Định luật bảo toàn cơ năng', 'Động lượng và va chạm'] }
      ],
      11: [
        { chapter: 'Dao động', lessons: ['Dao động điều hòa', 'Mô tả dao động điều hòa', 'Vận tốc và gia tốc trong dao động', 'Năng lượng trong dao động điều hòa', 'Dao động tắt dần và cưỡng bức'] },
        { chapter: 'Sóng', lessons: ['Mô tả sóng', 'Sóng ngang và sóng dọc', 'Sự giao thoa sóng', 'Sóng dừng', 'Sóng ánh sáng'] },
        { chapter: 'Điện trường & Dòng điện', lessons: ['Lực tương tác tĩnh điện', 'Điện trường và cường độ điện trường', 'Điện thế và hiệu điện thế', 'Tụ điện', 'Dòng điện không đổi'] }
      ],
      12: [
        { chapter: 'Vật lí nhiệt', lessons: ['Cấu trúc của chất và sự chuyển thể', 'Nội năng và định luật I nhiệt động lực học', 'Nhiệt độ và thang đo nhiệt độ', 'Nhiệt dung riêng và nhiệt nóng chảy riêng'] },
        { chapter: 'Khí lí tưởng', lessons: ['Mô hình động học phân tử chất khí', 'Định luật Boyle', 'Định luật Charles', 'Phương trình trạng thái khí lí tưởng'] },
        { chapter: 'Từ trường', lessons: ['Từ trường và cảm ứng từ', 'Lực từ tác dụng lên đoạn dây dẫn mang dòng điện', 'Cảm ứng điện từ', 'Dòng điện xoay chiều'] },
        { chapter: 'Vật lí hạt nhân', lessons: ['Cấu tạo hạt nhân nguyên tử', 'Năng lượng liên kết hạt nhân', 'Hiện tượng phóng xạ', 'Phản ứng hạt nhân'] }
      ]
    }
  },
  'Sinh học': {
    id: 'biology',
    name: 'Sinh học',
    grades: [10, 11, 12],
    topicsByGrade: {
      10: [
        { chapter: 'Sinh học tế bào', lessons: ['Các cấp độ tổ chức của thế giới sống', 'Các nguyên tố hóa học và nước trong tế bào', 'Các phân tử sinh học', 'Cấu trúc tế bào nhân sơ và nhân thực', 'Trao đổi chất qua màng', 'Phân bào (Nguyên phân, Giảm phân)'] },
        { chapter: 'Vi sinh vật và Virus', lessons: ['Khái quát về vi sinh vật', 'Quá trình sinh trưởng của vi sinh vật', 'Cấu tạo và chu trình nhân lên của virus'] }
      ],
      11: [
        { chapter: 'Trao đổi chất và chuyển hóa năng lượng ở sinh vật', lessons: ['Trao đổi nước và khoáng ở thực vật', 'Quang hợp ở thực vật', 'Hô hấp ở thực vật', 'Tiêu hóa ở động vật', 'Hô hấp ở động vật', 'Tuần hoàn máu', 'Bài tiết và cân bằng nội môi'] },
        { chapter: 'Cảm ứng và Sinh trưởng ở sinh vật', lessons: ['Cảm ứng ở thực vật', 'Cảm ứng ở động vật (Điện thế nghỉ và hoạt động, Synapse)', 'Sinh trưởng và phát triển', 'Sinh sản ở sinh vật'] }
      ],
      12: [
        { chapter: 'Di truyền học', lessons: ['Gen, mã di truyền và quá trình nhân đôi DNA', 'Phiên mã và dịch mã', 'Điều hòa hoạt động của gen', 'Đột biến gen', 'Nhiễm sắc thể và đột biến NST', 'Các quy luật di truyền'] },
        { chapter: 'Tiến hóa và Sinh thái học', lessons: ['Học thuyết tiến hóa', 'Quần thể sinh vật', 'Quần xã sinh vật', 'Hệ sinh thái và sinh quyển'] }
      ]
    }
  }
};

export const AVAILABLE_SUBJECTS = ['Hóa học', 'Khoa học tự nhiên', 'Toán học', 'Vật lí', 'Sinh học', 'Ngữ văn', 'Tiếng Anh', 'Lịch sử & Địa lí', 'Tin học'];
export const AVAILABLE_GRADES = [6, 7, 8, 9, 10, 11, 12];
