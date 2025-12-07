import { supabase } from '@/lib/supabase';
import HomeClient from './HomeClient';

export default async function HomePage() {
  try {
    // 1. Простой запрос без JOIN (самый быстрый)
    const { data: posts, error } = await supabase
      .from('posts')
      .select('id, title, content, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('Ошибка загрузки постов:', error);
      return <HomeClient initialPosts={[]} error="Ошибка загрузки данных" />;
    }

    // 2. Если постов нет
    if (!posts || posts.length === 0) {
      return <HomeClient initialPosts={[]} />;
    }

    // 3. Добавляем заглушки для профилей (не грузим отдельно)
    const postsWithStubs = posts.map(post => ({
      ...post,
      profiles: {
        username: 'user',
        full_name: 'Автор',
        avatar_url: null
      }
    }));

    return <HomeClient initialPosts={postsWithStubs} />;

  } catch (error) {
    console.error('Критическая ошибка:', error);
    return <HomeClient initialPosts={[]} error="Системная ошибка" />;
  }
}