import { useState } from 'react';
import { PawPrint, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api.js';

export default function Login() {
  const auth = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const validateForm = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) errs.email = 'Informe o email';
    else if (!emailRegex.test(form.email)) errs.email = 'Email inválido';
    if (!form.password) errs.password = 'Informe a senha';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (mode === 'register' && !form.name.trim()) errs.name = 'Informe seu nome';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (mode === 'register') {
        await auth.register(form.name, form.email, form.password);
      } else {
        await auth.login(form.email, form.password);
      }
    } catch (err) {
      if (err instanceof ApiError && err.fields) {
        setErrors(err.fields);
      } else if (err instanceof ApiError) {
        setErrors({ email: err.message });
      } else {
        setErrors({ email: 'Erro de conexão. Tente novamente.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-surface rounded-xl border border-gray-200 pl-11 pr-4 py-3.5 text-sm text-text-primary placeholder:text-gray-400 focus:outline-none';

  return (
    <div className="min-h-screen bg-surface flex flex-col relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-64 h-64 rounded-full bg-primary/5 -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute bottom-0 right-0 w-48 h-48 rounded-full bg-accent/5 translate-y-1/3 translate-x-1/3" />

      <div className="flex-1 flex flex-col px-8 relative z-10">
        {/* Header */}
        <div className="pt-16 pb-8 animate-fade-in-up">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <PawPrint size={24} className="text-white" />
            </div>
            <span className="font-display text-3xl text-primary">PetLife</span>
          </div>
          <h1 className="font-display text-2xl text-text-primary">
            {mode === 'login' ? 'Bem-vindo(a)\nde volta!' : 'Crie sua\nconta'}
          </h1>
          <p className="text-text-secondary text-sm mt-2">
            {mode === 'login'
              ? 'Entre para acessar o perfil do seu pet'
              : 'Comece a cuidar do seu pet com o PetLife'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          {mode === 'register' && (
            <div>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                  <PawPrint size={16} />
                </div>
                <input
                  className={`${inputClass} ${errors.name ? 'border-danger ring-2 ring-danger/20' : ''}`}
                  placeholder="Seu nome"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  autoComplete="name"
                />
              </div>
              {errors.name && <p className="text-xs text-danger mt-1 pl-1">{errors.name}</p>}
            </div>
          )}

          <div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <Mail size={16} />
              </div>
              <input
                type="email"
                className={`${inputClass} ${errors.email ? 'border-danger ring-2 ring-danger/20' : ''}`}
                placeholder="Email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>
            {errors.email && <p className="text-xs text-danger mt-1 pl-1">{errors.email}</p>}
          </div>

          <div>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className={`${inputClass} pr-11 ${errors.password ? 'border-danger ring-2 ring-danger/20' : ''}`}
                placeholder="Senha (mínimo 6 caracteres)"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-danger mt-1 pl-1">{errors.password}</p>}
          </div>

          {mode === 'login' && (
            <div className="text-right">
              <button
                type="button"
                onClick={() => alert('Um link de recuperação seria enviado para o email informado. (Funcionalidade disponível com backend)')}
                className="text-xs font-semibold text-primary hover:text-primary-light"
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 mt-4 ${
              loading ? 'opacity-70 cursor-wait' : ''
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-text-secondary font-medium">ou continue com</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Social login */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
          <button
            type="button"
            onClick={() => { setErrors({ email: 'Login social estará disponível em breve.' }); }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-surface-alt text-sm font-medium text-text-primary hover:border-gray-300 active:scale-[0.97] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={() => { setErrors({ email: 'Login social estará disponível em breve.' }); }}
            className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 bg-surface-alt text-sm font-medium text-text-primary hover:border-gray-300 active:scale-[0.97] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Apple
          </button>
        </div>

        {/* Toggle mode */}
        <div className="text-center mt-8 mb-8 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <p className="text-sm text-text-secondary">
            {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
            <button
              type="button"
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-primary hover:text-primary-light"
            >
              {mode === 'login' ? 'Cadastre-se' : 'Faça login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
