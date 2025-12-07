'use client';

import { Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LikeButtonProps {
  postId: number;
  initialLikes: number;
  currentUser?: any;
  size?: 'sm' | 'md' | 'lg';
}

export default function LikeButton({ 
  postId, 
  initialLikes, 
  currentUser,
  size = 'md'
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isLoading, setIsLoading] = useState(false);

  const sizes = {
    sm: { icon: 16, text: 'text-sm' },
    md: { icon: 20, text: 'text-base' },
    lg: { icon: 24, text: 'text-lg' }
  };

  useEffect(() => {
    checkIfLiked();
  }, [postId, currentUser]);

  const checkIfLiked = async () => {
    if (!currentUser) return;

    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUser.id)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (!currentUser) {
      alert('Войдите, чтобы ставить лайки');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isLiked) {
        // Удаляем лайк
        await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);
        
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Добавляем лайк
        await supabase
          .from('likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Ошибка при лайке:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isLoading || !currentUser}
      className={`flex items-center space-x-1 transition-all ${
        isLiked 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-600 hover:text-red-500'
      } ${!currentUser ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={currentUser ? (isLiked ? 'Убрать лайк' : 'Поставить лайк') : 'Войдите, чтобы лайкать'}
    >
      <Heart 
        size={sizes[size].icon} 
        fill={isLiked ? "currentColor" : "none"} 
        className={isLoading ? "opacity-70" : ""}
      />
      <span className={`font-medium ${sizes[size].text}`}>
        {likeCount > 0 ? likeCount : ''}
      </span>
    </button>
  );
}