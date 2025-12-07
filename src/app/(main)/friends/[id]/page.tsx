'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Users, ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

export default function UserFriendsPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  
  const [friends, setFriends] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Загружаем профиль пользователя
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      setProfile(profileData);

      // Загружаем друзей пользователя
      const { data: friendsData } = await supabase
        .from('friendships')
        .select(`
          *,
          friend:profiles!friendships_friend_id_fkey(*),
          user:profiles!friendships_user_id_fkey(*)
        `)
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
        .eq('status', 'accepted');

      // Форматируем список друзей
      const formattedFriends = (friendsData || []).map(f => {
        const friendProfile = f.user_id === userId ? f.friend : f.user;
        return {
          ...f,
          friend_profile: friendProfile,
          is_online: friendProfile?.is_online
        };
      });

      setFriends(formattedFriends);

    } catch (error) {
      console.error('Ошибка загрузки друзей:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Заголовок */}
      <div className="mb-8">
        <Link 
          href={`/profile/${userId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} className="mr-2" />
          Назад к профилю
        </Link>
        
        <div className="flex items-center space-x-4">
          <Users size={32} className="text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">
              Друзья {profile?.full_name}
            </h1>
            <p className="text-gray-600">
              {friends.length} {friends.length === 1 ? 'друг' : friends.length < 5 ? 'друга' : 'друзей'}
            </p>
          </div>
        </div>
      </div>

      {/* Список друзей */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {friends.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={64} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Пока нет друзей
            </h3>
            <p className="text-gray-600">
              {profile?.full_name} еще не добавил друзей
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
            {friends.map(friend => (
              <Link
                key={friend.id}
                href={`/profile/${friend.friend_profile?.id}`}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow block"
              >
                <div className="flex items-center space-x-3">
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
                  <div>
                    <p className="font-bold text-gray-900">
                      {friend.friend_profile?.full_name}
                    </p>
                    <p className="text-gray-600 text-sm">
                      @{friend.friend_profile?.username}
                    </p>
                    {friend.friend_profile?.bio && (
                      <p className="text-gray-500 text-xs mt-1 line-clamp-2">
                        {friend.friend_profile.bio}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}