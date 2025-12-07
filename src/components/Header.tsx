'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, User, Home, Users, MessageSquare, Bell } from 'lucide-react';
import Link from 'next/link';
import { Search } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkUser();
    
    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      () => checkUser()
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (user) {
      // Загружаем профиль пользователя
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setProfile(profile);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Если мы на странице логина/регистрации, не показываем хедер
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Логотип и навигация */}
          <div className="flex items-center space-x-8">
            {/* Логотип */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#2787F5] rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">EV</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden md:inline">EchoVerse</span>
            </Link>

            {/* Навигация для авторизованных */}
            {user && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${pathname === '/' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Home size={20} />
                  <span>Главная</span>
                </Link>
                
                <Link 
                  href="/friends" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${pathname === '/friends' ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Users size={20} />
                  <span>Друзья</span>
                </Link>
                
                <Link 
                  href="/messages" 
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${pathname.includes('/messages') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <MessageSquare size={20} />
                  <span>Сообщения</span>
                </Link>
              </nav>
            )}
          </div>

          {user && (
            <div className="flex-1 max-w-md mx-6 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <Link href="/search">
                  <input
                    type="text"
                    placeholder="Поиск людей, постов..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    readOnly
                  />
                </Link>
              </div>
            </div>
          )}

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {/* Уведомления */}
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg relative">
                  <Bell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    3
                  </span>
                </button>
                <Link 
                  href="/test"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  title="Тест"
                >
                 🧪
                </Link>

                {/* Аватар и меню */}
                <div className="flex items-center space-x-3">
                  <Link href={`/profile/${profile?.id}`}>
                    <div className="flex items-center space-x-2 hover:bg-gray-100 p-2 rounded-lg cursor-pointer">
                      <img
                        src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username || 'user'}`}
                        alt={profile?.full_name}
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                      />
                      <div className="hidden md:block">
                        <p className="text-sm font-medium text-gray-900">
                          {profile?.full_name?.split(' ')[0] || 'Пользователь'}
                        </p>
                        <p className="text-xs text-gray-500">@{profile?.username}</p>
                      </div>
                    </div>
                  </Link>

                  {/* Кнопка выхода */}
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg"
                    title="Выйти"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}