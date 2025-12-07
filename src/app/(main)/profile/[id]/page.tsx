'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PostCard from '@/components/PostCard';
import { 
  User, 
  Calendar, 
  Mail, 
  MapPin, 
  Edit, 
  Users, 
  Grid, 
  List, 
  MessageCircle,
  UserPlus,
  Check,
  X,
  Heart
} from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendshipStatus, setFriendshipStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Загружаем профиль
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(profileData);

      // Загружаем посты пользователя
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          *,
          profiles(*),
          post_hashtags(
            hashtag:hashtags(*)
          ),
          likes(count),
          comments(count)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);

      // Загружаем друзей (первые 6)
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles!friendships_friend_id_fkey(*)
        `)
        .eq('user_id', userId)
        .eq('status', 'accepted')
        .limit(6);

      setFriends(friendsData?.map(f => f.friend) || []);

      // Проверяем статус дружбы с текущим пользователем
      if (user && user.id !== userId) {
        const { data: friendship } = await supabase
          .from('friendships')
          .select('*')
          .or(`and(user_id.eq.${user.id},friend_id.eq.${userId}),and(user_id.eq.${userId},friend_id.eq.${user.id})`)
          .maybeSingle();

        if (friendship) {
          setFriendshipStatus(friendship.status);
        }
      }

    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.id === userId) {
      alert('Нельзя добавить в друзья самого себя!');
      return;
    }

    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          user_id: currentUser.id,
          friend_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      setFriendshipStatus('pending');
      alert('Запрос на дружбу отправлен!');
    } catch (error) {
      console.error('Ошибка отправки запроса:', error);
      alert('Не удалось отправить запрос');
    }
  };

  const handleCancelFriendRequest = async () => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('friend_id', userId);

      if (error) throw error;

      setFriendshipStatus('');
      alert('Запрос на дружбу отменен');
    } catch (error) {
      console.error('Ошибка отмены запроса:', error);
    }
  };

  const handleAcceptFriendRequest = async () => {
    try {
      // Находим запрос на дружбу
      const { data: friendship } = await supabase
        .from('friendships')
        .select('*')
        .eq('user_id', userId)
        .eq('friend_id', currentUser.id)
        .single();

      if (friendship) {
        // Обновляем статус на "accepted"
        const { error } = await supabase
          .from('friendships')
          .update({ status: 'accepted' })
          .eq('id', friendship.id);

        if (error) throw error;

        // Создаем обратную связь дружбы
        await supabase
          .from('friendships')
          .insert({
            user_id: currentUser.id,
            friend_id: userId,
            status: 'accepted'
          });

        setFriendshipStatus('accepted');
        alert('Пользователь добавлен в друзья!');
      }
    } catch (error) {
      console.error('Ошибка принятия запроса:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Пользователь не найден</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Шапка профиля */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Аватар */}
              <div className="relative">
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                  alt={profile.full_name}
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                {profile.is_online && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>

              {/* Информация */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                    <p className="text-gray-600 text-lg">@{profile.username}</p>
                    
                    {/* Статус */}
                    {profile.bio && (
                      <p className="mt-2 text-gray-700">{profile.bio}</p>
                    )}
                  </div>

                  {/* Кнопки действий */}
                  <div className="mt-4 md:mt-0 flex space-x-3">
                    {currentUser && currentUser.id !== userId ? (
                      <>
                        {friendshipStatus === '' && (
                          <button
                            onClick={handleAddFriend}
                            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                          >
                            <UserPlus size={20} />
                            <span>Добавить в друзья</span>
                          </button>
                        )}
                        
                        {friendshipStatus === 'pending' && (
                          <div className="flex space-x-2">
                            {currentUser.id === userId ? (
                              // Если это запрос от другого пользователя
                              <>
                                <button
                                  onClick={handleAcceptFriendRequest}
                                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                                >
                                  <Check size={20} />
                                  <span>Принять</span>
                                </button>
                                <button
                                  onClick={handleCancelFriendRequest}
                                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                                >
                                  <X size={20} />
                                  <span>Отклонить</span>
                                </button>
                              </>
                            ) : (
                              // Если это наш запрос
                              <button
                                onClick={handleCancelFriendRequest}
                                className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                              >
                                <span>Запрос отправлен</span>
                              </button>
                            )}
                          </div>
                        )}
                        
                        {friendshipStatus === 'accepted' && (
                          <div className="flex space-x-2">
                            <button className="flex items-center space-x-2 bg-green-100 text-green-700 px-4 py-2 rounded-lg">
                              <Check size={20} />
                              <span>В друзьях</span>
                            </button>
                            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                              <MessageCircle size={20} />
                              <span>Написать</span>
                            </button>
                          </div>
                        )}
                      </>
                    ) : currentUser?.id === userId && (
                      <Link
                        href="/settings"
                        className="flex items-center space-x-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                      >
                        <Edit size={20} />
                        <span>Редактировать</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Дополнительная информация */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar size={18} />
                    <span>Зарегистрирован: {new Date(profile.created_at).toLocaleDateString('ru-RU')}</span>
                  </div>
                  
                  {profile.location && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <MapPin size={18} />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.email && (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <Mail size={18} />
                      <span>{profile.email}</span>
                    </div>
                  )}
                </div>

                {/* Статистика */}
                <div className="mt-8 flex space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{posts.length}</div>
                    <div className="text-gray-600">Посты</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{friends.length}</div>
                    <div className="text-gray-600">Друзья</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Друзья */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Друзья</h2>
                <Link 
                  href={`/friends/${userId}`}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Все друзья
                </Link>
              </div>
              
              {friends.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Пока нет друзей</p>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {friends.map(friend => (
                    <Link 
                      key={friend.id}
                      href={`/profile/${friend.id}`}
                      className="group text-center"
                    >
                      <img
                        src={friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`}
                        alt={friend.full_name}
                        className="w-20 h-20 rounded-full mx-auto mb-2 group-hover:scale-105 transition-transform"
                      />
                      <p className="text-sm font-medium truncate">{friend.full_name?.split(' ')[0]}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Правая колонка - Посты */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Заголовок постов */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Посты ({posts.length})
                  </h2>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    >
                      <Grid size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Список постов */}
              <div className="p-6">
                {posts.length === 0 ? (
                  <div className="text-center py-12">
                    <User size={48} className="text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет постов</h3>
                    <p className="text-gray-600">
                      {currentUser?.id === userId ? (
                        <>
                          Создайте свой первый пост!{' '}
                          <Link href="/create-post" className="text-blue-600 hover:underline">
                            Написать пост
                          </Link>
                        </>
                      ) : (
                        'Пользователь еще не публиковал посты'
                      )}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  // Сетка постов
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {posts.map(post => (
                      <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-gray-900 mb-2 truncate">{post.title}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">{post.content}</p>
                        {post.image_url && (
                          <img
                            src={post.image_url}
                            alt={post.title}
                            className="w-full h-48 object-cover rounded mb-3"
                          />
                        )}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>{new Date(post.created_at).toLocaleDateString('ru-RU')}</span>
                          <div className="flex items-center space-x-3">
                            <span className="flex items-center">
                              <Heart size={14} className="mr-1" />
                              {post.likes?.[0]?.count || 0}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle size={14} className="mr-1" />
                              {post.comments?.[0]?.count || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Список постов (полные карточки)
                  <div className="space-y-6">
                    {posts.map(post => (
                      <PostCard key={post.id} post={post} currentUser={currentUser} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}