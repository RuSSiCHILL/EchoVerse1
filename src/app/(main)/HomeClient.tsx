'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import { Hash, X } from 'lucide-react'; // Добавь эти импорты

interface HomeClientProps {
  initialPosts: any[];
  initialHashtags: any[]; // Добавляем начальные хештеги
  error?: string;
}

export default function HomeClient({ initialPosts, initialHashtags, error }: HomeClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [hashtags, setHashtags] = useState(initialHashtags);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Проверяем пользователя на клиенте
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  });

  const loadPosts = async (hashtag?: string | null) => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select(`
          *,
          profiles(*),
          post_hashtags(
            hashtag:hashtags(*)
          ),
          likes(count),
          comments(count)
        `)
        .order('created_at', { ascending: false });

      // Фильтрация по хештегу
      if (hashtag) {
        query = query.contains('hashtags', [{ name: hashtag }]);
      }

      const { data: newPosts } = await query;

      if (newPosts) {
        setPosts(newPosts);
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (hashtagName: string) => {
    if (selectedHashtag === hashtagName) {
      setSelectedHashtag(null);
      loadPosts(null);
    } else {
      setSelectedHashtag(hashtagName);
      loadPosts(hashtagName);
    }
  };

  const clearFilter = () => {
    setSelectedHashtag(null);
    loadPosts(null);
  };

  const refreshPosts = async () => {
    await loadPosts(selectedHashtag);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Заголовок с фильтрами */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            {selectedHashtag ? `Посты с #${selectedHashtag}` : 'Лента постов'}
          </h1>
          {selectedHashtag && (
            <button
              onClick={clearFilter}
              className="flex items-center mt-2 text-gray-600 hover:text-gray-900"
            >
              <X size={16} className="mr-1" />
              Очистить фильтр
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {user && (
            <Link 
              href="/create-post" 
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Создать
            </Link>
          )}
          <button
            onClick={refreshPosts}
            disabled={loading}
            className="bg-gray-200 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
          >
            {loading ? '...' : '⟳'}
          </button>
        </div>
      </div>

      {/* Популярные хештеги */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <Hash size={18} className="mr-2 text-gray-600" />
          <h3 className="font-medium text-gray-900">Популярные хештеги</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={clearFilter}
            className={`px-3 py-1 rounded-full ${!selectedHashtag ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            Все
          </button>
          {hashtags.map(tag => (
            <button
              key={tag.id}
              onClick={() => handleHashtagClick(tag.name)}
              className={`px-3 py-1 rounded-full flex items-center ${
                selectedHashtag === tag.name 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              #{tag.name}
              {tag.post_count && (
                <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                  selectedHashtag === tag.name 
                    ? 'bg-blue-500' 
                    : 'bg-gray-300'
                }`}>
                  {tag.post_count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Остальной код без изменений */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">
            {selectedHashtag 
              ? `Пока нет постов с #${selectedHashtag}` 
              : 'Пока нет постов'}
          </p>
          {user ? (
            <Link 
              href="/create-post" 
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Создать первый пост
            </Link>
          ) : (
            <Link 
              href="/login" 
              className="text-blue-600 hover:underline"
            >
              Войдите, чтобы создать пост
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUser={user}
              onHashtagClick={handleHashtagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}