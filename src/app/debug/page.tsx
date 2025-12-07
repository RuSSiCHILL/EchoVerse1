'use client';

export default function DebugPage() {
  const runSafeTests = () => {
    console.log('=== БЕЗОПАСНАЯ ДИАГНОСТИКА ===');
    
    // 1. Проверка только безопасных свойств
    console.log('📍 Текущий URL:', window.location.origin);
    console.log('🕒 Время загрузки:', new Date().toLocaleString());
    console.log('🌐 User Agent:', navigator.userAgent.substring(0, 50) + '...');
    
    // 2. Проверка доступности localStorage (безопасно)
    try {
      const testKey = 'echoverse_test_' + Date.now();
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      console.log('💾 localStorage: ДОСТУПЕН');
    } catch (e) {
      console.log('💾 localStorage: НЕДОСТУПЕН');
    }
    
    // 3. Проверка fetch (безопасно)
    fetch(window.location.origin + '/api/health')
      .then(res => console.log('🩺 Health check:', res.status))
      .catch(() => console.log('🩺 Health check: ОШИБКА'));
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Безопасная диагностика</h1>
      <button 
        onClick={runSafeTests}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Запустить безопасные тесты
      </button>
      <p className="mt-4 text-gray-600">
        Результаты появятся в консоли (F12 → Console)
      </p>
    </div>
  );
}