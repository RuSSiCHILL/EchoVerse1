'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Hash, X } from 'lucide-react';

export default function CreatePostPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const router = useRouter();

  // Функция добавления хештега
  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/#/g, '');
    
    if (!tag) return;
    
    // Валидация хештега
    if (tag.length > 20) {
      setError('Хештег не может быть длиннее 20 символов');
      return;
    }
    
    if (!/^[a-zа-яё0-9_]+$/.test(tag)) {
      setError('Хештег может содержать только буквы, цифры и нижнее подчеркивание');
      return;
    }
    
    if (hashtags.includes(tag)) {
      setError('Этот хештег уже добавлен');
      return;
    }
    
    if (hashtags.length >= 5) {
      setError('Можно добавить не более 5 хештегов');
      return;
    }
    
    setHashtags([...hashtags, tag]);
    setHashtagInput('');
    setError('');
  };

  // Удаление хештега
  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  // Обработка нажатия Enter при вводе хештега
  const handleHashtagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addHashtag();
    }
  };

  // Создание или получение профиля пользователя
  const ensureUserProfile = async (userId: string, email: string) => {
    // Проверяем, есть ли профиль
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      return existingProfile;
    }

    // Создаем профиль если его нет
    const username = email.split('@')[0] + '_' + userId.substring(0, 8);
    
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username: username,
        full_name: 'Пользователь',
        email: email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      })
      .select()
      .single();

    if (profileError) {
      console.error('Ошибка создания профиля:', profileError);
      throw new Error('Не удалось создать профиль пользователя');
    }

    return newProfile;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Получаем текущего пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      if (!user) {
        alert('Войдите, чтобы создать пост');
        router.push('/login');
        return;
      }

      // 2. Гарантируем, что у пользователя есть профиль
      await ensureUserProfile(user.id, user.email || 'user@example.com');

      // 3. Создаем пост
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (postError) {
        console.error('Ошибка создания поста:', postError);
        throw new Error(postError.message || 'Не удалось создать пост');
      }

      // 4. Добавляем хештеги если они есть
      if (hashtags.length > 0 && post) {
        const hashtagPromises = hashtags.map(async (tagName) => {
          try {
            // Создаем или получаем хештег
            const { data: hashtag, error: hashtagError } = await supabase
              .from('hashtags')
              .upsert(
                { name: tagName },
                { onConflict: 'name', ignoreDuplicates: false }
              )
              .select()
              .single();

            if (hashtagError) {
              console.error(`Ошибка с хештегом ${tagName}:`, hashtagError);
              return null;
            }

            // Привязываем хештег к посту
            const { error: linkError } = await supabase
              .from('post_hashtags')
              .insert({
                post_id: post.id,
                hashtag_id: hashtag.id
              });

            if (linkError) {
              console.error(`Ошибка привязки хештега ${tagName}:`, linkError);
            }

            return true;
          } catch (err) {
            console.error(`Ошибка обработки хештега ${tagName}:`, err);
            return null;
          }
        });

        // Ждем завершения всех операций с хештегами
        await Promise.all(hashtagPromises);
      }

      // 5. Успех - редирект
      alert('Пост успешно создан!');
      router.push('/');
      router.refresh();

    } catch (error: any) {
      console.error('Ошибка создания поста:', error);
      setError(error.message || 'Произошла неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Создать пост</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Заголовок */}
        <div>
          <label className="block mb-2 font-medium">Заголовок *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="О чем будет ваш пост?"
            required
            maxLength={200}
            disabled={loading}
          />
          <p className="text-gray-500 text-sm mt-1">
            {title.length}/200 символов
          </p>
        </div>

        {/* Содержание */}
        <div>
          <label className="block mb-2 font-medium">Содержание *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none min-h-[200px]"
            placeholder="Напишите что-нибудь интересное..."
            required
            maxLength={5000}
            disabled={loading}
          />
          <p className="text-gray-500 text-sm mt-1">
            {content.length}/5000 символов
          </p>
        </div>

        {/* Хештеги */}
        <div>
          <label className="flex mb-2 font-medium items-center">
            <Hash size={16} className="mr-2" />
            Хештеги
            <span className="ml-2 text-sm font-normal text-gray-500">
              (до 5 штук, каждый до 20 символов)
            </span>
          </label>
          
          {/* Поле ввода хештегов */}
          <div className="flex mb-3">
            <input
              type="text"
              value={hashtagInput}
              onChange={(e) => {
                setHashtagInput(e.target.value);
                setError('');
              }}
              onKeyDown={handleHashtagKeyDown}
              className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Введите хештег без # и нажмите Enter"
              disabled={loading || hashtags.length >= 5}
              maxLength={20}
            />
            <button
              type="button"
              onClick={addHashtag}
              disabled={loading || hashtags.length >= 5 || !hashtagInput.trim()}
              className="bg-gray-100 text-gray-700 px-4 rounded-r-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 border-l-0"
            >
              Добавить
            </button>
          </div>
          
          {/* Список добавленных хештегов */}
          {hashtags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {hashtags.map(tag => (
                  <div
                    key={tag}
                    className="flex items-center bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full border border-blue-200"
                  >
                    <span className="font-medium">#{tag}</span>
                    <button
                      type="button"
                      onClick={() => removeHashtag(tag)}
                      disabled={loading}
                      className="ml-2 text-blue-800 hover:text-red-600 disabled:opacity-50"
                      title="Удалить хештег"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-gray-500 text-sm mt-2">
                {hashtags.length}/5 хештегов
              </p>
            </div>
          )}
          
          <p className="text-gray-500 text-sm">
            Хештеги помогают другим пользователям находить ваш пост. 
            Используйте ключевые слова, описывающие тему поста.
          </p>
        </div>

        {/* Кнопка отправки */}
        <div className="pt-4 border-t">
          <button
            type="submit"
            disabled={loading || !title.trim() || !content.trim()}
            className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium text-lg transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Публикуем...
              </span>
            ) : 'Опубликовать пост'}
          </button>
          
          <p className="text-gray-500 text-sm mt-2 text-center">
            После публикации пост появится в общей ленте
          </p>
        </div>
      </form>
    </div>
  );
}