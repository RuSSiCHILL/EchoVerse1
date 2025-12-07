import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UsePostsOptions {
  limit?: number;
  hashtag?: string | null;
}

// Кеш в памяти
let postsCache: any[] = [];
let profilesCache = new Map();
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 минута

export function usePosts({ limit = 10, hashtag = null }: UsePostsOptions = {}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Проверяем кеш
  const checkCache = useCallback(() => {
    const now = Date.now();
    if (!hashtag && now - lastFetchTime < CACHE_DURATION && postsCache.length > 0) {
      return postsCache.slice(0, limit);
    }
    return null;
  }, [hashtag, limit]);

  // Загрузка постов с кешированием
  const loadPosts = useCallback(async (pageNum = 1, isRefresh = false) => {
    if (isRefresh) {
      postsCache = [];
      profilesCache.clear();
      lastFetchTime = 0;
    }

    setLoading(true);
    setError('');

    try {
      // Проверяем кеш для первой страницы
      if (pageNum === 1) {
        const cached = checkCache();
        if (cached) {
          setPosts(cached);
          setLoading(false);
          setHasMore(cached.length >= limit);
          return;
        }
      }

      // Рассчитываем offset для пагинации
      const offset = (pageNum - 1) * limit;

      // Простой запрос только постов
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('id, title, content, image_url, created_at, user_id')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        if (pageNum === 1) {
          setPosts([]);
          postsCache = [];
        }
        setHasMore(false);
        setLoading(false);
        return;
      }

      // Получаем уникальные ID пользователей
      const userIds = [...new Set(postsData.map(post => post.user_id).filter(Boolean))];
      
      // Проверяем кеш профилей
      const missingUserIds = userIds.filter(id => !profilesCache.has(id));
      
      let profilesData = userIds.map(id => profilesCache.get(id)).filter(Boolean);
      
      // Загружаем недостающие профили
      if (missingUserIds.length > 0) {
        const { data: newProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url')
          .in('id', missingUserIds);

        if (!profilesError && newProfiles) {
          // Сохраняем в кеш
          newProfiles.forEach(profile => {
            profilesCache.set(profile.id, profile);
          });
          
          profilesData = [
            ...profilesData,
            ...newProfiles
          ];
        }
      }

      // Объединяем посты с профилями
      const postsWithProfiles = postsData.map(post => ({
        ...post,
        profiles: profilesData.find(p => p.id === post.user_id) || {
          username: 'user',
          full_name: 'Пользователь',
          avatar_url: null
        }
      }));

      if (pageNum === 1) {
        // Первая страница - заменяем все посты
        setPosts(postsWithProfiles);
        postsCache = postsWithProfiles; // Сохраняем в кеш
        lastFetchTime = Date.now();
      } else {
        // Последующие страницы - добавляем к существующим
        setPosts(prev => [...prev, ...postsWithProfiles]);
      }

      setHasMore(postsData.length >= limit);
      setPage(pageNum);

    } catch (err: any) {
      console.error('Ошибка загрузки постов:', err);
      setError(err.message || 'Ошибка загрузки');
      
      // При ошибке показываем кешированные данные если есть
      if (postsCache.length > 0 && pageNum === 1) {
        setPosts(postsCache.slice(0, limit));
      } else {
        setPosts([]);
      }
    } finally {
      setLoading(false);
    }
  }, [limit, checkCache]);

  // Загрузка следующей страницы
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPosts(page + 1);
    }
  }, [loading, hasMore, page, loadPosts]);

  // Обновление постов
  const refreshPosts = useCallback(() => {
    loadPosts(1, true);
  }, [loadPosts]);

  // Загрузка при монтировании
  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refreshPosts,
    page
  };
}