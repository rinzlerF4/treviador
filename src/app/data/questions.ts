// src/app/data/questions.ts

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Столица Франции?',
    options: ['Лондон', 'Берлин', 'Париж', 'Мадрид'],
    correctIndex: 2,
  },
  {
    id: 2,
    text: '2 + 2?',
    options: ['3', '4', '5', '6'],
    correctIndex: 1,
  },
  {
    id: 3,
    text: 'Какая планета ближе всего к Солнцу?',
    options: ['Венера', 'Меркурий', 'Земля', 'Марс'],
    correctIndex: 1,
  },
  {
    id: 4,
    text: 'Самый большой океан?',
    options: ['Атлантический', 'Индийский', 'Северный Ледовитый', 'Тихий'],
    correctIndex: 3,
  },
  {
    id: 5,
    text: 'Автор "Ромео и Джульетты"?',
    options: ['Джейн Остин', 'Уильям Шекспир', 'Марк Твен', 'Чарльз Диккенс'],
    correctIndex: 1,
  },
  {
    id: 6,
    text: 'Когда закончилась Вторая мировая война?',
    options: ['1943', '1944', '1945', '1946'],
    correctIndex: 2,
  },
  {
    id: 7,
    text: 'Сколько дней в високосном году?',
    options: ['365', '366', '364', '360'],
    correctIndex: 1,
  },
  {
    id: 8,
    text: 'Какой газ необходим для дыхания?',
    options: ['Кислород', 'Азот', 'Углекислый газ', 'Водород'],
    correctIndex: 0,
  },
  {
    id: 9,
    text: 'Сколько континентов на Земле?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
  },
  {
    id: 10,
    text: 'Самая длинная река в мире?',
    options: ['Амазонка', 'Нил', 'Волга', 'Миссисипи'],
    correctIndex: 1,
  },
  {
    id: 11,
    text: 'Сколько минут в одном часе?',
    options: ['30', '45', '60', '90'],
    correctIndex: 2,
  },
  {
    id: 12,
    text: 'Какой язык используется в Angular?',
    options: ['Java', 'TypeScript', 'Python', 'C#'],
    correctIndex: 1,
  },
];
