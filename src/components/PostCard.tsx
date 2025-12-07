'use client';

import { Heart, MessageCircle, Share2, User, Hash } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PostCardProps {
  post: any;
  currentUser?: any;
  onHashtagClick?: (hashtag: string) => void;
}

export default function PostCard({ post, currentUser, onHashtagClick }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Загружаем хештеги и статистику для поста
  useEffect(() => {
    loadPostData();
  }, [post.id]);

  const loadPostData = async () => {
    try {
      // Загружаем хештеги
      const { data: hashtagsData } = await supabase
        .from('post_hashtags')
        .select(`
          hashtag:hashtags(*)
        `)
        .eq('post_id', post.id);

      if (hashtagsData) {
        setHashtags(hashtagsData.map(item => item.hashtag));
      }

      // Загружаем количество лайков
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      setLikes(likesCount || 0);

      // Загружаем количество комментариев
      const { count: commentsCountData } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', post.id);

      setCommentsCount(commentsCountData || 0);

      // Проверяем, лайкнул ли текущий пользователь
      if (currentUser) {
        const { data } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id)
          .maybeSingle();

        setLiked(!!data);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных поста:', error);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('Войдите, чтобы ставить лайки');
      return;
    }

    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (liked) {
        // Удаляем лайк
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id);
        
        setLiked(false);
        setLikes(prev => prev - 1);
      } else {
        // Добавляем лайк
        await supabase
          .from('likes')
          .insert({
            post_id: post.id,
            user_id: currentUser.id
          });
        
        setLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Ошибка при лайке:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Отладочный вывод (только в dev)
  if (process.env.NODE_ENV === 'development') {
    console.log('PostCard получает:', { 
      id: post.id, 
      title: post.title, 
      hasProfile: !!post.profiles,
      profileName: post.profiles?.full_name,
      hashtagsCount: hashtags.length
    });
  }

  // Проверяем данные
  if (!post || !post.id) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
        <p className="text-gray-500">❌ Ошибка: нет данных поста</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 hover:shadow-md transition-shadow">
      {/* Автор */}
      <div className="flex items-center mb-4">
        <Link href={`/profile/${post.profiles?.id || post.user_id}`} className="flex items-center">
          {post.profiles?.avatar_url ? (
            <img
              src={post.profiles.avatar_url}
              alt={post.profiles.full_name}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
              <User size={20} className="text-gray-500" />
            </div>
          )}
        </Link>
        
        <div>
          <Link href={`/profile/${post.profiles?.id || post.user_id}`} className="hover:underline">
            <p className="font-medium text-gray-900">
              {post.profiles?.full_name || 'Неизвестный автор'}
            </p>
          </Link>
          <p className="text-gray-500 text-sm">
            @{post.profiles?.username || 'user'} · 
            {' '}{new Date(post.created_at).toLocaleDateString('ru-RU')} · 
            {' '}{new Date(post.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Заголовок и контент */}
      <Link href={`/post/${post.id}`} className="block">
        <h2 className="text-xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition-colors">
          {post.title || 'Без заголовка'}
        </h2>
      </Link>
      
      <p className="text-gray-700 mb-4 whitespace-pre-line">
        {post.content || 'Нет содержимого'}
      </p>

      {/* Изображение (если есть) */}
      {post.image_url && (
        <div className="mb-4">
          <img 
            src={post.image_url} 
            alt={post.title}
            className="w-full rounded-lg max-h-96 object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      )}

      {/* Хештеги */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 mb-4">
          {hashtags.map(hashtag => (
            <button
              key={hashtag.id}
              onClick={() => onHashtagClick && onHashtagClick(hashtag.name)}
              className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm hover:bg-blue-100 hover:text-blue-700 transition-colors border border-blue-100"
            >
              <Hash size={12} className="mr-1" />
              {hashtag.name}
            </button>
          ))}
        </div>
      )}

      {/* Действия */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
        <button 
          onClick={handleLike}
          disabled={isLoading || !currentUser}
          className={`flex items-center gap-2 transition-colors ${
            liked ? 'text-red-500 hover:text-red-600' : 'text-gray-600 hover:text-red-500'
          } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={currentUser ? (liked ? 'Убрать лайк' : 'Поставить лайк') : 'Войдите, чтобы лайкать'}
        >
          <Heart 
            size={20} 
            fill={liked ? "currentColor" : "none"} 
            className={isLoading ? "animate-pulse" : ""}
          />
          <span className="font-medium">{likes}</span>
        </button>
        
        <Link 
          href={`/post/${post.id}`}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-500 transition-colors"
        >
          <MessageCircle size={20} />
          <span className="font-medium">{commentsCount}</span>
        </Link>
        
        <button 
          className="flex items-center gap-2 text-gray-600 hover:text-green-500 ml-auto transition-colors"
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: post.title,
                text: post.content?.substring(0, 100),
                url: `${window.location.origin}/post/${post.id}`
              });
            } else {
              navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
              alert('Ссылка скопирована в буфер обмена!');
            }
          }}
          title="Поделиться"
        >
          <Share2 size={20} />
          <span className="hidden sm:inline">Поделиться</span>
        </button>
      </div>

      {/* Отладочная информация (только в dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-xs text-gray-500">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p><strong>ID:</strong> {post.id}</p>
              <p><strong>User ID:</strong> {post.user_id || 'нет'}</p>
              <p><strong>Profile:</strong> {post.profiles ? 'да' : 'нет'}</p>
            </div>
            <div>
              <p><strong>Хештеги:</strong> {hashtags.length}</p>
              <p><strong>Лайки:</strong> {likes}</p>
              <p><strong>Комментарии:</strong> {commentsCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}