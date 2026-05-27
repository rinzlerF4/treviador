// src/app/data/questions.ts

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface NumericQuestion {
  id: number;
  text: string;
  correctAnswer: number;
  unit?: string;         // e.g. "год", "км", "°C"
  hint?: string;         // shown after reveal
}

export const QUESTIONS: Question[] = [
  { id: 1,  text: 'Столица Франции?',                         options: ['Лондон', 'Берлин', 'Париж', 'Мадрид'],                   correctIndex: 2 },
  { id: 2,  text: '2 + 2 × 2 = ?',                            options: ['8', '6', '4', '10'],                                     correctIndex: 1 },
  { id: 3,  text: 'Какая планета ближе всего к Солнцу?',       options: ['Венера', 'Меркурий', 'Земля', 'Марс'],                    correctIndex: 1 },
  { id: 4,  text: 'Самый большой океан?',                      options: ['Атлантический', 'Индийский', 'Северный Ледовитый', 'Тихий'], correctIndex: 3 },
  { id: 5,  text: 'Автор "Ромео и Джульетты"?',               options: ['Джейн Остин', 'Шекспир', 'Марк Твен', 'Диккенс'],         correctIndex: 1 },
  { id: 6,  text: 'Когда закончилась Вторая мировая война?',   options: ['1943', '1944', '1945', '1946'],                          correctIndex: 2 },
  { id: 7,  text: 'Сколько дней в високосном году?',           options: ['365', '366', '364', '360'],                              correctIndex: 1 },
  { id: 8,  text: 'Какой газ необходим для дыхания?',          options: ['Кислород', 'Азот', 'CO₂', 'Водород'],                    correctIndex: 0 },
  { id: 9,  text: 'Сколько континентов на Земле?',             options: ['5', '6', '7', '8'],                                     correctIndex: 2 },
  { id: 10, text: 'Самая длинная река в мире?',                options: ['Амазонка', 'Нил', 'Волга', 'Миссисипи'],                 correctIndex: 1 },
  { id: 11, text: 'Сколько минут в одном часе?',               options: ['30', '45', '60', '90'],                                  correctIndex: 2 },
  { id: 12, text: 'Язык программирования Angular?',            options: ['Java', 'TypeScript', 'Python', 'C#'],                    correctIndex: 1 },
  { id: 13, text: 'Столица Японии?',                           options: ['Пекин', 'Сеул', 'Токио', 'Бангкок'],                    correctIndex: 2 },
  { id: 14, text: 'Химическое обозначение золота?',            options: ['Ag', 'Fe', 'Au', 'Cu'],                                  correctIndex: 2 },
  { id: 15, text: 'Кто написал "Войну и мир"?',                options: ['Достоевский', 'Толстой', 'Чехов', 'Тургенев'],           correctIndex: 1 },
  { id: 16, text: 'Скорость света в вакууме (тыс. км/с)?',     options: ['200', '300', '400', '500'],                              correctIndex: 1 },
  { id: 17, text: 'Столица Австралии?',                        options: ['Сидней', 'Мельбурн', 'Канберра', 'Брисбен'],             correctIndex: 2 },
  { id: 18, text: 'Самая высокая гора мира?',                  options: ['К2', 'Эверест', 'Канченджанга', 'Лхоцзе'],              correctIndex: 1 },
  { id: 19, text: 'Сколько граней у куба?',                    options: ['4', '6', '8', '12'],                                    correctIndex: 1 },
  { id: 20, text: 'В каком году началась Первая мировая война?', options: ['1912', '1914', '1916', '1918'],                        correctIndex: 1 },
  { id: 21, text: 'Какой элемент имеет символ "O"?',           options: ['Озон', 'Золото', 'Кислород', 'Осмий'],                   correctIndex: 2 },
  { id: 22, text: 'Столица Бразилии?',                         options: ['Рио-де-Жанейро', 'Сан-Паулу', 'Бразилиа', 'Сальвадор'], correctIndex: 2 },
  { id: 23, text: 'Сколько цветов в радуге?',                  options: ['5', '6', '7', '8'],                                     correctIndex: 2 },
  { id: 24, text: 'Самое глубокое озеро в мире?',              options: ['Каспийское', 'Байкал', 'Верхнее', 'Танганьика'],        correctIndex: 1 },
  { id: 25, text: 'Какой орган производит инсулин?',           options: ['Печень', 'Почки', 'Поджелудочная', 'Сердце'],            correctIndex: 2 },
  { id: 26, text: 'Сколько нот в музыкальной гамме?',          options: ['5', '6', '7', '8'],                                     correctIndex: 2 },
  { id: 27, text: 'Самая маленькая страна мира?',              options: ['Монако', 'Ватикан', 'Сан-Марино', 'Лихтенштейн'],       correctIndex: 1 },
  { id: 28, text: 'Самый твёрдый природный материал?',         options: ['Рубин', 'Алмаз', 'Сапфир', 'Кварц'],                    correctIndex: 1 },
  { id: 29, text: 'Сколько хромосом у человека?',              options: ['44', '46', '48', '50'],                                  correctIndex: 1 },
  { id: 30, text: 'Кто изобрёл телефон?',                      options: ['Эдисон', 'Тесла', 'Белл', 'Маркони'],                   correctIndex: 2 },
];

export const NUMERIC_QUESTIONS: NumericQuestion[] = [
  { id: 101, text: 'В каком году началась Первая мировая война?',      correctAnswer: 1914, unit: 'год' },
  { id: 102, text: 'Высота Эйфелевой башни (в метрах)?',               correctAnswer: 330,  unit: 'м' },
  { id: 103, text: 'В каком году Гагарин полетел в космос?',            correctAnswer: 1961, unit: 'год' },
  { id: 104, text: 'Население Земли (в миллиардах, целое число)?',     correctAnswer: 8,    unit: 'млрд' },
  { id: 105, text: 'Температура кипения воды на высоте 3000м (°C)?',   correctAnswer: 90,   unit: '°C' },
  { id: 106, text: 'В каком году распался СССР?',                       correctAnswer: 1991, unit: 'год' },
  { id: 107, text: 'Расстояние от Земли до Луны (тыс. км)?',           correctAnswer: 384,  unit: 'тыс. км' },
  { id: 108, text: 'В каком году была основана компания Apple?',        correctAnswer: 1976, unit: 'год' },
  { id: 109, text: 'Количество костей в теле взрослого человека?',      correctAnswer: 206,  unit: 'штук' },
  { id: 110, text: 'В каком году закончилась Вторая мировая война?',    correctAnswer: 1945, unit: 'год' },
  { id: 111, text: 'Скорость звука в воздухе (м/с)?',                  correctAnswer: 343,  unit: 'м/с' },
  { id: 112, text: 'В каком году Колумб открыл Америку?',               correctAnswer: 1492, unit: 'год' },
  { id: 113, text: 'Площадь России (млн км²)?',                         correctAnswer: 17,   unit: 'млн км²' },
  { id: 114, text: 'Атомный номер углерода?',                           correctAnswer: 6,    unit: '' },
  { id: 115, text: 'Длина Нила (тыс. км, целое число)?',               correctAnswer: 6,    unit: 'тыс. км' },
];
