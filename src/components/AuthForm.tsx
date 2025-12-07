'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase'; // Импортируем напрямую из supabase
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
  const [success, setSuccess] = useState<string | null>(null);
  
  const router = useRouter();
  const isRegister = type === 'register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (isRegister) {
        // ✅ РЕГИСТРАЦИЯ - используем supabase напрямую
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              full_name: fullName,
            },
            emailRedirectTo: `${origin}/auth/callback`,
          }
        });

        if (error) {
          throw new Error(error.message || 'Ошибка регистрации');
        }

        if (data.user && !data.user.identities?.length) {
          throw new Error('Пользователь с таким email уже существует');
        }

        setSuccess('Регистрация успешна! Проверьте email для подтверждения.');
        
        // Автоматический переход через 3 секунды
        setTimeout(() => {
          router.push('/login');
        }, 3000);

      } else {
        // ✅ ВХОД - используем supabase напрямую
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw new Error(error.message || 'Неверный email или пароль');
        }

        if (data.user) {
          // Принудительный редирект для обновления сессии
          window.location.href = '/';
        }
      }
    } catch (error: any) {
      // Извлекаем понятное сообщение об ошибке
      let errorMessage = 'Произошла ошибка при авторизации';
      
      if (error.message?.includes('User already registered')) {
        errorMessage = 'Пользователь с таким email уже зарегистрирован';
      } else if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Неверный email или пароль';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Подтвердите email перед входом';
      } else if (error.message) {
        errorMessage = error.message;
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

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {isRegister && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">
                Имя пользователя *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-3 border rounded-lg"
                placeholder="username"
                required
                minLength={3}
                maxLength={20}
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="your@email.com"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Пароль *
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="••••••••"
            required
            minLength={6}
            disabled={isLoading}
          />
          <p className="text-gray-500 text-sm mt-1">
            Минимум 6 символов
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {isRegister ? 'Регистрация...' : 'Вход...'}
            </div>
          ) : isRegister ? 'Зарегистрироваться' : 'Войти'}
        </button>
      </form>

      <div className="mt-6 text-center">
        {isRegister ? (
          <p className="text-gray-600">
            Уже есть аккаунт?{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-800 font-medium">
              Войти
            </a>
          </p>
        ) : (
          <p className="text-gray-600">
            Нет аккаунта?{' '}
            <a href="/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Зарегистрироваться
            </a>
          </p>
        )}
      </div>
    </div>
  );
}