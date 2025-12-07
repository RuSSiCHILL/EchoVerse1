'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { User, UserPlus, Check, Clock, X, Search, Users } from 'lucide-react';
import Link from 'next/link';

type FriendTab = 'all' | 'online' | 'pending' | 'requests';

export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<FriendTab>('all');
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        router.push('/login');
        return;
      }

      // Загружаем друзей
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles!friendships_friend_id_fkey(*),
          user:profiles!friendships_user_id_fkey(*)
        `)
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      // Загружаем исходящие запросы (pending)
      const { data: pendingData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles!friendships_friend_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      // Загружаем входящие запросы
      const { data: receivedData } = await supabase
        .from('friendships')
        .select(`
          *,
          user:profiles!friendships_user_id_fkey(*)
        `)
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      // Форматируем список друзей
      const formattedFriends = (friendsData || []).map(f => {
        const isUserSender = f.user_id === user.id;
        return {
          ...f,
          friend_profile: isUserSender ? f.friend : f.user,
          is_online: isUserSender ? f.friend?.is_online : f.user?.is_online
        };
      });

      setFriends(formattedFriends);
      setPendingRequests(pendingData || []);
      setReceivedRequests(receivedData || []);

    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: friendId,
          status: 'pending'
        });

      if (error) throw error;

      loadData();
      alert('Запрос на дружбу отправлен!');
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
      alert('Не удалось отправить запрос');
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      // Принимаем запрос
      await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      // Создаем обратную связь
      const request = receivedRequests.find(r => r.id === requestId);
      if (request) {
        await supabase
          .from('friendships')
          .insert({
            user_id: currentUser.id,
            friend_id: request.user_id,
            status: 'accepted'
          });
      }

      loadData();
      alert('Запрос принят!');
    } catch (error) {
      console.error('Ошибка принятия запроса:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await supabase
        .from('friendships')
        .update({ status: 'rejected' })
        .eq('id', requestId);

      loadData();
      alert('Запрос отклонен');
    } catch (error) {
      console.error('Ошибка отклонения запроса:', error);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    try {
      await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      loadData();
      alert('Запрос отменен');
    } catch (error) {
      console.error('Ошибка отмены запроса:', error);
    }
  };

  const tabs = [
    { id: 'all', label: 'Все друзья', count: friends.length, icon: <Users size={18} /> },
    { id: 'online', label: 'Онлайн', count: friends.filter(f => f.is_online).length, icon: <User size={18} /> },
    { id: 'pending', label: 'Отправленные', count: pendingRequests.length, icon: <Clock size={18} /> },
    { id: 'requests', label: 'Запросы', count: receivedRequests.length, icon: <UserPlus size={18} /> },
  ];

  const filteredFriends = friends.filter(friend =>
    friend.friend_profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.friend_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Друзья</h1>
        <p className="text-gray-600">Управляйте списком друзей и запросами</p>
      </div>

      {/* Табы */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as FriendTab)}
            className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Поиск */}
      {(activeTab === 'all' || activeTab === 'online') && (
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
      )}

      {/* Контент */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загружаем...</p>
          </div>
        ) : (
          <>
            {/* Все друзья / Онлайн */}
            {(activeTab === 'all' || activeTab === 'online') && (
              <div>
                {filteredFriends.length === 0 ? (
                  <div className="p-12 text-center">
                    <Users size={64} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      {searchQuery ? 'Друзья не найдены' : 'Пока нет друзей'}
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery 
                        ? 'Попробуйте изменить поисковый запрос'
                        : 'Добавьте друзей для общения'
                      }
                    </p>
                    <Link
                      href="/search"
                      className="inline-flex items-center mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      <Search size={20} className="mr-2" />
                      Найти друзей
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                    {filteredFriends.map(friend => (
                      <div
                        key={friend.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="relative">
                            <img
                              src={friend.friend_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.friend_profile?.username}`}
                              alt={friend.friend_profile?.full_name}
                              className="w-14 h-14 rounded-full"
                            />
                            {friend.is_online && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <Link 
                              href={`/profile/${friend.friend_profile?.id}`}
                              className="font-bold text-gray-900 hover:text-blue-600 hover:underline"
                            >
                              {friend.friend_profile?.full_name}
                            </Link>
                            <p className="text-gray-600 text-sm">
                              @{friend.friend_profile?.username}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            href={`/messages/${friend.friend_profile?.id}`}
                            className="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg text-center hover:bg-blue-100 transition-colors"
                          >
                            Написать
                          </Link>
                          <button
                            onClick={() => handleCancelRequest(friend.id)}
                            className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Удалить
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Отправленные запросы */}
            {activeTab === 'pending' && (
              <div className="p-6">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock size={64} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Нет отправленных запросов
                    </h3>
                    <p className="text-gray-600">
                      Вы еще не отправили ни одного запроса на дружбу
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <img
                            src={request.friend?.avatar_url}
                            alt={request.friend?.full_name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <p className="font-medium">{request.friend?.full_name}</p>
                            <p className="text-gray-600 text-sm">@{request.friend?.username}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCancelRequest(request.id)}
                          className="text-gray-600 hover:text-red-600"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Входящие запросы */}
            {activeTab === 'requests' && (
              <div className="p-6">
                {receivedRequests.length === 0 ? (
                  <div className="text-center py-12">
                    <UserPlus size={64} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">
                      Нет входящих запросов
                    </h3>
                    <p className="text-gray-600">
                      Вам еще никто не отправил запрос на дружбу
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedRequests.map(request => (
                      <div key={request.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <img
                              src={request.user?.avatar_url}
                              alt={request.user?.full_name}
                              className="w-12 h-12 rounded-full"
                            />
                            <div>
                              <Link 
                                href={`/profile/${request.user?.id}`}
                                className="font-medium hover:underline"
                              >
                                {request.user?.full_name}
                              </Link>
                              <p className="text-gray-600 text-sm">@{request.user?.username}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                          >
                            <Check size={18} />
                            <span>Принять</span>
                          </button>
                          <button
                            onClick={() => handleRejectRequest(request.id)}
                            className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                          >
                            <X size={18} />
                            <span>Отклонить</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}