'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, User, Hash, Grid, Clock } from 'lucide-react';
import Link from 'next/link';
import debounce from 'lodash/debounce';

type SearchTab = 'users' | 'posts' | 'hashtags';

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts'); // По умолчанию ищем посты
  const [results, setResults] = useState<any>({
    users: [],
    posts: [],
    hashtags: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchStats, setSearchStats] = useState({
    posts: 0,
    users: 0,
    hashtags: 0
  });

  // Функция поиска с debounce
  const performSearch = useCallback(
    debounce(async (query: string, tab: SearchTab) => {
      if (!query.trim()) {
        setResults({ users: [], posts: [], hashtags: [] });
        setSearchStats({ posts: 0, users: 0, hashtags: 0 });
        return;
      }

      setIsLoading(true);
      try {
        // Ищем во всех таблицах параллельно
        const searches = [];

        if (tab === 'users' || tab === 'posts') {
          // Поиск пользователей
          searches.push(
            supabase
              .from('profiles')
              .select('*')
              .or(`full_name.ilike.%${query}%,username.ilike.%${query}%`)
              .limit(20)
              .then(({ data }) => {
                setResults((prev: any) => ({ ...prev, users: data || [] }));
                setSearchStats(prev => ({ ...prev, users: data?.length || 0 }));
              })
          );
        }

        if (tab === 'posts' || tab === 'posts') {
          // Поиск постов с полной информацией
          searches.push(
            supabase
              .from('posts')
              .select(`
                *,
                profiles(*),
                post_hashtags(
                  hashtag:hashtags(*)
                )
              `)
              .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
              .order('created_at', { ascending: false })
              .limit(20)
              .then(({ data }) => {
                setResults((prev: any) => ({ ...prev, posts: data || [] }));
                setSearchStats(prev => ({ ...prev, posts: data?.length || 0 }));
              })
          );
        }

        if (tab === 'hashtags' || tab === 'posts') {
          // Поиск хештегов
          searches.push(
            supabase
              .from('hashtags')
              .select(`
                *,
                post_hashtags(
                  post:posts(*)
                )
              `)
              .ilike('name', `%${query}%`)
              .order('name')
              .limit(20)
              .then(({ data }) => {
                setResults((prev: any) => ({ ...prev, hashtags: data || [] }));
                setSearchStats(prev => ({ ...prev, hashtags: data?.length || 0 }));
              })
          );
        }

        await Promise.all(searches);

      } catch (error) {
        console.error('Ошибка поиска:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(searchQuery, activeTab);
  }, [searchQuery, activeTab, performSearch]);

  const tabs = [
    { id: 'posts', label: 'Посты', icon: <Grid size={18} /> },
    { id: 'users', label: 'Люди', icon: <User size={18} /> },
    { id: 'hashtags', label: 'Хештеги', icon: <Hash size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">Поиск</h1>
      <p className="text-gray-600 mb-8">Найдите посты, людей или хештеги</p>

      {/* Поисковая строка */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Введите запрос для поиска..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg shadow-sm"
          autoFocus
        />
        {searchQuery && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
            {isLoading ? 'Ищем...' : `Найдено: ${searchStats[activeTab]}`}
          </div>
        )}
      </div>

      {/* Табы */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SearchTab)}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {searchStats[tab.id as keyof typeof searchStats] > 0 && (
              <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
                {searchStats[tab.id as keyof typeof searchStats]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Результаты */}
      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Ищем...</p>
          </div>
        ) : !searchQuery.trim() ? (
          <div className="text-center py-12">
            <Search size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Введите поисковый запрос
            </h3>
            <p className="text-gray-600">
              Попробуйте найти посты, людей или хештеги
            </p>
          </div>
        ) : results[activeTab].length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Ничего не найдено
            </h3>
            <p className="text-gray-600 mb-6">
              Попробуйте другой запрос или измените параметры поиска
            </p>
            <div className="text-sm text-gray-500">
              <p>Советы по поиску:</p>
              <ul className="mt-2 space-y-1">
                <li>• Используйте ключевые слова из заголовка</li>
                <li>• Попробуйте искать по хештегам</li>
                <li>• Убедитесь, что пост опубликован</li>
              </ul>
            </div>
          </div>
        ) : (
          <div>
            {/* Результаты постов */}
            {activeTab === 'posts' && (
              <div className="space-y-4">
                {results.posts.map((post: any) => (
                  <div
                    key={post.id}
                    className="bg-white border rounded-xl p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center mb-3">
                      <img
                        src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.username}`}
                        alt={post.profiles?.full_name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <p className="font-medium">{post.profiles?.full_name}</p>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock size={12} className="mr-1" />
                          {new Date(post.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-2 text-gray-900">
                      {post.title}
                    </h3>
                    
                    <p className="text-gray-700 line-clamp-3">
                      {post.content}
                    </p>
                    
                    {/* Хештеги поста */}
                    {post.post_hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {post.post_hashtags.map((ph: any) => (
                          <span
                            key={ph.hashtag.id}
                            className="px-2 py-1 bg-blue-50 text-blue-600 rounded-full text-xs"
                          >
                            #{ph.hashtag.name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-500">
                        ID: {post.id.substring(0, 8)}...
                      </div>
                      <Link
                        href={`/post/${post.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Открыть пост →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Результаты пользователей */}
            {activeTab === 'users' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.users.map((user: any) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.id}`}
                    className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow flex items-center space-x-4"
                  >
                    <img
                      src={user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt={user.full_name}
                      className="w-16 h-16 rounded-full"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900">{user.full_name}</h3>
                      <p className="text-gray-600">@{user.username}</p>
                      {user.bio && (
                        <p className="text-gray-500 text-sm mt-1 line-clamp-2">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Результаты хештегов */}
            {activeTab === 'hashtags' && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {results.hashtags.map((hashtag: any) => (
                  <Link
                    key={hashtag.id}
                    href={`/?hashtag=${hashtag.name}`}
                    className="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow text-center"
                  >
                    <div className="text-blue-600 text-2xl font-bold mb-2">
                      #{hashtag.name}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {hashtag.post_hashtags?.length || 0} постов
                    </p>
                    {hashtag.post_hashtags?.[0]?.post && (
                      <p className="text-gray-500 text-xs mt-2 truncate">
                        {hashtag.post_hashtags[0].post.title}
                      </p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}