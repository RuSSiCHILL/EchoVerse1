'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, User, Trash2, Edit, X, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface CommentsSectionProps {
  postId: string;
  currentUser?: any;
  initialCommentsCount?: number;
}

export default function CommentsSection({ 
  postId, 
  currentUser,
  initialCommentsCount = 0 
}: CommentsSectionProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          profiles(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      setComments(data || []);
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!currentUser) {
      alert('Войдите, чтобы комментировать');
      return;
    }

    if (!newComment.trim()) return;

    setIsPosting(true);
    try {
      const { data: comment, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: currentUser.id,
          content: newComment.trim()
        })
        .select(`
          *,
          profiles(*)
        `)
        .single();

      if (error) throw error;

      setComments(prev => [...prev, comment]);
      setNewComment('');
    } catch (error) {
      console.error('Ошибка при добавлении комментария:', error);
      alert('Не удалось добавить комментарий');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Удалить комментарий?')) return;

    try {
      await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      setComments(prev => prev.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
    }
  };

  const handleEditComment = async (commentId: number) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ 
          content: editContent.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId);

      if (error) throw error;

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editContent, updated_at: new Date().toISOString() }
          : comment
      ));

      setEditingCommentId(null);
      setEditContent('');
    } catch (error) {
      console.error('Ошибка редактирования комментария:', error);
    }
  };

  const startEditing = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  const cancelEditing = () => {
    setEditingCommentId(null);
    setEditContent('');
  };

  const isCommentOwner = (commentUserId: string) => {
    return currentUser && currentUser.id === commentUserId;
  };

  return (
    <div className="border-t border-gray-100 pt-4 mt-4">
      <h3 className="font-medium text-gray-900 mb-4">
        Комментарии ({comments.length})
      </h3>

      {/* Список комментариев */}
      <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Загружаем комментарии...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">Комментариев пока нет. Будьте первым!</p>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="flex items-start space-x-3 group">
              {/* Аватар */}
              <img
                src={comment.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.profiles?.username}`}
                alt={comment.profiles?.full_name}
                className="w-8 h-8 rounded-full mt-1 shrink-0"
              />

              {/* Контент комментария */}
              <div className="flex-1">
                <div className="bg-gray-50 p-3 rounded-lg">
                  {/* Заголовок */}
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <span className="font-medium text-gray-900">
                        {comment.profiles?.full_name}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">
                        {format(new Date(comment.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                        {comment.updated_at !== comment.created_at && ' (ред.)'}
                      </span>
                    </div>

                    {/* Кнопки действий */}
                    {isCommentOwner(comment.user_id) && (
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {editingCommentId === comment.id ? (
                          <>
                            <button
                              onClick={() => handleEditComment(comment.id)}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Сохранить"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Отменить"
                            >
                              <X size={14} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => startEditing(comment)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="Редактировать"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Удалить"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Текст комментария */}
                  {editingCommentId === comment.id ? (
                    <div className="mt-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        rows={3}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Форма добавления комментария */}
      {currentUser ? (
        <div className="flex space-x-3">
          <img
            src={currentUser.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
            alt="Ваш аватар"
            className="w-8 h-8 rounded-full mt-1 shrink-0"
          />
          <div className="flex-1">
            <div className="flex">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Напишите комментарий..."
                className="flex-1 p-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={2}
                disabled={isPosting}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isPosting}
                className="bg-blue-600 text-white px-4 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                title="Отправить"
              >
                {isPosting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Нажмите Enter для отправки, Shift+Enter для новой строки
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Войдите
            </a>
            , чтобы оставлять комментарии
          </p>
        </div>
      )}
    </div>
  );
}