import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User } from '../types';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (user: User, token: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/login', { email, password });
      onLogin(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setError('');
    setLoading(true);
    try {
      const response = await axios.post('/api/google', {
        credential: credentialResponse.credential,
        isMock: false
      });
      onLogin(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleMockLogin = async () => {
    setError('');
    setLoading(true);
    try {
      let mockId = localStorage.getItem('mock_student_id');
      if (!mockId) {
        mockId = Math.random().toString(36).substring(2, 7);
        localStorage.setItem('mock_student_id', mockId);
      }
      const response = await axios.post('/api/google', {
        isMock: true,
        email: `google.mock.student.${mockId}@campusvoice.com`,
        name: `Google Mock Student (${mockId.toUpperCase()})`
      });
      onLogin(response.data.user, response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google Mock Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden">
      {/* Left Side: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white z-10">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-96"
        >
          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-200">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-neutral-900 tracking-tight">Campus Voice</span>
            </div>
            <h2 className="text-3xl font-extrabold text-neutral-900 tracking-tight">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Sign in to manage your campus concerns securely.
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="text-red-500 w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </motion.div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 border border-neutral-200 rounded-2xl leading-5 bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white sm:text-sm transition-all"
                    placeholder="you@college.edu"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-neutral-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-12 py-3 border border-neutral-200 rounded-2xl leading-5 bg-neutral-50 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white sm:text-sm transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-neutral-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-600">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" title="Reset your password" id="forgot-password-link" className="font-medium text-emerald-600 hover:text-emerald-500">
                    Forgot password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-2xl shadow-sm text-sm font-bold text-white bg-neutral-900 hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing in...' : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-neutral-500">Or continue with</span>
              </div>
            </div>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleMockLogin}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-neutral-200 rounded-2xl shadow-sm text-sm font-bold text-neutral-700 bg-white hover:bg-neutral-50 transition-all hover:border-neutral-300"
              >
                <svg className="w-5 h-5 mr-1" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69a5.74 5.74 0 0 1-2.49 3.77v3.12h4.02c2.34-2.16 3.68-5.32 3.68-8.74Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-4.02-3.12c-1.12.75-2.54 1.19-3.94 1.19-3.03 0-5.6-2.05-6.52-4.82H1.31v3.2A12 12 0 0 0 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.48 14.34a7.22 7.22 0 0 1 0-4.68V6.46H1.31a12 12 0 0 0 0 11.08l4.17-3.2Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44A12 12 0 0 0 1.31 6.46l4.17 3.2c.92-2.77 3.49-4.91 6.52-4.91Z"
                  />
                </svg>
                Continue with Google (Instant Login)
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-neutral-100">
              <p className="text-center text-sm text-neutral-500">
                New student?{' '}
                <Link to="/register" className="font-bold text-emerald-600 hover:text-emerald-500">
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side: Visual/Branding */}
      <div className="hidden lg:block relative flex-1 bg-neutral-900">
        <div className="absolute inset-0">
          <img
            className="h-full w-full object-cover opacity-40 grayscale"
            src="https://images.unsplash.com/photo-1541339907198-e08756ebafe3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
            alt="Campus life"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-neutral-900/90 to-neutral-900" />
        </div>
        
        <div className="relative h-full flex flex-col justify-center px-16 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-6">
              <CheckCircle2 className="w-3 h-3" />
              Trusted by 50+ Institutions
            </div>
            <h1 className="text-5xl font-extrabold leading-tight tracking-tighter mb-6">
              Your voice matters.<br />
              <span className="text-emerald-400">Anonymously.</span>
            </h1>
            <p className="text-xl text-neutral-300 max-w-lg leading-relaxed mb-12">
              Campus Voice provides a secure bridge between students and administration, ensuring every concern is heard and addressed without compromise.
            </p>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-3xl font-bold mb-1">100%</p>
                <p className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Anonymous</p>
              </div>
              <div>
                <p className="text-3xl font-bold mb-1">24/7</p>
                <p className="text-sm text-neutral-400 font-medium uppercase tracking-wider">Monitoring</p>
              </div>
            </div>
          </motion.div>

          <div className="absolute bottom-12 left-16 right-16 flex justify-between items-center text-neutral-500 text-xs font-medium uppercase tracking-widest">
            <span>© 2026 Campus Voice</span>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
