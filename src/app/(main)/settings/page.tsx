'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Save, Upload, User, Mail, MapPin, Globe } from 'lucide-react';

export default function SettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(profileData);
    setAvatarPreview(profileData?.avatar_url || '');
    setIsLoading(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setIsSaving(true);
    try {
      let avatarUrl = profile.avatar_url;

      // Загружаем новый аватар если есть
      if (avatarFile) {
        const fileName = `avatars/${profile.id}/${Date.now()}-${avatarFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(fileName, avatarFile, {
            upsert: true
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('public')
            .getPublicUrl(fileName);
          
          avatarUrl = publicUrl;
        }
      }

      // Обновляем профиль
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          username: profile.username,
          bio: profile.bio,
          location: profile.location,
          website: profile.website,
          avatar_url: avatarUrl
        })
        .eq('id', profile.id);

      if (error) throw error;

      alert('Профиль успешно обновлен!');
      router.refresh();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить изменения');
    } finally {
      setIsSaving(false);
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
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">Настройки профиля</h1>

      <div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">
        {/* Аватар */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Аватар
          </h2>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <img
                src={avatarPreview || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
                alt="Аватар"
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
            </div>
            <div>
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  <Upload size={20} />
                  <span>Изменить фото</span>
                </div>
              </label>
              <p className="text-gray-500 text-sm mt-2">
                Рекомендуемый размер: 400×400 пикселей
              </p>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="mr-2" size={20} />
            Основная информация
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Полное имя</label>
              <input
                type="text"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Имя пользователя</label>
              <input
                type="text"
                value={profile.username || ''}
                onChange={(e) => setProfile({...profile, username: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg"
                placeholder="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profile.email || ''}
                disabled
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100"
                placeholder="your@email.com"
              />
              <p className="text-gray-500 text-sm mt-1">Email нельзя изменить</p>
            </div>
          </div>
        </div>

        {/* Дополнительная информация */}
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <MapPin className="mr-2" size={20} />
            Дополнительная информация
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">О себе</label>
              <textarea
                value={profile.bio || ''}
                onChange={(e) => setProfile({...profile, bio: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg h-32"
                placeholder="Расскажите о себе..."
                maxLength={500}
              />
              <p className="text-gray-500 text-sm mt-1">
                {profile.bio?.length || 0}/500 символов
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Город</label>
                <input
                  type="text"
                  value={profile.location || ''}
                  onChange={(e) => setProfile({...profile, location: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="Москва, Россия"
                />
              </div>
              <div>
                <label className="flex text-sm font-medium mb-2 items-center">
                  <Globe className="mr-2" size={16} />
                  Веб-сайт
                </label>
                <input
                  type="url"
                  value={profile.website || ''}
                  onChange={(e) => setProfile({...profile, website: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Кнопка сохранения */}
        <div className="pt-6 border-t">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            <Save size={20} />
            <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}