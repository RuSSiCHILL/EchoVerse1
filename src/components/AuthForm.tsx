'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthFormProps {
  type: 'login' | 'register';
}

export default function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const isRegister = type === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegister) {
        // 1. Регистрация в Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: fullName,
            }
          }
        });

        if (authError) {
          throw new Error(authError.message || 'Ошибка регистрации');
        }

        // 2. Создаем профиль пользователя
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              username,
              full_name: fullName,
              email: authData.user.email,
              avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
              created_at: new Date().toISOString()
            });

          if (profileError) {
            throw new Error(profileError.message || 'Ошибка создания профиля');
          }
        }

        alert('Регистрация успешна! Проверьте email для подтверждения.');
        router.push('/login');

      } else {
        // Вход
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          throw new Error(authError.message || 'Неверный email или пароль');
        }

        if (data.user) {
          router.push('/');
          router.refresh();
        }
      }
    } catch (error: any) {
      // Извлекаем понятное сообщение об ошибке
      let errorMessage = 'Произошла ошибка при авторизации';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setError(errorMessage);
      console.error('Ошибка аутентификации:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">
        {isRegister ? 'Регистрация' : 'Вход в аккаунт'}
      </h1>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="username"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Полное имя
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="Иван Иванов"
                required
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="your@email.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="••••••••"
            required
            minLength={6}
          />
          <p className="text-gray-500 text-sm mt-1">
            Минимум 6 символов
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Загрузка...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <div className="mt-6 text-center">
        {isRegister ? (
          <p>
            Уже есть аккаунт?{' '}
            <a href="/login" className="text-blue-600 hover:underline">
              Войти
            </a>
          </p>
        ) : (
          <p>
            Нет аккаунта?{' '}
            <a href="/register" className="text-blue-600 hover:underline">
              Зарегистрироваться
            </a>
          </p>
        )}
      </div>
    </div>
  );
}