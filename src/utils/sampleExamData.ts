import { Question, Exam } from '../types';

export const EXACT_SAMPLE_QUESTIONS: Question[] = [
  // PHẦN I: TRẮC NGHIỆM 4 LỰA CHỌN (8 CÂU - CHỦ ĐỀ CÂN BẰNG HÓA HỌC)
  {
    id: 'cbhh-p1-01',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'NHAN_BIET',
    customLevelTag: '[BIẾT]',
    content: 'Một phản ứng thuận nghịch đạt trạng thái cân bằng hóa học khi',
    options: [
      { label: 'A', content: 'phản ứng thuận đã dừng lại hoàn toàn.' },
      { label: 'B', content: 'nồng độ của các chất phản ứng bằng nồng độ của các sản phẩm.' },
      { label: 'C', content: 'tốc độ của phản ứng thuận bằng tốc độ của phản ứng nghịch.' },
      { label: 'D', content: 'khối lượng các chất tham gia phản ứng bằng khối lượng các chất tạo thành.' }
    ],
    correctOption: 'C',
    explanation: 'Cân bằng hóa học là trạng thái của phản ứng thuận nghịch khi tốc độ phản ứng thuận bằng tốc độ phản ứng nghịch ($v_t = v_n$).',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-02',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'NHAN_BIET',
    customLevelTag: '[BIẾT]',
    content: 'Biểu thức hằng số cân bằng $K_C$ của phản ứng thuận nghịch: $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$ là',
    options: [
      { label: 'A', content: '$K_C = \\frac{[NH_3]^2}{[N_2] \\cdot [H_2]^3}$' },
      { label: 'B', content: '$K_C = \\frac{[N_2] \\cdot [H_2]^3}{[NH_3]^2}$' },
      { label: 'C', content: '$K_C = \\frac{2[NH_3]}{[N_2] + 3[H_2]}$' },
      { label: 'D', content: '$K_C = \\frac{[NH_3]}{[N_2] \\cdot [H_2]}$' }
    ],
    correctOption: 'A',
    explanation: 'Theo định luật tác dụng khối lượng, hằng số cân bằng $K_C$ bằng tỉ số giữa tích nồng độ sản phẩm với số mũ tương ứng và tích nồng độ chất phản ứng với số mũ tương ứng: $K_C = \\frac{[NH_3]^2}{[N_2] \\cdot [H_2]^3}$.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-03',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'THONG_HIEU',
    customLevelTag: '[HIỂU]',
    content: 'Cho cân bằng hóa học sau trong bình kín: $CaCO_3(s) \\rightleftharpoons CaO(s) + CO_2(g)$ $\\Delta_r H^0_{298} > 0$. Biện pháp nào sau đây làm cân bằng chuyển dịch theo chiều thuận?',
    options: [
      { label: 'A', content: 'Tăng áp suất chung của hệ phản ứng.' },
      { label: 'B', content: 'Tăng nhiệt độ của hệ phản ứng.' },
      { label: 'C', content: 'Thêm một lượng chất rắn $CaCO_3$ vào bình.' },
      { label: 'D', content: 'Giảm thể tích của bình phản ứng.' }
    ],
    correctOption: 'B',
    explanation: 'Phản ứng thuận thu nhiệt ($\\Delta_r H^0_{298} > 0$). Khi tăng nhiệt độ, cân bằng chuyển dịch theo chiều thu nhiệt (chiều thuận). Thêm chất rắn không làm chuyển dịch cân bằng.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-04',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'THONG_HIEU',
    customLevelTag: '[HIỂU]',
    content: 'Cho cân bằng hóa học: $2SO_2(g) + O_2(g) \\rightleftharpoons 2SO_3(g)$ $\\Delta_r H^0_{298} = -197$ kJ. Phát biểu nào sau đây sai?',
    options: [
      { label: 'A', content: 'Khi tăng nhiệt độ, cân bằng chuyển dịch theo chiều nghịch.' },
      { label: 'B', content: 'Khi tăng áp suất của hệ, hiệu suất phản ứng tạo $SO_3$ tăng.' },
      { label: 'C', content: 'Chất xúc tác $V_2O_5$ làm tăng tốc độ đạt trạng thái cân bằng nhưng không làm chuyển dịch cân bằng.' },
      { label: 'D', content: 'Khi tăng nồng độ $O_2$, hằng số cân bằng $K_C$ của phản ứng tăng lên.' }
    ],
    correctOption: 'D',
    explanation: 'Phát biểu D sai vì hằng số cân bằng $K_C$ chỉ phụ thuộc vào nhiệt độ và bản chất của phản ứng, không phụ thuộc vào nồng độ các chất.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-05',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'VAN_DUNG',
    customLevelTag: '[VẬN DỤNG]',
    content: 'Ở $445^\\circ$C, hằng số cân bằng $K_C$ của phản ứng: $H_2(g) + I_2(g) \\rightleftharpoons 2HI(g)$ là 50. Cho 1,0 mol $H_2$ và 1,0 mol $I_2$ vào bình kín dung tích 1,0 L rồi nung nóng đến $445^\\circ$C. Nồng độ mol của $HI$ ở trạng thái cân bằng là',
    options: [
      { label: 'A', content: '0,78 M.' },
      { label: 'B', content: '1,56 M.' },
      { label: 'C', content: '0,22 M.' },
      { label: 'D', content: '0,44 M.' }
    ],
    correctOption: 'B',
    explanation: 'Đặt $x$ là nồng độ $H_2$ phản ứng $\\rightarrow [HI] = 2x$. Ta có: $\\frac{(2x)^2}{(1-x)(1-x)} = 50 \\Rightarrow \\frac{2x}{1-x} = \\sqrt{50} \\approx 7,071 \\Rightarrow x \\approx 0,78$ M $\\Rightarrow [HI] = 2x = 1,56$ M.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-06',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'VAN_DUNG',
    customLevelTag: '[VẬN DỤNG]',
    content: 'Cho phản ứng thuận nghịch: $PCl_5(g) \\rightleftharpoons PCl_3(g) + Cl_2(g)$. Nạp $PCl_5$ vào bình kín chân không dung tích 2,0 L ở nhiệt độ $T$. Khi phản ứng đạt trạng thái cân bằng, trong bình có 0,4 mol $PCl_5$; 0,2 mol $PCl_3$ và 0,2 mol $Cl_2$. Giá trị hằng số cân bằng $K_C$ của phản ứng ở nhiệt độ $T$ là',
    options: [
      { label: 'A', content: '0,05.' },
      { label: 'B', content: '0,10.' },
      { label: 'C', content: '0,20.' },
      { label: 'D', content: '0,50.' }
    ],
    correctOption: 'A',
    explanation: 'Nồng độ tại cân bằng: $[PCl_5] = 0,4 / 2 = 0,2$ M; $[PCl_3] = [Cl_2] = 0,2 / 2 = 0,1$ M. Hằng số $K_C = \\frac{0,1 \\times 0,1}{0,2} = 0,05$.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-07',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'VAN_DUNG_CAO',
    customLevelTag: '[VẬN DỤNG CAO]',
    content: 'Ở $25^\\circ$C, xét cân bằng trong một xilanh kín có pít-tông di động: $N_2O_4(g)$ (không màu) $\\rightleftharpoons 2NO_2(g)$ (nâu đỏ) $\\Delta_r H^0_{298} = 57,2$ kJ. Ban đầu hệ đang ở trạng thái cân bằng. Tiến hành nén nhanh pít-tông để thể tích hệ giảm đi một nửa và giữ nguyên nhiệt độ ở $25^\\circ$C. Hiện tượng quan sát được về màu sắc của khí trong xilanh là',
    options: [
      { label: 'A', content: 'màu nâu đỏ nhạt dần ngay lập tức, sau đó đậm dần lên đến khi ổn định.' },
      { label: 'B', content: 'màu nâu đỏ đậm lên ngay lập tức, sau đó nhạt dần nhưng màu cuối cùng vẫn đậm hơn màu ban đầu.' },
      { label: 'C', content: 'màu nâu đỏ đậm lên ngay lập tức và giữ nguyên không thay đổi theo thời gian.' },
      { label: 'D', content: 'màu nâu đỏ đậm lên ngay lập tức, sau đó nhạt dần và màu cuối cùng nhạt hơn màu ban đầu.' }
    ],
    correctOption: 'B',
    explanation: 'Khi nén thể tích giảm một nửa, nồng độ $NO_2$ tăng gấp đôi tức thời làm màu đậm lên ngay. Sau đó cân bằng dịch chuyển sang chiều nghịch (chiều giảm số mol khí, tạo $N_2O_4$) làm nồng độ $NO_2$ giảm bớt nhưng tại trạng thái cân bằng mới, nồng độ $NO_2$ vẫn cao hơn ban đầu theo nguyên lí Le Chatelier.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p1-08',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_I',
    type: 'MULTIPLE_CHOICE',
    level: 'VAN_DUNG_CAO',
    customLevelTag: '[VẬN DỤNG CAO]',
    content: 'Một bình kín có dung tích không đổi chứa hỗn hợp khí $SO_2$ và $O_2$ theo tỉ lệ mol tương ứng là 2:1 ở $25^\\circ$C và áp suất ban đầu là $p_1$. Nung nóng bình với chất xúc tác $V_2O_5$ đến $450^\\circ$C để xảy ra phản ứng: $2SO_2(g) + O_2(g) \\rightleftharpoons 2SO_3(g)$. Khi hệ đạt trạng thái cân bằng ở $450^\\circ$C, làm nguội bình về đúng nhiệt độ ban đầu ($25^\\circ$C, giả thiết các chất vẫn ở thể khí) thì áp suất khí trong bình đo được là $p_2 = 0,80p_1$. Hiệu suất của phản ứng tổng hợp $SO_3$ ở điều kiện trên là',
    options: [
      { label: 'A', content: '60%.' },
      { label: 'B', content: '40%.' },
      { label: 'C', content: '30%.' },
      { label: 'D', content: '20%.' }
    ],
    correctOption: 'A',
    explanation: 'Giả sử ban đầu có 2 mol $SO_2$ và 1 mol $O_2 \\rightarrow n_1 = 3$ mol. Ở cùng nhiệt độ và thể tích: $\\frac{p_2}{p_1} = \\frac{n_2}{n_1} = 0,8 \\Rightarrow n_2 = 2,4$ mol. Độ giảm số mol: $\\Delta n = n_1 - n_2 = 0,6$ mol $= \\frac{1}{2} n_{SO_2 \\text{ phản ứng}} \\Rightarrow n_{SO_2 \\text{ phản ứng}} = 1,2$ mol. Hiệu suất $H = \\frac{1,2}{2} \\times 100\\% = 60\\%$.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // PHẦN II: ĐÚNG SAI (2 CÂU - CHỦ ĐỀ CÂN BẰNG HÓA HỌC)
  {
    id: 'cbhh-p2-01',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_II',
    type: 'TRUE_FALSE',
    level: 'THONG_HIEU',
    customLevelTag: '[HIỂU – VẬN DỤNG]',
    content: 'Trong công nghiệp, ammonia ($NH_3$) được tổng hợp theo quá trình Haber – Bosch qua phản ứng thuận nghịch: $N_2(g) + 3H_2(g) \\rightleftharpoons 2NH_3(g)$ $\\Delta_r H^0_{298} = -91,8$ kJ. Quá trình sản xuất thường được thực hiện ở nhiệt độ khoảng $400^\\circ$C – $450^\\circ$C, áp suất khoảng 150 – 200 bar với xúc tác sắt phủ oxide nhôm và kali.',
    items: [
      {
        label: 'a',
        content: 'Phản ứng tổng hợp $NH_3$ là phản ứng tỏa nhiệt, do đó khi hạ nhiệt độ phản ứng, cân bằng sẽ chuyển dịch theo chiều thuận.',
        correctAnswer: 'D',
        explanation: 'Đúng. $\\Delta_r H^0_{298} < 0$ (tỏa nhiệt), giảm nhiệt độ cân bằng dịch chuyển theo chiều tỏa nhiệt (chiều thuận).'
      },
      {
        label: 'b',
        content: 'Việc tăng áp suất của hệ phản ứng vừa làm tăng tốc độ phản ứng, vừa làm cân bằng chuyển dịch theo chiều thuận giúp tăng hiệu suất tạo $NH_3$.',
        correctAnswer: 'D',
        explanation: 'Đúng. Tăng áp suất làm tăng mật độ hạt $\\rightarrow$ tăng tốc độ; đồng thời chuyển dịch theo chiều giảm số mol khí ($4 \\rightarrow 2$) là chiều thuận.'
      },
      {
        label: 'c',
        content: 'Khi nồng độ $N_2$ và $H_2$ tăng gấp đôi thì giá trị hằng số cân bằng $K_C$ của phản ứng sẽ tăng lên.',
        correctAnswer: 'S',
        explanation: 'Sai. $K_C$ chỉ phụ thuộc vào nhiệt độ và bản chất phản ứng, không đổi khi thay đổi nồng độ các chất.'
      },
      {
        label: 'd',
        content: 'Trong thực tế, người ta không chọn nhiệt độ quá thấp (dù có lợi về chuyển dịch cân bằng) vì ở nhiệt độ thấp tốc độ phản ứng diễn ra quá chậm.',
        correctAnswer: 'D',
        explanation: 'Đúng. Ở nhiệt độ thấp, tốc độ phản ứng quá chậm, chất xúc tác kém hoạt động nên phải chọn nhiệt độ tối ưu ($400 - 450^\\circ$C).'
      }
    ],
    explanation: 'Quá trình Haber – Bosch tổng hợp ammonia: phản ứng tỏa nhiệt, giảm thể tích. Cần phối hợp tối ưu giữa cân bằng hóa học và tốc độ phản ứng.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p2-02',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_II',
    type: 'TRUE_FALSE',
    level: 'VAN_DUNG_CAO',
    customLevelTag: '[VẬN DỤNG – VẬN DỤNG CAO]',
    content: 'Ở $25^\\circ$C, xét hệ cân bằng trong bình kín dung tích 1,0 L không đổi: $N_2O_4(g)$ (không màu) $\\rightleftharpoons 2NO_2(g)$ (nâu đỏ) $\\Delta_r H^0_{298} = 57,2$ kJ. Ban đầu nạp vào bình 0,05 mol $N_2O_4$. Khi hệ đạt trạng thái cân bằng ở $25^\\circ$C, phân tích thấy có 0,02 mol $NO_2$ được tạo thành.',
    items: [
      {
        label: 'a',
        content: 'Phản ứng thuận là phản ứng thu nhiệt, do đó khi ngâm bình vào chậu nước đá thì màu nâu đỏ của khí trong bình sẽ đậm dần lên.',
        correctAnswer: 'S',
        explanation: 'Sai. Ngâm vào nước đá là hạ nhiệt độ $\\rightarrow$ cân bằng chuyển dịch theo chiều tỏa nhiệt (chiều nghịch, tạo $N_2O_4$ không màu) $\\rightarrow$ màu nâu đỏ nhạt dần.'
      },
      {
        label: 'b',
        content: 'Nồng độ của $N_2O_4$ ở trạng thái cân bằng là 0,04 M.',
        correctAnswer: 'D',
        explanation: 'Đúng. $n_{N_2O_4 \\text{ phản ứng}} = \\frac{1}{2} n_{NO_2} = 0,01$ mol $\\Rightarrow n_{N_2O_4 \\text{ cb}} = 0,05 - 0,01 = 0,04$ mol $\\rightarrow [N_2O_4] = 0,04$ M.'
      },
      {
        label: 'c',
        content: 'Hằng số cân bằng $K_C$ của phản ứng ở $25^\\circ$C có giá trị bằng 0,01.',
        correctAnswer: 'D',
        explanation: 'Đúng. $K_C = \\frac{[NO_2]^2}{[N_2O_4]} = \\frac{0,02^2}{0,04} = 0,01$.'
      },
      {
        label: 'd',
        content: 'Nếu giữ nguyên nhiệt độ và nạp thêm vào bình 0,02 mol $NO_2$, cân bằng sẽ chuyển dịch theo chiều nghịch và tại trạng thái cân bằng mới, nồng độ của $NO_2$ sẽ nhỏ hơn 0,02 M.',
        correctAnswer: 'S',
        explanation: 'Sai. Thêm $NO_2$, cân bằng dịch theo chiều nghịch để làm giảm lượng $NO_2$ thêm vào, nhưng theo nguyên lí Le Chatelier, nồng độ $NO_2$ ở trạng thái cân bằng mới vẫn phải lớn hơn nồng độ ban đầu ($[NO_2]_{\\text{mới}} > 0,02$ M).'
      }
    ],
    explanation: 'Cân bằng $N_2O_4 \\rightleftharpoons 2NO_2$ có hằng số cân bằng $K_C = 0,01$. Phản ứng thuận thu nhiệt, chuyển dịch theo chiều nghịch khi làm lạnh.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // PHẦN III: TRẢ LỜI NGẮN (2 CÂU - CHỦ ĐỀ CÂN BẰNG HÓA HỌC)
  {
    id: 'cbhh-p3-01',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_III',
    type: 'SHORT_ANSWER',
    level: 'VAN_DUNG',
    customLevelTag: '[VẬN DỤNG]',
    content: 'Cho phản ứng thuận nghịch: $CO(g) + H_2O(g) \\rightleftharpoons CO_2(g) + H_2(g)$. Ở nhiệt độ $T$, hằng số cân bằng $K_C = 4$. Ban đầu nạp vào bình kín 1 mol $CO$ và 1 mol $H_2O$. Khi phản ứng đạt trạng thái cân bằng ở nhiệt độ $T$, nồng độ phần trăm về thể tích của khí $CO_2$ trong hỗn hợp sau phản ứng là bao nhiêu phần trăm? (Làm tròn kết quả đến hàng đơn vị).',
    shortAnswer: '33',
    explanation: 'Gọi $x$ là số mol $CO$ phản ứng. Tại trạng thái cân bằng: $n_{CO} = 1 - x; n_{H_2O} = 1 - x; n_{CO_2} = x; n_{H_2} = x$. Biểu thức: $K_C = \\frac{x^2}{(1-x)^2} = 4 \\Rightarrow \\frac{x}{1-x} = 2 \\Rightarrow x = \\frac{2}{3}$ mol. Tổng số mol khí tại cân bằng: $n_{hh} = 2$ mol. Phần trăm thể tích: $\\%V_{CO_2} = \\frac{x}{n_{hh}} \\times 100\\% = \\frac{2/3}{2} \\times 100\\% \\approx 33,33\\% \\approx 33\\%$.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'cbhh-p3-02',
    subject: 'Hóa học',
    grade: 11,
    chapter: 'Chủ đề Cân bằng hóa học',
    part: 'PART_III',
    type: 'SHORT_ANSWER',
    level: 'VAN_DUNG_CAO',
    customLevelTag: '[VẬN DỤNG CAO]',
    content: 'Ở $850^\\circ$C, hằng số cân bằng của phản ứng tổng hợp phosgene là $K_C$: $CO(g) + Cl_2(g) \\rightleftharpoons COCl_2(g)$. Nạp vào bình kín dung tích 2,0 L hỗn hợp gồm 0,8 mol $CO$ và 0,6 mol $Cl_2$. Giữ bình ở $850^\\circ$C cho đến khi cân bằng được thiết lập, thấy có 0,4 mol $COCl_2$ được tạo thành. Giá trị của hằng số cân bằng $K_C$ ở nhiệt độ này bằng bao nhiêu?',
    shortAnswer: '5',
    explanation: 'Thể tích bình $V = 2,0$ L. Tại cân bằng: $n_{COCl_2} = 0,4$ mol $\\Rightarrow [COCl_2] = 0,4/2 = 0,2$ M. $n_{CO} = 0,8 - 0,4 = 0,4$ mol $\\Rightarrow [CO] = 0,4/2 = 0,2$ M. $n_{Cl_2} = 0,6 - 0,4 = 0,2$ mol $\\Rightarrow [Cl_2] = 0,2/2 = 0,1$ M. Hằng số cân bằng: $K_C = \\frac{[COCl_2]}{[CO] \\cdot [Cl_2]} = \\frac{0,2}{0,2 \\times 0,1} = 5$.',
    isVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_SAMPLE_EXAM: Exam = {
  id: 'exam-cbhh-3phan',
  title: 'Chủ đề Cân bằng hóa học - Đề kiểm tra chuẩn GDPT 2018 (3 phần)',
  subject: 'Hóa học',
  grade: 11,
  durationMinutes: 50,
  pinCode: '839201',
  minScoreForExplanation: 5.0,
  partPoints: {
    PART_I: 4.0,
    PART_II: 3.0,
    PART_III: 3.0
  },
  questions: EXACT_SAMPLE_QUESTIONS,
  createdAt: new Date().toISOString()
};

export const SAMPLE_CHEMISTRY_QUESTIONS = EXACT_SAMPLE_QUESTIONS;
