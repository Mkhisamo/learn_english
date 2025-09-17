import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress as ProgressBar } from './ui/progress';
import { Separator } from './ui/separator';
import { Trophy, Target, Calendar, Clock, TrendingUp, Star, Award, BarChart3 } from './icons';

export interface QuizResult {
  id: string;
  date: string;
  time: string;
  category: string;
  mode: 'en-to-ru' | 'ru-to-en';
  correctAnswers: number;
  totalQuestions: number;
  scorePercentage: number;
  points: number;
  mistakes: any[];
}

interface ProgressProps {
  results: QuizResult[];
  totalPoints: number;
  onClearProgress: () => void;
}

export function Progress({ results, totalPoints, onClearProgress }: ProgressProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'all'>('week');

  const filteredResults = useMemo(() => {
    const now = new Date();
    const filtered = results.filter(result => {
      const resultDate = new Date(result.date);
      const diffTime = now.getTime() - resultDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      switch (selectedPeriod) {
        case 'week':
          return diffDays <= 7;
        case 'month':
          return diffDays <= 30;
        default:
          return true;
      }
    });

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [results, selectedPeriod]);

  const stats = useMemo(() => {
    const totalQuizzes = filteredResults.length;
    const totalQuestions = filteredResults.reduce((sum, result) => sum + result.totalQuestions, 0);
    const totalCorrect = filteredResults.reduce((sum, result) => sum + result.correctAnswers, 0);
    const averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const totalPointsEarned = filteredResults.reduce((sum, result) => sum + result.points, 0);

    const streakData = calculateStreak(filteredResults);

    return {
      totalQuizzes,
      totalQuestions,
      totalCorrect,
      averageScore,
      totalPointsEarned,
      currentStreak: streakData.current,
      bestStreak: streakData.best
    };
  }, [filteredResults]);

  const categoryStats = useMemo(() => {
    const categories: { [key: string]: { total: number; correct: number; points: number } } = {};
    
    filteredResults.forEach(result => {
      if (!categories[result.category]) {
        categories[result.category] = { total: 0, correct: 0, points: 0 };
      }
      categories[result.category].total += result.totalQuestions;
      categories[result.category].correct += result.correctAnswers;
      categories[result.category].points += result.points;
    });

    return Object.entries(categories).map(([category, data]) => ({
      category,
      accuracy: Math.round((data.correct / data.total) * 100),
      points: data.points,
      total: data.total
    })).sort((a, b) => b.accuracy - a.accuracy);
  }, [filteredResults]);

  function calculateStreak(results: QuizResult[]) {
    if (results.length === 0) return { current: 0, best: 0 };

    const sortedResults = [...results].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    for (let i = 0; i < sortedResults.length; i++) {
      if (sortedResults[i].scorePercentage >= 70) {
        tempStreak++;
        bestStreak = Math.max(bestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak from the end
    for (let i = sortedResults.length - 1; i >= 0; i--) {
      if (sortedResults[i].scorePercentage >= 70) {
        currentStreak++;
      } else {
        break;
      }
    }

    return { current: currentStreak, best: bestStreak };
  }

  function getPerformanceColor(score: number) {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 80) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  }

  function getScoreEmoji(score: number) {
    if (score >= 90) return '🏆';
    if (score >= 80) return '🥈';
    if (score >= 70) return '🥉';
    return '📚';
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Вчера';
    if (diffDays <= 7) return `${diffDays} дн. назад`;
    
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  }

  if (results.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-gray-400 text-4xl mb-4">📊</div>
        <h3 className="text-lg font-semibold text-gray-600 mb-2">Статистика пуста</h3>
        <p className="text-gray-500">Пройдите первую тренировку, чтобы увидеть прогресс!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Points Display */}
      <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Star className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-800">Общие баллы</h2>
          </div>
          <div className="text-5xl font-bold text-yellow-600 mb-2">{totalPoints}</div>
          <p className="text-gray-600">
            {totalPoints >= 1000 ? 'Отличная работа! 🌟' : 
             totalPoints >= 500 ? 'Продолжай в том же духе! 👍' : 
             'Начни зарабатывать баллы! 🚀'}
          </p>
        </CardContent>
      </Card>

      {/* Period Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              variant={selectedPeriod === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('week')}
            >
              Неделя
            </Button>
            <Button
              variant={selectedPeriod === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('month')}
            >
              Месяц
            </Button>
            <Button
              variant={selectedPeriod === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPeriod('all')}
            >
              Все время
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.totalQuizzes}</div>
            <p className="text-sm text-gray-600">Тренировок</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.averageScore}%</div>
            <p className="text-sm text-gray-600">Средний результат</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.currentStreak}</div>
            <p className="text-sm text-gray-600">Текущая серия</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-800">{stats.bestStreak}</div>
            <p className="text-sm text-gray-600">Лучшая серия</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      {categoryStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Результаты по категориям</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.map(category => (
                <div key={category.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{category.category}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{category.points} баллов</Badge>
                      <span className="text-sm font-medium">{category.accuracy}%</span>
                    </div>
                  </div>
                  <ProgressBar value={category.accuracy} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Results */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>История тренировок</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onClearProgress}
            className="text-red-600 hover:text-red-700"
          >
            Очистить историю
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredResults.slice(0, 10).map(result => (
              <div key={result.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getScoreEmoji(result.scorePercentage)}</div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{result.category}</span>
                      <Badge variant="outline" className="text-xs">
                        {result.mode === 'en-to-ru' ? 'EN→RU' : 'RU→EN'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(result.date)}</span>
                      <Clock className="w-3 h-3 ml-2" />
                      <span>{result.time}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`px-2 py-1 rounded-full text-sm font-medium border ${getPerformanceColor(result.scorePercentage)}`}>
                    {result.correctAnswers}/{result.totalQuestions} ({result.scorePercentage}%)
                  </div>
                  <div className="text-sm text-gray-600 mt-1">+{result.points} баллов</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}