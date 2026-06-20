import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { urbanTreeApi } from '../api/urbanTreeApi';
import { 
  Button, 
  Input, 
  Label, 
  Card, 
  CardHeader, 
  MessageBar, 
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { MailRegular, LockClosedRegular } from '@fluentui/react-icons';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [otpSentMsg, setOtpSentMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, loginAsAdmin } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Attempt automatic bypass/admin login on mount
    const tryAutoLogin = async () => {
      setLoading(true);
      setError('');
      try {
        await loginAsAdmin();
        navigate('/');
      } catch (err: any) {
        console.warn('Auto-login as Administrator failed', err);
      } finally {
        setLoading(false);
      }
    };
    tryAutoLogin();
  }, [loginAsAdmin, navigate]);

  const handleQuickLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginAsAdmin();
      navigate('/');
    } catch (err: any) {
      setError('Bypass / Đăng nhập nhanh không thành công. Hãy chắc chắn rằng backend đang chạy.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const res = await urbanTreeApi.sendOtp(email);
      setStep(2);
      // In development mode, display OTP for easy testing
      if (res.otp) {
        setOtpSentMsg(`OTP sent! Developer Mode: Use OTP ${res.otp}`);
      } else {
        setOtpSentMsg('OTP has been sent to your email.');
      }
    } catch (err: any) {
      setError(err.response?.data?.exception || 'Failed to send OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setError('');
    try {
      await login(email, otp);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.exception || 'Invalid OTP or account pending approval.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-tr from-emerald-800 via-teal-900 to-cyan-950 px-4">
      <Card className="w-full max-w-md border-0 bg-white/95 shadow-2xl backdrop-blur-md">
        <CardHeader
          header={
            <div className="text-center py-4">
              <h1 className="text-3xl font-extrabold text-teal-800 tracking-tight m-0">Urban Tree Management</h1>
              <p className="text-sm text-gray-500 mt-2">Hệ thống Quản lý Cây xanh Đô thị</p>
            </div>
          }
        />
        
        <div className="p-6">
          {error && (
            <MessageBar intent="error" className="mb-4">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}

          {otpSentMsg && (
            <MessageBar intent="success" className="mb-4">
              <MessageBarBody>{otpSentMsg}</MessageBarBody>
            </MessageBar>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="email" className="font-semibold text-gray-700">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@greencity.local"
                  contentBefore={<MailRegular />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="large"
                />
              </div>

              <Button 
                type="submit" 
                appearance="primary" 
                size="large" 
                disabled={loading}
                className="bg-teal-600 hover:bg-teal-700 text-white mt-2"
              >
                {loading ? <Spinner size="tiny" label="Sending OTP..." /> : 'Send OTP Login'}
              </Button>

              <div className="flex items-center my-4">
                <hr className="flex-1 border-gray-300" />
                <span className="px-3 text-xs text-gray-500 uppercase">Hoặc</span>
                <hr className="flex-1 border-gray-300" />
              </div>

              <Button 
                type="button"
                appearance="outline" 
                size="large" 
                disabled={loading}
                onClick={handleQuickLogin}
                className="border-teal-600 text-teal-700 hover:bg-teal-50"
              >
                {loading ? <Spinner size="tiny" label="Đang đăng nhập..." /> : 'Bỏ qua & Đăng nhập nhanh'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <Label htmlFor="otp" className="font-semibold text-gray-700">Enter 6-digit OTP</Label>
                <Input
                  id="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  contentBefore={<LockClosedRegular />}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  size="large"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <Button 
                  appearance="secondary" 
                  size="large" 
                  onClick={() => setStep(1)}
                  disabled={loading}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  appearance="primary" 
                  size="large" 
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
                >
                  {loading ? <Spinner size="tiny" label="Verifying..." /> : 'Verify & Login'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
};
