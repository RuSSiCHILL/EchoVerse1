import AuthForm from '@/components/AuthForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Создать аккаунт</h1>
          <p className="text-gray-600 mt-2">Присоединяйтесь к нашему сообществу</p>
        </div>
        <AuthForm type="register" />
      </div>
    </div>
  );
}