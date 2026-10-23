import { CURRICULUM_DATA, AVAILABLE_SUBJECTS, AVAILABLE_GRADES } from './curriculumData';

export interface TopicItem {
  id: string;
  name: string;
}

export interface LessonItem {
  id: string;
  name: string;
  topics: TopicItem[];
}

export interface ChapterItem {
  id: string;
  name: string;
  lessons: LessonItem[];
}

export interface GradeItem {
  id: string;
  gradeNumber: number; // 6 to 12
  chapters: ChapterItem[];
}

export interface SubjectItem {
  id: string;
  name: string;
  grades: GradeItem[];
}

const CATEGORIES_STORAGE_KEY = 'educhem_categories_v2';

/**
 * Normalizes string for duplicate checking (trims, lowercase, collapses spaces)
 */
export function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Builds initial default category tree from CURRICULUM_DATA
 */
export function buildDefaultCategories(): SubjectItem[] {
  const subjects: SubjectItem[] = [];

  for (const [subjName, data] of Object.entries(CURRICULUM_DATA)) {
    const grades: GradeItem[] = [];

    // For all possible grades 6 to 12
    for (const gNum of AVAILABLE_GRADES) {
      const topicList = data.topicsByGrade[gNum] || [];
      const chapters: ChapterItem[] = topicList.map((ch, chIdx) => {
        const chId = `ch-${data.id}-${gNum}-${chIdx + 1}`;
        const lessons: LessonItem[] = ch.lessons.map((ls, lsIdx) => ({
          id: `ls-${chId}-${lsIdx + 1}`,
          name: ls,
          topics: [
            { id: `top-${chId}-${lsIdx + 1}-1`, name: 'Lý thuyết trọng tâm' },
            { id: `top-${chId}-${lsIdx + 1}-2`, name: 'Bài tập vận dụng' }
          ]
        }));
        return {
          id: chId,
          name: ch.chapter,
          lessons
        };
      });

      grades.push({
        id: `gr-${data.id}-${gNum}`,
        gradeNumber: gNum,
        chapters
      });
    }

    subjects.push({
      id: data.id,
      name: subjName,
      grades
    });
  }

  // Ensure other available subjects exist even if empty initially
  for (const subjName of AVAILABLE_SUBJECTS) {
    if (!subjects.some((s) => s.name.toLowerCase() === subjName.toLowerCase())) {
      const sId = `subj-${subjName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      subjects.push({
        id: sId,
        name: subjName,
        grades: AVAILABLE_GRADES.map((gNum) => ({
          id: `gr-${sId}-${gNum}`,
          gradeNumber: gNum,
          chapters: []
        }))
      });
    }
  }

  return subjects;
}

/**
 * Loads categories from localStorage or initializes defaults
 */
export function loadCategories(): SubjectItem[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading categories:', err);
  }

  const defaults = buildDefaultCategories();
  saveCategories(defaults);
  return defaults;
}

/**
 * Saves categories to localStorage
 */
export function saveCategories(categories: SubjectItem[]): void {
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Error saving categories:', err);
  }
}

/**
 * Adds a new chapter to a subject and grade
 */
export function addChapterToCategory(
  categories: SubjectItem[],
  subjectName: string,
  gradeNumber: number,
  chapterName: string
): { updatedCategories: SubjectItem[]; newChapter: ChapterItem } {
  const normName = normalizeCategoryName(chapterName);
  const next = JSON.parse(JSON.stringify(categories)) as SubjectItem[];

  let subj = next.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(subjectName));
  if (!subj) {
    subj = {
      id: `subj-${Date.now()}`,
      name: subjectName,
      grades: AVAILABLE_GRADES.map((g) => ({
        id: `gr-${Date.now()}-${g}`,
        gradeNumber: g,
        chapters: []
      }))
    };
    next.push(subj);
  }

  let grade = subj.grades.find((g) => g.gradeNumber === gradeNumber);
  if (!grade) {
    grade = {
      id: `gr-${subj.id}-${gradeNumber}`,
      gradeNumber,
      chapters: []
    };
    subj.grades.push(grade);
  }

  // Check if chapter already exists
  let existingChapter = grade.chapters.find((c) => normalizeCategoryName(c.name) === normName);
  if (existingChapter) {
    return { updatedCategories: next, newChapter: existingChapter };
  }

  const newChapter: ChapterItem = {
    id: `ch-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: chapterName.trim(),
    lessons: [
      {
        id: `ls-${Date.now()}-1`,
        name: 'Bài 1: Kiến thức chung',
        topics: [{ id: `top-${Date.now()}-1`, name: 'Tổng quan' }]
      }
    ]
  };

  grade.chapters.push(newChapter);
  saveCategories(next);
  return { updatedCategories: next, newChapter };
}

/**
 * Adds a new lesson to a chapter
 */
export function addLessonToChapter(
  categories: SubjectItem[],
  subjectName: string,
  gradeNumber: number,
  chapterIdOrName: string,
  lessonName: string
): { updatedCategories: SubjectItem[]; newLesson: LessonItem } {
  const next = JSON.parse(JSON.stringify(categories)) as SubjectItem[];
  const normLesson = normalizeCategoryName(lessonName);

  let subj = next.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(subjectName));
  if (!subj) {
    const res = addChapterToCategory(next, subjectName, gradeNumber, 'Chương mới');
    return addLessonToChapter(res.updatedCategories, subjectName, gradeNumber, res.newChapter.id, lessonName);
  }

  let grade = subj.grades.find((g) => g.gradeNumber === gradeNumber);
  if (!grade) {
    grade = {
      id: `gr-${subj.id}-${gradeNumber}`,
      gradeNumber,
      chapters: []
    };
    subj.grades.push(grade);
  }

  let chapter = grade.chapters.find(
    (c) => c.id === chapterIdOrName || normalizeCategoryName(c.name) === normalizeCategoryName(chapterIdOrName)
  );

  if (!chapter) {
    const res = addChapterToCategory(next, subjectName, gradeNumber, chapterIdOrName);
    chapter = res.newChapter;
  }

  let existingLesson = chapter.lessons.find((l) => normalizeCategoryName(l.name) === normLesson);
  if (existingLesson) {
    return { updatedCategories: next, newLesson: existingLesson };
  }

  const newLesson: LessonItem = {
    id: `ls-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: lessonName.trim(),
    topics: [{ id: `top-${Date.now()}-1`, name: 'Trọng tâm bài học' }]
  };

  chapter.lessons.push(newLesson);
  saveCategories(next);
  return { updatedCategories: next, newLesson };
}

/**
 * Adds a new topic to a lesson
 */
export function addTopicToLesson(
  categories: SubjectItem[],
  subjectName: string,
  gradeNumber: number,
  chapterName: string,
  lessonName: string,
  topicName: string
): { updatedCategories: SubjectItem[]; newTopic: TopicItem } {
  const next = JSON.parse(JSON.stringify(categories)) as SubjectItem[];
  const normTopic = normalizeCategoryName(topicName);

  let subj = next.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(subjectName));
  let grade = subj?.grades.find((g) => g.gradeNumber === gradeNumber);
  let chapter = grade?.chapters.find((c) => normalizeCategoryName(c.name) === normalizeCategoryName(chapterName));
  let lesson = chapter?.lessons.find((l) => normalizeCategoryName(l.name) === normalizeCategoryName(lessonName));

  if (!lesson) {
    const resLesson = addLessonToChapter(next, subjectName, gradeNumber, chapterName, lessonName);
    return addTopicToLesson(resLesson.updatedCategories, subjectName, gradeNumber, chapterName, lessonName, topicName);
  }

  let existing = lesson.topics.find((t) => normalizeCategoryName(t.name) === normTopic);
  if (existing) {
    return { updatedCategories: next, newTopic: existing };
  }

  const newTopic: TopicItem = {
    id: `top-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: topicName.trim()
  };

  lesson.topics.push(newTopic);
  saveCategories(next);
  return { updatedCategories: next, newTopic };
}

