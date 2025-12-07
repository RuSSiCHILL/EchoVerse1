'use client';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
  const checkConfig = () => {
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    
    // Проверяем подключение
    supabase.from('profiles').select('count').then(console.log);
  };

  return (
    <button onClick={checkConfig}>
      Проверить конфигурацию
    </button>
  );
}