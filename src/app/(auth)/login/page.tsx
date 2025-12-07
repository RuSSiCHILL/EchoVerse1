import AuthForm from '@/components/AuthForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">ВКонтакте-like Блог</h1>
          <p className="text-gray-600 mt-2">Добро пожаловать обратно!</p>
        </div>
        <AuthForm type="login" />
      </div>
    </div>
  );
}