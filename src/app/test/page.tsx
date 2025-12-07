'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestCreatePage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [time, setTime] = useState<number>(0);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testCreatePost = async () => {
    addLog('Начинаем тест создания поста...');
    
    try {
      // 1. Проверяем пользователя
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        addLog(`❌ Ошибка пользователя: ${userError?.message || 'Нет пользователя'}`);
        return;
      }
      
      addLog(`✅ Пользователь: ${user.email} (${user.id})`);

      // 2. Создаем пост с замером времени
      addLog('Создаем пост...');
      const startTime = Date.now();
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          title: `Тест ${Date.now()}`,
          content: 'Тестовое содержимое поста',
          created_at: new Date().toISOString()
        })
        .select('id, title, created_at');

      const duration = Date.now() - startTime;
      setTime(duration);
      
      if (error) {
        addLog(`❌ Ошибка создания: ${error.code} - ${error.message}`);
        addLog(`Подробности: ${JSON.stringify(error.details)}`);
      } else {
        addLog(`✅ Пост создан за ${duration}ms`);
        addLog(`ID поста: ${data?.[0]?.id}`);
        addLog(`Заголовок: ${data?.[0]?.title}`);
      }

      // 3. Проверяем RLS
      addLog('Проверяем RLS статус...');
      const { data: rlsCheck } = await supabase
        .from('posts')
        .select('count')
        .limit(1);

      addLog(rlsCheck ? '✅ RLS: Доступ есть' : '⚠️ RLS: Возможны ограничения');

    } catch (error: any) {
      addLog(`💥 Исключение: ${error.message}`);
      console.error('Полная ошибка:', error);
    }
  };

  const testSimpleInsert = async () => {
    addLog('Тест простой вставки...');
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const start = Date.now();
    
    try {
      // Используем rpc для обхода RLS если есть
      const { data, error } = await supabase.rpc('create_test_post', {
        p_user_id: user.id,
        p_title: 'Тест через RPC',
        p_content: 'Содержимое'
      });

      const duration = Date.now() - start;
      addLog(error 
        ? `❌ RPC ошибка: ${error.message}` 
        : `✅ RPC успех за ${duration}ms`
      );
    } catch (e: any) {
      addLog(`💥 RPC исключение: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Тест создания поста</h1>
      
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-blue-800">
          <strong>Время последнего запроса:</strong> {time}ms
        </p>
        <p className="text-blue-800 mt-2">
          {time > 1000 ? '⚠️ ОЧЕНЬ МЕДЛЕННО' : time > 500 ? '⚠️ Медленно' : '✅ Нормально'}
        </p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={testCreatePost}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Тест создания поста
        </button>
        
        <button
          onClick={testSimpleInsert}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
        >
          Тест RPC
        </button>
        
        <button
          onClick={() => setLogs([])}
          className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
        >
          Очистить логи
        </button>
      </div>

      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm">
        <div className="mb-2 font-bold">Логи:</div>
        <div className="h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-400">Нажмите кнопку для теста</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className="mb-1">
                {log.includes('✅') && <span className="text-green-400">{log}</span>}
                {log.includes('❌') && <span className="text-red-400">{log}</span>}
                {log.includes('💥') && <span className="text-yellow-400">{log}</span>}
                {log.includes('⚠️') && <span className="text-yellow-300">{log}</span>}
                {!log.includes('✅') && !log.includes('❌') && !log.includes('💥') && !log.includes('⚠️') && <span>{log}</span>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-bold mb-2">Что проверить в Supabase:</h3>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Таблица <code>posts</code> - RLS включен?</li>
          <li>Политики INSERT для таблицы <code>posts</code></li>
          <li>Триггеры на таблице (могут замедлять)</li>
          <li>Количество записей в таблице</li>
        </ol>
      </div>
    </div>
  );
}