'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  MessageCircle, 
  Clock, 
  Check, 
  CheckCheck,
  Plus,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function MessagesPage() {
  const [chats, setChats] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    loadChats();
    
    // Подписка на новые сообщения в реальном времени
    const channel = supabase.channel('messages_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadChats = async () => {
    setIsLoading(true);
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        router.push('/login');
        return;
      }

      // Получаем последние сообщения с каждым пользователем
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      // Группируем сообщения по собеседникам
      const chatMap = new Map();
      
      if (messages) {
        messages.forEach(message => {
          const otherUserId = message.sender_id === user.id 
            ? message.receiver_id 
            : message.sender_id;
          
          const otherUser = message.sender_id === user.id 
            ? message.receiver 
            : message.sender;
          
          if (!chatMap.has(otherUserId)) {
            chatMap.set(otherUserId, {
              user: otherUser,
              lastMessage: message,
              unreadCount: 0
            });
          }

          // Считаем непрочитанные сообщения
          if (message.receiver_id === user.id && !message.is_read) {
            const chat = chatMap.get(otherUserId);
            chat.unreadCount += 1;
          }
        });
      }

      // Преобразуем Map в массив
      const chatsArray = Array.from(chatMap.values())
        .sort((a, b) => new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime());

      setChats(chatsArray);

    } catch (error) {
      console.error('Ошибка загрузки чатов:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: number) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
    
    loadChats();
  };

  const filteredChats = chats.filter(chat =>
    chat.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Сообщения</h1>
        <Link
          href="/messages/new"
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Новое сообщение</span>
        </Link>
      </div>

      {/* Поиск */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по сообщениям и людям..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Список чатов */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Загружаем чаты...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="p-12 text-center">
            <MessageCircle size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchQuery ? 'Чаты не найдены' : 'Сообщений пока нет'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Попробуйте изменить поисковый запрос'
                : 'Начните общение с друзьями!'
              }
            </p>
            {!searchQuery && (
              <Link
                href="/friends"
                className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                <MessageCircle size={20} className="mr-2" />
                Найти друзей для общения
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat, index) => {
              const isSender = chat.lastMessage.sender_id === currentUser?.id;
              const isUnread = !isSender && !chat.lastMessage.is_read;

              return (
                <Link
                  key={index}
                  href={`/messages/${chat.user.id}`}
                  onClick={() => markAsRead(chat.lastMessage.id)}
                  className="flex items-center p-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Аватар */}
                  <div className="relative mr-4">
                    <img
                      src={chat.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.user.username}`}
                      alt={chat.user.full_name}
                      className="w-14 h-14 rounded-full"
                    />
                    {chat.user.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>

                  {/* Информация о чате */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-gray-900 truncate">
                        {chat.user.full_name}
                      </h3>
                      <span className="text-gray-500 text-sm whitespace-nowrap ml-2">
                        {format(new Date(chat.lastMessage.created_at), 'HH:mm', { locale: ru })}
                      </span>
                    </div>

                    {/* Последнее сообщение */}
                    <div className="flex items-center">
                      {isSender ? (
                        <CheckCheck 
                          size={16} 
                          className={`mr-2 ${chat.lastMessage.is_read ? 'text-blue-500' : 'text-gray-400'}`}
                        />
                      ) : isUnread ? (
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                      ) : null}
                      
                      <p className={`text-sm truncate ${isUnread ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                        {isSender && 'Вы: '}
                        {chat.lastMessage.content}
                      </p>
                    </div>
                  </div>

                  {/* Счетчик непрочитанных */}
                  {chat.unreadCount > 0 && (
                    <div className="ml-4">
                      <span className="bg-blue-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {chat.unreadCount}
                      </span>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}