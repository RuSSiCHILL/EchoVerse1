'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface HomeClientProps {
  initialPosts: any[];
  error?: string;
}

export default function HomeClient({ initialPosts, error }: HomeClientProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Проверяем пользователя на клиенте
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  });

  const refreshPosts = async () => {
    setLoading(true);
    try {
      const { data: newPosts } = await supabase
        .from('posts')
        .select('id, title, content, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (newPosts) {
        const postsWithStubs = newPosts.map(post => ({
          ...post,
          profiles: {
            username: 'user',
            full_name: 'Автор',
            avatar_url: null
          }
        }));
        setPosts(postsWithStubs);
      }
    } catch (err) {
      console.error('Ошибка обновления:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Лента постов</h1>
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

      {error && (
        <div className="mb-6 p-4 bg-red-50 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Пока нет постов</p>
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
            <div key={post.id} className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="flex items-center mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-bold">
                    {post.profiles.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{post.profiles.full_name}</p>
                  <p className="text-gray-500 text-sm">
                    {new Date(post.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>
              <h2 className="text-xl font-bold mb-2">{post.title}</h2>
              <p className="text-gray-700">{post.content}</p>
              
              <div className="flex gap-4 mt-4 pt-4 border-t">
                <button className="text-gray-600 hover:text-red-500">❤️</button>
                <button className="text-gray-600 hover:text-blue-500">💬</button>
                <button className="text-gray-600 hover:text-green-500 ml-auto">↪️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}