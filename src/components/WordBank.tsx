import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Plus, Edit2, Trash2, Search, Download, Upload, RotateCcw, ChevronDown } from './icons';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import type { Word, Category } from '../App';

interface WordBankProps {
  words: Word[];
  categories: Category[];
  onAddWord: (word: Omit<Word, 'id'>) => void;
  onUpdateWord: (id: string, updates: Partial<Word>) => void;
  onDeleteWord: (id: string) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
}

export function WordBank({ words, categories, onAddWord, onUpdateWord, onDeleteWord, onAddCategory }: WordBankProps) {
  const [newWord, setNewWord] = useState({ english: '', translation: '', category: '' });
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [newCategory, setNewCategory] = useState({ name: '', icon: '', color: 'bg-gray-100 text-gray-700' });
  const [showAddCategory, setShowAddCategory] = useState(false);

  const filteredWords = words.filter(word => {
    const matchesSearch = word.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         word.translation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || word.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddWord = () => {
    if (newWord.english.trim() && newWord.translation.trim() && newWord.category) {
      onAddWord(newWord);
      setNewWord({ english: '', translation: '', category: '' });
    }
  };

  const handleEditWord = (word: Word) => {
    setEditingWord(word);
  };

  const handleUpdateWord = () => {
    if (editingWord && editingWord.english.trim() && editingWord.translation.trim()) {
      onUpdateWord(editingWord.id, {
        english: editingWord.english,
        translation: editingWord.translation,
        category: editingWord.category
      });
      setEditingWord(null);
    }
  };

  const exportWords = () => {
    const csv = [
      'English,Russian,Category',
      ...words.map(word => `"${word.english}","${word.translation}","${word.category}"`)
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'word-trainer-vocabulary.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || { name: categoryId, icon: '📝', color: 'bg-gray-100 text-gray-700' };
  };

  const handleAddCategory = () => {
    if (newCategory.name.trim()) {
      const categoryId = newCategory.name.toLowerCase().replace(/\s+/g, '-');
      onAddCategory({
        ...newCategory,
        name: newCategory.name.trim(),
        icon: newCategory.icon || '📝'
      });
      setNewCategory({ name: '', icon: '', color: 'bg-gray-100 text-gray-700' });
      setShowAddCategory(false);
    }
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Add New Word Form */}
      <Card className="border-2 border-dashed border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="text-purple-700">
            Добавьте новое слово
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="english">Английское слово</Label>
              <Input
                id="english"
                placeholder="cat"
                value={newWord.english}
                onChange={(e) => setNewWord(prev => ({ ...prev, english: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="translation">Русский перевод</Label>
              <Input
                id="translation"
                placeholder="кот"
                value={newWord.translation}
                onChange={(e) => setNewWord(prev => ({ ...prev, translation: e.target.value }))}
                className="bg-white"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Категория</Label>
              <Select value={newWord.category} onValueChange={(value) => {
                if (value === 'add-new-category') {
                  setShowAddCategory(true);
                } else {
                  setNewWord(prev => ({ ...prev, category: value }));
                }
              }}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Выберите категорию" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        {category.name}
                      </span>
                    </SelectItem>
                  ))}
                  <SelectItem value="add-new-category" className="text-purple-600">
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Добавить категорию
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button 
            onClick={handleAddWord} 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            disabled={!newWord.english.trim() || !newWord.translation.trim() || !newWord.category}
          >
            <Plus className="w-4 h-4 mr-2" />
            Добавить слово
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Поиск слов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все категории</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <span className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      {category.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Category Tags */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => {
          const wordCount = words.filter(word => word.category === category.id).length;
          return (
            <Badge 
              key={category.id} 
              variant="secondary" 
              className={`${category.color} cursor-pointer hover:opacity-80 transition-opacity`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
              <span className="ml-1 bg-white/50 rounded-full px-1.5 py-0.5 text-xs">
                {wordCount}
              </span>
            </Badge>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportWords} className="flex-1 md:flex-none">
          <Download className="w-4 h-4 mr-2" />
          Экспорт CSV
        </Button>
        <Button variant="outline" className="flex-1 md:flex-none">
          <Upload className="w-4 h-4 mr-2" />
          Импорт CSV
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="flex-1 md:flex-none text-red-600 hover:text-red-700">
              <RotateCcw className="w-4 h-4 mr-2" />
              Сбросить все
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Сбросить все слова?</AlertDialogTitle>
              <AlertDialogDescription>
                Это навсегда удалит все слова из вашего словаря. Это действие нельзя отменить.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                Сбросить все слова
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <Separator />

      {/* Words List by Category */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">
            Ваш словарь ({words.length} {words.length === 1 ? 'слово' : words.length < 5 ? 'слова' : 'слов'})
          </h3>
        </div>

        {words.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Слова не найдены</h3>
            <p className="text-gray-500">Добавьте свое первое слово, чтобы начать!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {categories.map(category => {
              const categoryWords = words.filter(word => word.category === category.id);
              if (categoryWords.length === 0) return null;

              const isExpanded = expandedCategories.has(category.id);
              const displayWords = searchQuery 
                ? categoryWords.filter(word => 
                    word.english.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    word.translation.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                : categoryWords;

              if (searchQuery && displayWords.length === 0) return null;

              return (
                <Card key={category.id} className="overflow-hidden">
                  <div 
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleCategoryExpansion(category.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge className={`${category.color}`}>
                          <span className="mr-1">{category.icon}</span>
                          {category.name}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {displayWords.length} {displayWords.length === 1 ? 'слово' : displayWords.length < 5 ? 'слова' : 'слов'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {searchQuery && (
                          <span className="text-xs text-green-600">
                            найдено
                          </span>
                        )}
                        <div className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {(isExpanded || searchQuery) && (
                    <div className="border-t border-gray-100">
                      <div className="p-2 space-y-2">
                        {displayWords.map(word => (
                          <div key={word.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="font-semibold text-gray-800 truncate">{word.english}</span>
                              <span className="text-gray-400">→</span>
                              <span className="text-gray-600 truncate">{word.translation}</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditWord(word)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Удалить слово?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Вы уверены, что хотите удалить "{word.english}"? Это действие нельзя отменить.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onDeleteWord(word.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Удалить
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Category Dialog */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Добавить новую категорию</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Название категории</Label>
                <Input
                  placeholder="Например: Спорт"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Иконка (эмодзи)</Label>
                <Input
                  placeholder="⚽"
                  value={newCategory.icon}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, icon: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Цвет</Label>
                <Select 
                  value={newCategory.color} 
                  onValueChange={(value) => setNewCategory(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bg-green-100 text-green-700">🟢 Зеленый</SelectItem>
                    <SelectItem value="bg-blue-100 text-blue-700">🔵 Синий</SelectItem>
                    <SelectItem value="bg-yellow-100 text-yellow-700">🟡 Желтый</SelectItem>
                    <SelectItem value="bg-purple-100 text-purple-700">🟣 Фиолетовый</SelectItem>
                    <SelectItem value="bg-pink-100 text-pink-700">🩷 Розовый</SelectItem>
                    <SelectItem value="bg-red-100 text-red-700">🔴 Красный</SelectItem>
                    <SelectItem value="bg-orange-100 text-orange-700">🟠 Оранжевый</SelectItem>
                    <SelectItem value="bg-gray-100 text-gray-700">⚫ Серый</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleAddCategory} className="flex-1" disabled={!newCategory.name.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить категорию
                </Button>
                <Button variant="outline" onClick={() => setShowAddCategory(false)} className="flex-1">
                  Отмена
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Word Dialog */}
      {editingWord && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Редактировать слово</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Английское слово</Label>
                <Input
                  value={editingWord.english}
                  onChange={(e) => setEditingWord(prev => prev ? { ...prev, english: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Русский перевод</Label>
                <Input
                  value={editingWord.translation}
                  onChange={(e) => setEditingWord(prev => prev ? { ...prev, translation: e.target.value } : null)}
                />
              </div>
              <div className="space-y-2">
                <Label>Категория</Label>
                <Select 
                  value={editingWord.category} 
                  onValueChange={(value) => setEditingWord(prev => prev ? { ...prev, category: value } : null)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <span className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          {category.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleUpdateWord} className="flex-1">Сохранить изменения</Button>
                <Button variant="outline" onClick={() => setEditingWord(null)} className="flex-1">Отмена</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}