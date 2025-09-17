import { useState, useMemo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Play, SkipForward, RotateCcw, Trophy, Target, Star } from './icons';
import type { Word, Category } from '../App';

interface TrainingProps {
  words: Word[];
  categories: Category[];
  totalPoints: number;
  onSendResultsToTelegram?: (results: QuizResults) => void;
  onQuizComplete?: (result: QuizResult) => void;
}

type QuestionMode = 'en-to-ru' | 'ru-to-en';
type TrainingPhase = 'setup' | 'quiz' | 'results';
type QuestionState = 'answering' | 'feedback';

interface Question {
  word: Word;
  options: string[];
  correctAnswer: string;
  mode: QuestionMode;
}

interface Answer {
  question: Question;
  selectedAnswer: string;
  isCorrect: boolean;
}

interface QuizResults {
  correctAnswers: number;
  totalQuestions: number;
  scorePercentage: number;
  mistakes: Answer[];
  category: string;
  mode: QuestionMode;
  points: number;
}

interface QuizResult {
  id: string;
  date: string;
  time: string;
  category: string;
  mode: QuestionMode;
  correctAnswers: number;
  totalQuestions: number;
  scorePercentage: number;
  points: number;
  mistakes: Answer[];
}

export function Training({ words, categories, totalPoints, onSendResultsToTelegram, onQuizComplete }: TrainingProps) {
  const [phase, setPhase] = useState<TrainingPhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [questionMode, setQuestionMode] = useState<QuestionMode>('en-to-ru');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [questionState, setQuestionState] = useState<QuestionState>('answering');
  const [showHints, setShowHints] = useState<boolean>(true);

  const availableWords = useMemo(() => {
    return selectedCategory === 'all' 
      ? words 
      : words.filter(word => word.category === selectedCategory);
  }, [words, selectedCategory]);

  const generateQuestions = () => {
    if (availableWords.length < 4) return [];

    const shuffledWords = [...availableWords].sort(() => Math.random() - 0.5);
    const selectedWords = shuffledWords.slice(0, Math.min(questionCount, shuffledWords.length));

    return selectedWords.map(word => {
      const correctAnswer = questionMode === 'en-to-ru' ? word.translation : word.english;
      
      // Generate wrong answers from other words
      const otherWords = availableWords.filter(w => w.id !== word.id);
      const wrongAnswers = otherWords
        .map(w => questionMode === 'en-to-ru' ? w.translation : w.english)
        .filter(answer => answer !== correctAnswer)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);

      // If we don't have enough wrong answers, add some generic ones
      while (wrongAnswers.length < 3) {
        const genericAnswers = questionMode === 'en-to-ru' 
          ? ['неизвестно', 'другое', 'что-то'] 
          : ['unknown', 'other', 'something'];
        const generic = genericAnswers[wrongAnswers.length];
        if (!wrongAnswers.includes(generic)) {
          wrongAnswers.push(generic);
        }
      }

      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);

      return {
        word,
        options,
        correctAnswer,
        mode: questionMode
      };
    });
  };

  const startTraining = () => {
    const newQuestions = generateQuestions();
    if (newQuestions.length === 0) return;
    
    setQuestions(newQuestions);
    setCurrentQuestionIndex(0);
    setAnswers([]);
    setSelectedAnswer('');
    setQuestionState('answering');
    setPhase('quiz');
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    const newAnswer: Answer = {
      question: currentQuestion,
      selectedAnswer,
      isCorrect
    };

    setAnswers(prev => [...prev, newAnswer]);

    if (showHints) {
      setQuestionState('feedback');
    } else {
      proceedToNext();
    }
  };

  const proceedToNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedAnswer('');
      setQuestionState('answering');
    } else {
      setPhase('results');
    }
  };

  const skipQuestion = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const newAnswer: Answer = {
      question: currentQuestion,
      selectedAnswer: '',
      isCorrect: false
    };

    setAnswers(prev => [...prev, newAnswer]);
    proceedToNext();
  };

  const resetTraining = () => {
    setPhase('setup');
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers([]);
    setSelectedAnswer('');
    setQuestionState('answering');
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '📝', color: 'bg-gray-100 text-gray-700' };
  };

  if (words.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">📚</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Нет доступных слов</h3>
        <p className="text-gray-500">Сначала добавьте слова в свой словарь!</p>
      </Card>
    );
  }

  // Setup Phase
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Target className="w-5 h-5" />
              Настройки тренировки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Режим вопросов</Label>
              <RadioGroup value={questionMode} onValueChange={(value) => setQuestionMode(value as QuestionMode)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en-to-ru" id="en-to-ru" />
                  <Label htmlFor="en-to-ru">Английский → Русский</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ru-to-en" id="ru-to-en" />
                  <Label htmlFor="ru-to-en">Русский → Английский</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Подсказки</Label>
              <RadioGroup value={showHints ? 'yes' : 'no'} onValueChange={(value) => setShowHints(value === 'yes')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="hints-yes" />
                  <Label htmlFor="hints-yes">Включить подсказки</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="hints-no" />
                  <Label htmlFor="hints-no">Без подсказок</Label>
                </div>
              </RadioGroup>
              <p className="text-sm text-gray-600">
                С подсказками вы увидите правильный ответ после каждого вопроса
              </p>
            </div>

            <div className="space-y-2">
              <Label>Категория</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории ({words.length} слов)</SelectItem>
                  {categories.map(category => {
                    const wordCount = words.filter(word => word.category === category.id).length;
                    return wordCount > 0 ? (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name} ({wordCount} слов)
                        </span>
                      </SelectItem>
                    ) : null;
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Количество вопросов</Label>
              <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 вопросов</SelectItem>
                  <SelectItem value="10">10 вопросов</SelectItem>
                  <SelectItem value="20">20 вопросов</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4">
              <Button 
                onClick={startTraining} 
                className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                disabled={availableWords.length < 4}
              >
                <Play className="w-4 h-4 mr-2" />
                Начать тренировку
              </Button>
              {availableWords.length < 4 && (
                <p className="text-sm text-red-600 mt-2 text-center">
                  Нужно минимум 4 слова в выбранной категории для начала тренировки
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Quiz Phase
  if (phase === 'quiz') {
    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
    const categoryInfo = getCategoryInfo(currentQuestion.word.category);

    return (
      <div className="space-y-6">
        {/* Progress */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Вопрос {currentQuestionIndex + 1} из {questions.length}
              </span>
              <Badge className={categoryInfo.color}>
                <span className="mr-1">{categoryInfo.icon}</span>
                {categoryInfo.name}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="border-2 border-blue-200">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-gray-600 mb-2">
              {questionMode === 'en-to-ru' ? 'Что означает это слово?' : 'Какое английское слово означает:'}
            </p>
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              {questionMode === 'en-to-ru' ? currentQuestion.word.english : currentQuestion.word.translation}
            </h2>
            
            <div className="grid gap-3 max-w-md mx-auto">
              {currentQuestion.options.map((option, index) => {
                let buttonStyle = 'border-gray-200 hover:border-blue-300 hover:bg-blue-25';
                
                if (questionState === 'feedback') {
                  if (option === currentQuestion.correctAnswer) {
                    buttonStyle = 'border-green-500 bg-green-50 text-green-700';
                  } else if (selectedAnswer === option && option !== currentQuestion.correctAnswer) {
                    buttonStyle = 'border-red-500 bg-red-50 text-red-700';
                  }
                } else if (selectedAnswer === option) {
                  buttonStyle = 'border-blue-500 bg-blue-50';
                }

                return (
                  <label
                    key={index}
                    className={`
                      flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${buttonStyle}
                      ${questionState === 'feedback' ? 'cursor-default' : 'cursor-pointer'}
                    `}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={option}
                      checked={selectedAnswer === option}
                      onChange={(e) => questionState === 'answering' && setSelectedAnswer(e.target.value)}
                      className="sr-only"
                      disabled={questionState === 'feedback'}
                    />
                    <span className="text-lg">{option}</span>
                    {questionState === 'feedback' && option === currentQuestion.correctAnswer && (
                      <span className="ml-auto text-green-600">✓</span>
                    )}
                    {questionState === 'feedback' && selectedAnswer === option && option !== currentQuestion.correctAnswer && (
                      <span className="ml-auto text-red-600">✗</span>
                    )}
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {questionState === 'answering' ? (
            <>
              <Button
                variant="outline"
                onClick={skipQuestion}
                className="flex-1"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                Пропустить
              </Button>
              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                {showHints ? 'Проверить' : (currentQuestionIndex === questions.length - 1 ? 'Завершить' : 'Далее')}
              </Button>
            </>
          ) : (
            <Button
              onClick={proceedToNext}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              {currentQuestionIndex === questions.length - 1 ? 'Завершить' : 'Далее'}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Results Phase
  if (phase === 'results') {
    const correctAnswers = answers.filter(answer => answer.isCorrect).length;
    const scorePercentage = Math.round((correctAnswers / answers.length) * 100);
    const mistakes = answers.filter(answer => !answer.isCorrect);

    // Calculate points based on performance
    const calculatePoints = () => {
      const basePoints = correctAnswers * 10; // 10 points per correct answer
      const bonusMultiplier = scorePercentage >= 90 ? 1.5 : scorePercentage >= 80 ? 1.2 : 1;
      const difficultyBonus = questionCount >= 20 ? 20 : questionCount >= 10 ? 10 : 0;
      return Math.round(basePoints * bonusMultiplier + difficultyBonus);
    };

    const points = calculatePoints();

    const results: QuizResults = {
      correctAnswers,
      totalQuestions: answers.length,
      scorePercentage,
      mistakes,
      points,
      category: selectedCategory === 'all' ? 'Все категории' : getCategoryInfo(selectedCategory).name,
      mode: questionMode
    };

    // Save result to progress tracking
    const quizResult: QuizResult = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      category: results.category,
      mode: questionMode,
      correctAnswers,
      totalQuestions: answers.length,
      scorePercentage,
      points,
      mistakes
    };

    // Call the callback to save progress (only once)
    if (onQuizComplete && !sessionStorage.getItem(`quiz-completed-${quizResult.id}`)) {
      onQuizComplete(quizResult);
      sessionStorage.setItem(`quiz-completed-${quizResult.id}`, 'true');
    }

    return (
      <div className="space-y-6">
        {/* Score Card */}
        <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">
              {scorePercentage >= 80 ? '🏆' : scorePercentage >= 60 ? '🥈' : '🥉'}
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Тренировка завершена!</h2>
            <p className="text-xl text-gray-600 mb-4">
              Вы ответили правильно на <span className="font-bold text-green-600">{correctAnswers}</span> из{' '}
              <span className="font-bold">{answers.length}</span> вопросов
            </p>
            <div className="text-4xl font-bold text-purple-600 mb-4">
              {scorePercentage}%
            </div>
            
            {/* Points Display */}
            <div className="bg-white/70 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-bold text-gray-700">Заработано баллов:</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600">+{points}</div>
              <div className="text-sm text-gray-600 mt-1">
                Всего баллов: {totalPoints + points}
              </div>
            </div>

            {/* Performance Message */}
            <div className="text-sm text-gray-600">
              {scorePercentage >= 90 && '🌟 Превосходно! Отличная работа!'}
              {scorePercentage >= 80 && scorePercentage < 90 && '👍 Отлично! Продолжай в том же духе!'}
              {scorePercentage >= 70 && scorePercentage < 80 && '💪 Хорошо! Тренируйся еще больше!'}
              {scorePercentage < 70 && '📚 Не расстраивайся! Попробуй еще раз!'}
            </div>
          </CardContent>
        </Card>

        {/* Mistakes Review */}
        {mistakes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Просмотрите свои ошибки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mistakes.map((mistake, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">
                          {mistake.question.mode === 'en-to-ru' 
                            ? mistake.question.word.english 
                            : mistake.question.word.translation}
                        </span>
                        <span className="text-gray-500 mx-2">→</span>
                        <span className="text-green-600 font-semibold">
                          {mistake.question.correctAnswer}
                        </span>
                      </div>
                      {mistake.selectedAnswer && (
                        <span className="text-red-600 text-sm">
                          Вы выбрали: {mistake.selectedAnswer}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <Button
              onClick={resetTraining}
              variant="outline"
              className="flex-1"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Новая тренировка
            </Button>
            <Button
              onClick={() => {
                setPhase('setup');
                setQuestions(generateQuestions());
                setCurrentQuestionIndex(0);
                setAnswers([]);
                setSelectedAnswer('');
                setQuestionState('answering');
                if (questions.length > 0) {
                  setPhase('quiz');
                }
              }}
              className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Попробовать снова
            </Button>
          </div>
          {onSendResultsToTelegram && (
            <Button
              onClick={() => onSendResultsToTelegram(results)}
              variant="outline"
              className="w-full text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300"
            >
              📱 Отправить результаты в Telegram
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}