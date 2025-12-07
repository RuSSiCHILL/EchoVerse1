import { supabase } from '@/lib/supabase';
import HomeClient from './HomeClient';

export default async function HomePage() {
  try {
    // 1. Загружаем посты
    const { data: posts, error: postsError } = await supabase
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
      .order('created_at', { ascending: false })
      .limit(10);

    if (postsError) {
      console.error('Ошибка загрузки постов:', postsError);
      return <HomeClient initialPosts={[]} initialHashtags={[]} error="Ошибка загрузки данных" />;
    }

    // 2. Загружаем популярные хештеги
    const { data: hashtags } = await supabase
      .from('hashtags')
      .select(`
        *,
        post_hashtags(count)
      `)
      .order('name')
      .limit(10);

    const hashtagsWithCount = hashtags?.map(tag => ({
      ...tag,
      post_count: tag.post_hashtags[0]?.count || 0
    })) || [];

    // 3. Если постов нет
    if (!posts || posts.length === 0) {
      return <HomeClient initialPosts={[]} initialHashtags={hashtagsWithCount} />;
    }

    return <HomeClient initialPosts={posts} initialHashtags={hashtagsWithCount} />;

  } catch (error) {
    console.error('Критическая ошибка:', error);
    return <HomeClient initialPosts={[]} initialHashtags={[]} error="Системная ошибка" />;
  }
}