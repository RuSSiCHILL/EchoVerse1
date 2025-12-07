'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Получаем пользователя
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Войдите, чтобы создать пост');
        router.push('/login');
        return;
      }

      // 2. Простая вставка
      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      // 3. Быстрый редирект
      alert('Пост создан!');
      router.push('/');
      router.refresh();

    } catch (error: any) {
      console.error('Ошибка:', error);
      alert('Ошибка: ' + (error.message || 'Не удалось создать пост'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Создать пост</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Заголовок</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border rounded"
            placeholder="Введите заголовок"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Содержание</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border rounded h-40"
            placeholder="Напишите что-нибудь..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Публикуем...' : 'Опубликовать'}
        </button>
      </form>
    </div>
  );
}