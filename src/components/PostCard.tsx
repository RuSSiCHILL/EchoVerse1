'use client';

import { Heart, MessageCircle, Share2, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

interface PostCardProps {
  post: any;
  currentUser?: any;
}

export default function PostCard({ post, currentUser }: PostCardProps) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);

  // Отладочный вывод
  console.log('PostCard получает:', { 
    id: post.id, 
    title: post.title, 
    hasProfile: !!post.profiles,
    profileName: post.profiles?.full_name 
  });

  // Проверяем данные
  if (!post || !post.id) {
    return (
      <div className="bg-gray-100 rounded-xl p-6 border border-gray-300">
        <p className="text-gray-500">❌ Ошибка: нет данных поста</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
      {/* Автор */}
      <div className="flex items-center mb-4">
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
        
        <div>
          <p className="font-medium">
            {post.profiles?.full_name || 'Неизвестный автор'}
          </p>
          <p className="text-gray-500 text-sm">
            @{post.profiles?.username || 'user'} · 
            {new Date(post.created_at).toLocaleDateString('ru-RU')}
          </p>
        </div>
      </div>

      {/* Заголовок и контент */}
      <h2 className="text-xl font-bold mb-3 text-gray-900">
        {post.title || 'Без заголовка'}
      </h2>
      
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

      {/* Действия */}
      <div className="flex items-center gap-6 pt-4 border-t border-gray-100">
        <button 
          onClick={() => {
            if (!currentUser) return alert('Войдите, чтобы ставить лайки');
            setLiked(!liked);
            setLikes(prev => liked ? prev - 1 : prev + 1);
          }}
          className={`flex items-center gap-2 ${liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
        >
          <Heart size={20} fill={liked ? "currentColor" : "none"} />
          <span>{likes}</span>
        </button>
        
        <button className="flex items-center gap-2 text-gray-600 hover:text-blue-500">
          <MessageCircle size={20} />
          <span>0</span>
        </button>
        
        <button className="flex items-center gap-2 text-gray-600 hover:text-green-500 ml-auto">
          <Share2 size={20} />
          <span>Поделиться</span>
        </button>
      </div>

      {/* Отладочная информация (только в dev) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-300 text-xs text-gray-500">
          <p>ID: {post.id}</p>
          <p>User ID: {post.user_id || 'нет'}</p>
          <p>Profile: {post.profiles ? 'да' : 'нет'}</p>
        </div>
      )}
    </div>
  );
}