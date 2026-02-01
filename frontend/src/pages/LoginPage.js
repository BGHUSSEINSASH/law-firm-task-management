import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiArrowRight } from 'react-icons/fi';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@lawfirm.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('rememberedEmail');
      }
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/tasks');
    } catch (error) {
      console.error('Login failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'فشل تسجيل الدخول';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (credentials) => {
    setEmail(credentials.email);
    setPassword(credentials.password);
    setLoading(true);

    try {
      await login(credentials.email, credentials.password);
      toast.success('تم تسجيل الدخول بنجاح');
      navigate('/tasks');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const testAccounts = [
    { name: 'مدير النظام', email: 'admin@lawfirm.com', password: 'password123', role: 'admin', icon: '👔' },
    { name: 'محام', email: 'lawyer1@lawfirm.com', password: 'password123', role: 'lawyer', icon: '⚖️' },
    { name: 'رئيس قسم', email: 'head.contracts@lawfirm.com', password: 'password123', role: 'department_head', icon: '📋' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" dir="rtl">
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left Side - Brand */}
        <div className="hidden md:flex flex-col justify-center items-start text-white space-y-8">
          <div className="space-y-4">
            <div className="text-6xl font-black bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              نظام إدارة<br />المهام<br />القانونية
            </div>
            <p className="text-xl text-slate-400 max-w-lg">
              منصة متكاملة لإدارة المهام والعقود والمستندات القانونية مع نظام موافقات متقدم
            </p>
          </div>

          <div className="space-y-4 pt-8">
            <div className="flex items-start gap-4">
              <div className="text-2xl">✅</div>
              <div>
                <h3 className="font-bold text-lg">إدارة متقدمة للمهام</h3>
                <p className="text-slate-400 text-sm">تتبع شامل لجميع المهام والعقود</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl">🔒</div>
              <div>
                <h3 className="font-bold text-lg">نظام موافقات آمن</h3>
                <p className="text-slate-400 text-sm">موافقات متعددة المستويات للمهام</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl">📊</div>
              <div>
                <h3 className="font-bold text-lg">تقارير وإحصائيات</h3>
                <p className="text-slate-400 text-sm">لوحة تحكم شاملة مع إحصائيات فورية</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="text-2xl">👥</div>
              <div>
                <h3 className="font-bold text-lg">إدارة الفريق</h3>
                <p className="text-slate-400 text-sm">إدارة المحامين والأقسام والعملاء</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="space-y-6">
          {/* Login Card */}
          <div className="bg-gradient-to-br from-slate-800/80 to-slate-700/80 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/50 shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-block p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4">
                <FiLogIn className="text-4xl text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">تسجيل الدخول</h2>
              <p className="text-slate-400">أدخل بيانات دخولك للوصول إلى النظام</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">البريد الإلكتروني</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
                  <div className="relative flex items-center">
                    <FiMail className="absolute right-4 text-slate-400 text-xl" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pr-12 pl-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-200">كلمة المرور</label>
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition duration-300"></div>
                  <div className="relative flex items-center">
                    <FiLock className="absolute right-4 text-slate-400 text-xl" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pr-12 pl-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-4 text-slate-400 hover:text-slate-300 transition"
                    >
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border border-slate-600 cursor-pointer"
                />
                <label htmlFor="rememberMe" className="text-sm text-slate-400 cursor-pointer">
                  تذكرني في المرة القادمة
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl transition duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-purple-500/50"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    جاري التسجيل...
                  </>
                ) : (
                  <>
                    <FiLogIn size={20} />
                    تسجيل الدخول
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-800 text-slate-400">أو</span>
              </div>
            </div>

            {/* Quick Login */}
            <div className="space-y-3">
              <p className="text-xs text-slate-400 text-center font-semibold">دخول سريع - حسابات اختبارية</p>
              <div className="grid grid-cols-1 gap-2">
                {testAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleQuickLogin({ email: account.email, password: account.password })}
                    disabled={loading}
                    className="flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 border border-slate-600/50 rounded-lg transition group disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{account.icon}</span>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-white">{account.name}</p>
                        <p className="text-xs text-slate-400">{account.email}</p>
                      </div>
                    </div>
                    <FiArrowRight className="text-slate-400 group-hover:text-white transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center space-y-4">
            <p className="text-slate-400">
              <span>جديد في النظام؟ </span>
              <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                إنشاء حساب جديد
              </Link>
            </p>
            <p className="text-xs text-slate-500">
              © 2026 نظام إدارة المهام القانونية. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
