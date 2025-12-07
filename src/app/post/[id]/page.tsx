'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Heart, MessageCircle, Share2, User, Calendar, Hash } from 'lucide-react';
import Link from 'next/link';
import CommentsSection from '@/components/CommentsSection';
import LikeButton from '@/components/LikeButton';

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  
  const [post, setPost] = useState<any>(null);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    loadPost();
    checkCurrentUser();
  }, [postId]);

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const loadPost = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Загружаем пост с информацией об авторе
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(*)
        `)
        .eq('id', postId)
        .single();

      if (postError) {
        if (postError.code === 'PGRST116') {
          throw new Error('Пост не найден');
        }
        throw postError;
      }

      if (!postData) {
        throw new Error('Пост не найден');
      }

      setPost(postData);

      // 2. Загружаем хештеги поста
      const { data: hashtagsData } = await supabase
        .from('post_hashtags')
        .select(`
          hashtag:hashtags(*)
        `)
        .eq('post_id', postId);

      if (hashtagsData) {
        setHashtags(hashtagsData.map(item => item.hashtag));
      }

      // 3. Загружаем количество лайков
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setLikesCount(count || 0);

    } catch (error: any) {
      console.error('Ошибка загрузки поста:', error);
      setError(error.message || 'Не удалось загрузить пост');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    try {
      // Проверяем, лайкнул ли уже пользователь
      const { data: existingLike } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', currentUser.id)
        .single();

      if (existingLike) {
        // Удаляем лайк
        await supabase
          .from('likes')
          .delete()
          .eq('id', existingLike.id);
        setLikesCount(prev => prev - 1);
      } else {
        // Добавляем лайк
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Ошибка лайка:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка</h1>
          <p className="text-gray-600 mb-4">{error || 'Пост не найден'}</p>
          <Link 
            href="/" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft size={16} className="mr-2" />
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Кнопка назад */}
      <Link 
        href="/" 
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={20} className="mr-2" />
        Назад к ленте
      </Link>

      {/* Пост */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        {/* Автор */}
        <div className="flex items-center mb-4">
          <Link href={`/profile/${post.profiles?.id}`} className="flex items-center">
            <img
              src={post.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profiles?.username}`}
              alt={post.profiles?.full_name}
              className="w-12 h-12 rounded-full mr-3"
            />
          </Link>
          
          <div className="flex-1">
            <Link href={`/profile/${post.profiles?.id}`} className="hover:underline">
              <p className="font-bold text-gray-900">{post.profiles?.full_name}</p>
            </Link>
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar size={12} className="mr-1" />
              {new Date(post.created_at).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>

        {/* Заголовок и контент */}
        <h1 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
          {post.title}
        </h1>
        
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 whitespace-pre-line text-lg leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Изображение (если есть) */}
        {post.image_url && (
          <div className="mb-6">
            <img 
              src={post.image_url} 
              alt={post.title}
              className="w-full rounded-lg max-h-96 object-cover"
            />
          </div>
        )}

        {/* Хештеги */}
        {hashtags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {hashtags.map(hashtag => (
              <Link
                key={hashtag.id}
                href={`/search?q=${hashtag.name}&tab=hashtags`}
                className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Hash size={12} className="mr-1" />
                {hashtag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Статистика и действия */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
            >
              <Heart size={20} />
              <span className="font-medium">{likesCount}</span>
            </button>
            
            <div className="flex items-center space-x-2 text-gray-600">
              <MessageCircle size={20} />
              <span className="font-medium">Комментировать</span>
            </div>
          </div>

          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: post.title,
                  text: post.content.substring(0, 100),
                  url: window.location.href
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('Ссылка скопирована в буфер обмена!');
              }
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Share2 size={20} />
            <span>Поделиться</span>
          </button>
        </div>
      </div>

      {/* Комментарии */}
      <CommentsSection 
        postId={postId} 
        currentUser={currentUser}
        initialCommentsCount={0}
      />
    </div>
  );
}