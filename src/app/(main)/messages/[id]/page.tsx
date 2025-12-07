'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Send, 
  ArrowLeft, 
  MoreVertical, 
  Paperclip,
  Smile,
  Image as ImageIcon,
  Phone,
  Video,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadChat();
    
    // Подписка на новые сообщения в реальном времени
    const channel = supabase.channel(`chat_${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender_id.eq.${chatId},receiver_id.eq.${chatId})`
        },
        (payload) => {
          const newMessage = payload.new;
          // Загружаем информацию об отправителе
          loadUser(newMessage.sender_id).then(sender => {
            setMessages(prev => [...prev, { ...newMessage, sender }]);
            markAsRead(newMessage.id);
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const loadUser = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return data;
  };

  const loadChat = async () => {
    setIsLoading(true);
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        router.push('/login');
        return;
      }

      // Получаем информацию о собеседнике
      const otherUser = await loadUser(chatId);
      setUser(otherUser);

      // Получаем сообщения
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (messagesData) {
        // Получаем информацию об отправителях
        const messagesWithSenders = await Promise.all(
          messagesData.map(async (msg) => {
            const sender = await loadUser(msg.sender_id);
            return { ...msg, sender };
          })
        );

        setMessages(messagesWithSenders);

        // Помечаем сообщения как прочитанные
        const unreadMessages = messagesData.filter(
          msg => msg.receiver_id === user.id && !msg.is_read
        );

        if (unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ is_read: true })
            .in('id', unreadMessages.map(msg => msg.id));
        }
      }

    } catch (error) {
      console.error('Ошибка загрузки чата:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: number) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser) return;

    setIsSending(true);
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: chatId,
          content: newMessage.trim()
        })
        .select()
        .single();

      if (error) throw error;

      // Добавляем сообщение в список
      setMessages(prev => [...prev, { ...message, sender: currentUser }]);
      setNewMessage('');

      // Прокручиваем вниз
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      alert('Не удалось отправить сообщение');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      // Загружаем файл
      const fileName = `chat_files/${currentUser.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Получаем публичную ссылку
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(fileName);

      // Отправляем сообщение с файлом
      await supabase
        .from('messages')
        .insert({
          sender_id: currentUser.id,
          receiver_id: chatId,
          content: `Файл: ${file.name}`,
          file_url: publicUrl,
          file_name: file.name,
          file_type: file.type
        });

      loadChat();

    } catch (error) {
      console.error('Ошибка загрузки файла:', error);
      alert('Не удалось загрузить файл');
    }
  };

  // Прокручиваем вниз при загрузке сообщений
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Шапка чата */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/messages" className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft size={20} />
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
                    alt={user?.full_name}
                    className="w-10 h-10 rounded-full"
                  />
                  {user?.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h2 className="font-bold text-gray-900">{user?.full_name}</h2>
                  <p className="text-sm text-gray-500">
                    {user?.is_online ? 'online' : 'был(а) недавно'}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Phone size={20} />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Video size={20} />
              </button>
              <Link 
                href={`/profile/${chatId}`}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <Info size={20} />
              </Link>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">👋</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                Начните диалог с {user?.full_name?.split(' ')[0]}
              </h3>
              <p className="text-gray-600">
                Напишите первое сообщение
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender_id === currentUser?.id;
              const showDate = true; // Можно добавить логику для группировки по датам

              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="text-center my-6">
                      <span className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full">
                        {format(new Date(message.created_at), 'd MMMM yyyy', { locale: ru })}
                      </span>
                    </div>
                  )}
                  
                  <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                      {!isOwnMessage && (
                        <div className="flex items-center mb-1">
                          <img
                            src={message.sender?.avatar_url}
                            alt={message.sender?.full_name}
                            className="w-6 h-6 rounded-full mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {message.sender?.full_name}
                          </span>
                        </div>
                      )}
                      
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          isOwnMessage
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        {message.file_url ? (
                          <div>
                            {message.file_type?.startsWith('image/') ? (
                              <img
                                src={message.file_url}
                                alt="Изображение"
                                className="max-w-full rounded-lg mb-2"
                              />
                            ) : (
                              <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
                                <ImageIcon size={20} className="text-gray-500" />
                                <div className="flex-1">
                                  <p className="font-medium">{message.file_name}</p>
                                  <p className="text-sm text-gray-500">
                                    {message.content}
                                  </p>
                                </div>
                                <a
                                  href={message.file_url}
                                  download
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  Скачать
                                </a>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        )}
                        
                        <div className={`text-xs mt-2 ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
                          {format(new Date(message.created_at), 'HH:mm', { locale: ru })}
                          {isOwnMessage && (
                            <span className="ml-2">
                              {message.is_read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className={`w-8 ${isOwnMessage ? 'order-1' : 'order-2'}`}></div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Форма отправки сообщения */}
      <div className="bg-white border-t p-4">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
            {/* Кнопка прикрепления файла */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            >
              <Paperclip size={20} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept="image/*,.pdf,.doc,.docx"
            />
            
            {/* Поле ввода */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Введите сообщение..."
                className="w-full p-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-12"
                disabled={isSending}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <Smile size={20} />
              </button>
            </div>
            
            {/* Кнопка отправки */}
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send size={20} />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}