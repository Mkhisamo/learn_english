import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Lock, Eye, EyeOff } from './icons';

interface PasswordProtectionProps {
  onPasswordCorrect: () => void;
}

export function PasswordProtection({ onPasswordCorrect }: PasswordProtectionProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Simple password - in a real app you'd want something more secure
  const CORRECT_PASSWORD = 'parent123';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Add a small delay to prevent brute force attempts
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === CORRECT_PASSWORD) {
      onPasswordCorrect();
    } else {
      setError('Неверный пароль. Попробуйте еще раз.');
      setPassword('');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="w-full max-w-md border-2 border-purple-200">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-purple-600" />
          </div>
          <CardTitle className="text-purple-700">Банк слов защищен</CardTitle>
          <p className="text-gray-600 text-sm">
            Введите пароль, чтобы получить доступ к управлению словами
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль..."
                  className="pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              disabled={!password || isLoading}
            >
              {isLoading ? 'Проверка...' : 'Войти'}
            </Button>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-xs text-blue-700">
                💡 <strong>Подсказка для родителей:</strong> Пароль по умолчанию: <code className="bg-blue-100 px-1 rounded">parent123</code>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Вы можете изменить пароль в коде приложения
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}