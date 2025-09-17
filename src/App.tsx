import { useState, useEffect } from 'react';
import { WordBank } from './components/WordBank';
import { Training } from './components/Training';
import { Progress, QuizResult } from './components/Progress';
import { PasswordProtection } from './components/PasswordProtection';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { useToast } from './components/ui/toast';
import { BookOpen, Target, HelpCircle, BarChart3, Star } from './components/icons';
import { MobileInstallPrompt } from './components/MobileInstallPrompt';

export type Word = {
  id: string;
  english: string;
  translation: string;
  category: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

const defaultCategories: Category[] = [
  { id: 'animals', name: 'Животные', icon: '🐶', color: 'bg-green-100 text-green-700' },
  { id: 'food', name: 'Еда', icon: '🍏', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'school', name: 'Школа', icon: '🎒', color: 'bg-blue-100 text-blue-700' },
  { id: 'family', name: 'Семья', icon: '👨‍👩‍👧‍👦', color: 'bg-purple-100 text-purple-700' },
  { id: 'toys', name: 'Игрушки', icon: '🧸', color: 'bg-pink-100 text-pink-700' },
  { id: 'colors', name: 'Цвета', icon: '🎨', color: 'bg-indigo-100 text-indigo-700' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'words' | 'training' | 'progress' | 'help'>('training');
  const [categories, setCategories] = useState<Category[]>(defaultCategories);
  const [words, setWords] = useState<Word[]>([
    { id: '1', english: 'cat', translation: 'кот', category: 'animals' },
    { id: '2', english: 'dog', translation: 'собака', category: 'animals' },
    { id: '3', english: 'apple', translation: 'яблоко', category: 'food' },
    { id: '4', english: 'book', translation: 'книга', category: 'school' },
    { id: '5', english: 'red', translation: 'красный', category: 'colors' },
  ]);
  const [telegramBotToken, setTelegramBotToken] = useState<string>('');
  const [telegramChatId, setTelegramChatId] = useState<string>('');
  const [isWordBankUnlocked, setIsWordBankUnlocked] = useState<boolean>(false);
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const { addToast, ToastContainer } = useToast();

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedResults = localStorage.getItem('word-trainer-results');
    const savedPoints = localStorage.getItem('word-trainer-points');
    
    if (savedResults) {
      try {
        const results = JSON.parse(savedResults);
        setQuizResults(results);
      } catch (error) {
        console.error('Error loading results:', error);
      }
    }
    
    if (savedPoints) {
      setTotalPoints(parseInt(savedPoints, 10) || 0);
    }
  }, []);

  // Save progress to localStorage when results change
  useEffect(() => {
    localStorage.setItem('word-trainer-results', JSON.stringify(quizResults));
  }, [quizResults]);

  useEffect(() => {
    localStorage.setItem('word-trainer-points', totalPoints.toString());
  }, [totalPoints]);

  const addWord = (word: Omit<Word, 'id'>) => {
    const newWord = { ...word, id: Date.now().toString() };
    setWords(prev => [...prev, newWord]);
  };

  const updateWord = (id: string, updates: Partial<Word>) => {
    setWords(prev => prev.map(word => word.id === id ? { ...word, ...updates } : word));
  };

  const deleteWord = (id: string) => {
    setWords(prev => prev.filter(word => word.id !== id));
  };

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: Date.now().toString() };
    setCategories(prev => [...prev, newCategory]);
  };

  const handleQuizComplete = (result: QuizResult) => {
    setQuizResults(prev => [result, ...prev]);
    setTotalPoints(prev => prev + result.points);
    
    // Show toast notification for points earned
    addToast(`🎉 Вы заработали ${result.points} баллов!`, 'success');
  };

  const clearProgress = () => {
    if (confirm('Вы уверены, что хотите очистить всю историю тренировок? Это действие нельзя отменить.')) {
      setQuizResults([]);
      setTotalPoints(0);
      localStorage.removeItem('word-trainer-results');
      localStorage.removeItem('word-trainer-points');
    }
  };

  const sendResultsToTelegram = async (results: any) => {
    if (!telegramBotToken || !telegramChatId) {
      alert('Пожалуйста, настройте Telegram бота в разделе "Как это работает"');
      return;
    }

    const message = `
🎯 Результаты тренировки Word Trainer

📊 Статистика:
• Правильных ответов: ${results.correctAnswers}/${results.totalQuestions}
• Точность: ${results.scorePercentage}%
• Баллы: +${results.points}
• Категория: ${results.category}
• Режим: ${results.mode === 'en-to-ru' ? 'Английский → Русский' : 'Русский → Английский'}

${results.mistakes.length > 0 ? `
❌ Ошибки:
${results.mistakes.map((mistake: any, index: number) => 
  `${index + 1}. ${mistake.question.word.english} → ${mistake.question.word.translation}`
).join('\n')}
` : '🎉 Все ответы правильные!'}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (response.ok) {
        alert('Результаты успешно отправлены в Telegram!');
      } else {
        throw new Error('Ошибка отправки');
      }
    } catch (error) {
      alert('Ошибка при отправке в Telegram. Проверьте настройки бота.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-2 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Тренер слов</h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">Изучай английские слова весело!</p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:gap-6">
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-600">Баллы</p>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                  <p className="text-lg sm:text-xl font-bold text-yellow-600">{totalPoints}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm text-gray-600">Слов</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-600">{words.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white/60 backdrop-blur-sm border-b border-purple-100">
        <div className="max-w-6xl mx-auto px-2 sm:px-4">
          <div className="flex gap-0.5 sm:gap-1 overflow-x-auto">
            <Button
              variant={activeTab === 'training' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('training')}
              className={`rounded-none border-b-2 text-xs sm:text-sm px-2 sm:px-3 py-2 flex-shrink-0 ${
                activeTab === 'training' 
                  ? 'border-green-500 bg-green-50 text-green-700' 
                  : 'border-transparent hover:border-green-200'
              }`}
            >
              <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Тренировка</span>
              <span className="sm:hidden">Тест</span>
            </Button>
            <Button
              variant={activeTab === 'progress' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('progress')}
              className={`rounded-none border-b-2 text-xs sm:text-sm px-2 sm:px-3 py-2 flex-shrink-0 ${
                activeTab === 'progress' 
                  ? 'border-orange-500 bg-orange-50 text-orange-700' 
                  : 'border-transparent hover:border-orange-200'
              }`}
            >
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Прогресс
            </Button>
            <Button
              variant={activeTab === 'words' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('words')}
              className={`rounded-none border-b-2 text-xs sm:text-sm px-2 sm:px-3 py-2 flex-shrink-0 ${
                activeTab === 'words' 
                  ? 'border-purple-500 bg-purple-50 text-purple-700' 
                  : 'border-transparent hover:border-purple-200'
              }`}
            >
              <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Банк слов</span>
              <span className="sm:hidden">Слова</span>
            </Button>
            <Button
              variant={activeTab === 'help' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('help')}
              className={`rounded-none border-b-2 text-xs sm:text-sm px-2 sm:px-3 py-2 flex-shrink-0 ${
                activeTab === 'help' 
                  ? 'border-blue-500 bg-blue-50 text-blue-700' 
                  : 'border-transparent hover:border-blue-200'
              }`}
            >
              <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Как это работает</span>
              <span className="sm:hidden">Помощь</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {activeTab === 'training' && (
          <Training 
            words={words} 
            categories={categories}
            totalPoints={totalPoints}
            onSendResultsToTelegram={sendResultsToTelegram}
            onQuizComplete={handleQuizComplete}
          />
        )}
        {activeTab === 'progress' && (
          <Progress
            results={quizResults}
            totalPoints={totalPoints}
            onClearProgress={clearProgress}
          />
        )}
        {activeTab === 'words' && (
          isWordBankUnlocked ? (
            <WordBank
              words={words}
              categories={categories}
              onAddWord={addWord}
              onUpdateWord={updateWord}
              onDeleteWord={deleteWord}
              onAddCategory={addCategory}
            />
          ) : (
            <PasswordProtection onPasswordCorrect={() => setIsWordBankUnlocked(true)} />
          )
        )}
        {activeTab === 'help' && (
          <div className="space-y-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Как работает Тренер слов 🎯</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-purple-600 font-bold">1</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Создайте свой банк слов</h3>
                    <p className="text-gray-600">Добавьте английские слова с русскими переводами и организуйте их по категориям, таким как Животные, Еда или Школа.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Выберите тренировку</h3>
                    <p className="text-gray-600">Выберите категорию, количество вопросов (5, 10 или 20) и режим вопросов.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-yellow-600 font-bold">3</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Практикуйтесь и изучайте</h3>
                    <p className="text-gray-600">Отвечайте на вопросы с выбором ответа и получайте мгновенную обратную связь. Зеленый означает правильно, красный - попробуйте снова!</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-blue-600 font-bold">4</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">Отслеживайте прогресс</h3>
                    <p className="text-gray-600">Смотрите свой счет и просматривайте ошибки, чтобы улучшить свои навыки владения словарем.</p>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Режимы вопросов 📝</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h4 className="font-bold text-blue-700">Английский → Русский</h4>
                  <p className="text-sm text-blue-600">Видите английское слово и выбираете правильный русский перевод</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <h4 className="font-bold text-green-700">Русский → Английский</h4>
                  <p className="text-sm text-green-600">Видите русский перевод и выбираете правильное английское слово</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Система баллов ⭐</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <h4 className="font-bold text-yellow-700 mb-2">Как зарабатывать баллы:</h4>
                  <ul className="text-sm text-yellow-600 space-y-1">
                    <li>• 10 баллов за каждый правильный ответ</li>
                    <li>• +50% бонус за 90%+ точность</li>
                    <li>• +20% бонус за 80%+ точность</li>
                    <li>• Бонус за длинные тренировки</li>
                  </ul>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <h4 className="font-bold text-purple-700 mb-2">Защита банка слов:</h4>
                  <p className="text-sm text-purple-600">
                    Банк слов защищен паролем <code className="bg-purple-100 px-1 rounded">parent123</code>, 
                    чтобы дети не могли изменять словарь самостоятельно.
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-4 sm:p-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Настройка Telegram 📱</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                Настройте Telegram бота для получения результатов тренировок
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bot-token">Токен бота</Label>
                  <Input
                    id="bot-token"
                    placeholder="1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    value={telegramBotToken}
                    onChange={(e) => setTelegramBotToken(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Получите токен у @BotFather в Telegram
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="chat-id">ID чата</Label>
                  <Input
                    id="chat-id"
                    placeholder="123456789"
                    value={telegramChatId}
                    onChange={(e) => setTelegramChatId(e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Узнайте ID чата у @userinfobot
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    if (telegramBotToken && telegramChatId) {
                      alert('Настройки сохранены! Теперь результаты будут отправляться в Telegram.');
                    } else {
                      alert('Пожалуйста, заполните все поля.');
                    }
                  }}
                  className="w-full"
                >
                  Сохранить настройки
                </Button>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <h3 className="text-lg sm:text-xl font-bold text-green-800 mb-4">📱 Запуск на мобильном телефоне</h3>
              <div className="space-y-3">
                <div className="p-3 bg-white/70 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-700 mb-2">🌐 Через браузер:</h4>
                  <p className="text-sm text-green-600">
                    Откройте приложение в любом браузере на телефоне. Интерфейс автоматически адаптируется под мобильный экран.
                  </p>
                </div>
                
                <div className="p-3 bg-white/70 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-700 mb-2">📲 Установка PWA приложения:</h4>
                  <div className="text-sm text-green-600 space-y-1">
                    <p><strong>Android (Chrome):</strong> Нажмите "Установить приложение" в всплывающем окне</p>
                    <p><strong>iPhone (Safari):</strong> Поделиться → "На экран «Домой»"</p>
                  </div>
                </div>
                
                <div className="p-3 bg-white/70 rounded-lg border border-green-200">
                  <h4 className="font-bold text-green-700 mb-2">✨ Преимущества PWA:</h4>
                  <ul className="text-sm text-green-600 space-y-1">
                    <li>• Работает без интернета после установки</li>
                    <li>• Быстрый запуск с рабочего стола</li>
                    <li>• Полноэкранный режим как у нативного приложения</li>
                    <li>• Все данные сохраняются локально</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
      <ToastContainer />
      <MobileInstallPrompt />
    </div>
  );
}