/**
 * Automatically inspects document text to detect Subject, Grade (6 to 12), Chapter, Lesson, Topic
 */
export function detectCurriculumFromText(
  text: string,
  categories: SubjectItem[]
): {
  detectedSubject?: string;
  detectedGrade?: number;
  detectedChapter?: string;
  detectedLesson?: string;
  detectedTopic?: string;
  confidence: number;
} {
  const lower = text.toLowerCase();

  // Detect Subject
  let detectedSubject: string | undefined;
  for (const s of categories) {
    const sLower = s.name.toLowerCase();
    if (lower.includes(sLower)) {
      detectedSubject = s.name;
      break;
    }
  }

  // Detect Grade (6 to 12)
  let detectedGrade: number | undefined;
  const gradeMatch = text.match(/(?:lớp|khối|k|grade)\s*(1[0-2]|[6-9])/i) || text.match(/\b(1[0-2]|[6-9])\b/);
  if (gradeMatch && gradeMatch[1]) {
    const num = parseInt(gradeMatch[1], 10);
    if (num >= 6 && num <= 12) {
      detectedGrade = num;
    }
  }

  // Detect explicit tags: [CHƯƠNG: ...] or [BÀI: ...] or [CHỦ ĐỀ: ...]
  let detectedChapter: string | undefined;
  const chTagMatch = text.match(/\[(?:CHƯƠNG|CHUONG):\s*([^\]]+)\]/i) || text.match(/(?:Chương|Chuyên đề)\s*([0-9IVXLCDM]+[:\.\-][^\n\r]+)/i);
  if (chTagMatch && chTagMatch[1]) {
    detectedChapter = chTagMatch[1].trim();
  }

  let detectedLesson: string | undefined;
  const lsTagMatch = text.match(/\[(?:BÀI|BAI):\s*([^\]]+)\]/i) || text.match(/(?:Bài|Tiết)\s*([0-9IVXLCDM]+[:\.\-][^\n\r]+)/i);
  if (lsTagMatch && lsTagMatch[1]) {
    detectedLesson = lsTagMatch[1].trim();
  }

  let detectedTopic: string | undefined;
  const topTagMatch = text.match(/\[(?:CHỦ ĐỀ|CHU DE|TOPIC):\s*([^\]]+)\]/i);
  if (topTagMatch && topTagMatch[1]) {
    detectedTopic = topTagMatch[1].trim();
  }

  // If chapter not found by tag, check against existing chapters in detected subject/grade
  if (!detectedChapter && detectedSubject && detectedGrade) {
    const subj = categories.find((s) => normalizeCategoryName(s.name) === normalizeCategoryName(detectedSubject!));
    const grade = subj?.grades.find((g) => g.gradeNumber === detectedGrade);
    if (grade) {
      for (const ch of grade.chapters) {
        // e.g. "Cân bằng hóa học"
        const cleanName = ch.name.replace(/^Chương\s*\d+\s*:\s*/i, '').toLowerCase();
        if (lower.includes(cleanName) && cleanName.length > 4) {
          detectedChapter = ch.name;
          // check lessons
          for (const ls of ch.lessons) {
            const lsClean = ls.name.toLowerCase();
            if (lower.includes(lsClean) && lsClean.length > 4) {
              detectedLesson = ls.name;
              break;
            }
          }
          break;
        }
      }
    }
  }

  const confidence = (detectedSubject ? 0.3 : 0) + (detectedGrade ? 0.3 : 0) + (detectedChapter ? 0.25 : 0) + (detectedLesson ? 0.15 : 0);

  return {
    detectedSubject,
    detectedGrade,
    detectedChapter,
    detectedLesson,
    detectedTopic,
    confidence
  };
}
