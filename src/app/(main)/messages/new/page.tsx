'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Search, UserPlus, MessageCircle, User } from 'lucide-react';
import Link from 'next/link';

export default function NewMessagePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        friend.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const loadFriends = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Получаем друзей пользователя
      const { data: friendships } = await supabase
        .from('friendships')
        .select(`
          friend:profiles!friendships_friend_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const friendsList = friendships?.map(f => f.friend) || [];
      setFriends(friendsList);
      setFilteredFriends(friendsList);

    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = (friendId: string) => {
    router.push(`/messages/${friendId}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Новое сообщение</h1>
        <p className="text-gray-600">Выберите друга для начала диалога</p>
      </div>

      {/* Поиск */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени или username..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Список друзей */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загружаем друзей...</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="p-12 text-center">
            {searchQuery ? (
              <>
                <Search size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Друзья не найдены
                </h3>
                <p className="text-gray-600 mb-6">
                  Попробуйте изменить поисковый запрос
                </p>
              </>
            ) : (
              <>
                <UserPlus size={64} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  У вас пока нет друзей
                </h3>
                <p className="text-gray-600 mb-6">
                  Добавьте друзей, чтобы начать общение
                </p>
                <Link
                  href="/friends"
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  <User size={20} className="mr-2" />
                  Найти друзей
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredFriends.map(friend => (
              <button
                key={friend.id}
                onClick={() => startChat(friend.id)}
                className="w-full flex items-center p-4 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Аватар */}
                <div className="relative mr-4">
                  <img
                    src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                    alt={friend.full_name}
                    className="w-14 h-14 rounded-full"
                  />
                  {friend.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Информация */}
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{friend.full_name}</h3>
                  <p className="text-gray-600">@{friend.username}</p>
                </div>

                {/* Иконка */}
                <MessageCircle className="text-blue-600" size={20} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}