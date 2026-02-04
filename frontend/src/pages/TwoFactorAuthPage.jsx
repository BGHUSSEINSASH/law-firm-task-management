import React, { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { FiSmartphone, FiKey, FiRotateCw, FiCheckCircle } from 'react-icons/fi';
import API from '../api';
import toast from 'react-hot-toast';

export const TwoFactorAuthPage = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [twoFAStatus, setTwoFAStatus] = useState(null);
  const [setupStep, setSetupStep] = useState(null); // 'qr', 'verify', 'done'
  const [qrCode, setQrCode] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTwoFAStatus();
  }, []);

  const fetchTwoFAStatus = async () => {
    try {
      const response = await API.get('/api/2fa/status');
      setTwoFAStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    }
  };

  const handleSetup = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/2fa/setup');
      setQrCode(response.data.qrCode);
      setBackupCodes(response.data.backupCodes);
      setSetupStep('qr');
    } catch (error) {
      console.error('Setup error:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast.error('أدخل OTP مكون من 6 أرقام');
      return;
    }

    try {
      setLoading(true);
      await API.post('/api/2fa/verify-setup', { otp });
      setSetupStep('done');
      toast.success('تم تفعيل المصادقة الثنائية بنجاح');
      setTimeout(() => {
        fetchTwoFAStatus();
        setSetupStep(null);
      }, 2000);
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('خطأ في التحقق من الكود');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تعطيل المصادقة الثنائية؟')) {
      return;
    }

    try {
      setLoading(true);
      await API.post('/api/2fa/disable');
      setTwoFAStatus({ ...twoFAStatus, enabled: false });
      toast.success('تم تعطيل المصادقة الثنائية');
    } catch (error) {
      console.error('Disable error:', error);
      toast.error(t('messages.error'));
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', 'backup-codes.txt');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen overflow-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white">المصادقة الثنائية</h1>
        <p className="text-slate-400">حماية إضافية لحسابك</p>
      </div>

      {/* Status Card */}
      {twoFAStatus && (
        <div
          className={`rounded-xl p-6 border shadow-xl ${
            twoFAStatus.enabled
              ? 'bg-gradient-to-br from-green-900 to-green-800 border-green-500/50'
              : 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-700/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-lg ${twoFAStatus.enabled ? 'bg-green-600' : 'bg-slate-600'}`}>
                <FiSmartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {twoFAStatus.enabled ? '✅ مفعّلة' : '❌ معطّلة'}
                </h3>
                {twoFAStatus.enabled && (
                  <p className="text-sm text-green-300">
                    رموز احتياطية متبقية: {twoFAStatus.backupCodesRemaining}
                  </p>
                )}
              </div>
            </div>

            {!twoFAStatus.enabled && !setupStep && (
              <button
                onClick={handleSetup}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'جاري التحميل...' : 'تفعيل'}
              </button>
            )}

            {twoFAStatus.enabled && !setupStep && (
              <button
                onClick={handleDisable}
                disabled={loading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
              >
                {loading ? 'جاري...' : 'تعطيل'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Setup Flow */}
      {setupStep === 'qr' && (
        <div className="bg-gradient-to-br from-slate-800 to-slate-700/50 rounded-xl p-6 border border-slate-700/50 shadow-xl space-y-6">
          <h2 className="text-xl font-bold text-white">الخطوة 1: مسح الرمز</h2>

          <div className="bg-white p-4 rounded-lg w-64 mx-auto">
            {qrCode && <img src={qrCode} alt="QR Code" className="w-full" />}
          </div>

          <div className="space-y-3">
            <p className="text-slate-300">1. استخدم تطبيق المصادقة (Google Authenticator, Microsoft Authenticator, Authy)</p>
            <p className="text-slate-300">2. امسح رمز الاستجابة السريعة أعلاه</p>
            <p className="text-slate-300">3. أدخل الرمز المكون من 6 أرقام</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300 mb-2 block">رمز التحقق 6 أرقام</label>
            <input
              type="text"
              maxLength="6"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-indigo-500 transition"
              placeholder="000000"
            />
          </div>

          <button
            onClick={handleVerify}
            disabled={otp.length !== 6 || loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'جاري التحقق...' : 'تحقق من الرمز'}
          </button>
        </div>
      )}

      {setupStep === 'done' && (
        <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-6 border border-green-500/50 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <FiCheckCircle className="w-8 h-8 text-green-300" />
            <h2 className="text-2xl font-bold text-white">تم التفعيل بنجاح!</h2>
          </div>

          <p className="text-green-100">احفظ هذه الرموز الاحتياطية في مكان آمن. يمكنك استخدامها للوصول إلى حسابك إذا فقدت هاتفك.</p>

          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code key={i} className="text-sm font-mono text-green-300 p-2 bg-slate-800 rounded">
                  {code}
                </code>
              ))}
            </div>
          </div>

          <button
            onClick={downloadBackupCodes}
            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition"
          >
            💾 تحميل الرموز
          </button>
        </div>
      )}

      {/* Information */}
      <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-xl p-6 border border-indigo-500/30">
        <h3 className="font-semibold text-indigo-300 mb-3">💡 ماذا هي المصادقة الثنائية؟</h3>
        <ul className="space-y-2 text-sm text-indigo-100">
          <li>✓ طبقة أمان إضافية تتطلب رمز من هاتفك عند تسجيل الدخول</li>
          <li>✓ يمكنك استخدام تطبيقات مثل Google Authenticator أو Microsoft Authenticator</li>
          <li>✓ احفظ الرموز الاحتياطية للوصول في حالة الطوارئ</li>
          <li>✓ لا يتم حفظ بيانات هاتفك أو مشاركتها</li>
        </ul>
      </div>
    </div>
  );
};

export default TwoFactorAuthPage;
