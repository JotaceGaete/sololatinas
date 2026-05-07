'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AppImage from '@/components/ui/AppImage';
import AppLogo from '@/components/ui/AppLogo';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, BookOpen, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type AuthTab = 'login' | 'register';

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  birthYear: string;
  ageConfirm: boolean;
  termsAccepted: boolean;
}

// Age gate state
type AgeGateState = 'pending' | 'confirmed' | 'denied';

const demoCredentials = [
{ role: 'Lectora', email: 'valentina@sololatinas.com', password: 'Jazmín2026!' },
{ role: 'Autora', email: 'isabella@sololatinas.com', password: 'Mezcal2026!' },
{ role: 'Admin', email: 'admin@sololatinas.com', password: 'Admin2026#' }];


export default function AuthClient() {
  const [tab, setTab] = useState<AuthTab>('login');
  const [ageGate, setAgeGate] = useState<AgeGateState>('pending');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const loginForm = useForm<LoginForm>({ defaultValues: { email: '', password: '', remember: false } });
  const registerForm = useForm<RegisterForm>();

  const handleCopy = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('No se pudo copiar al portapapeles');
    }
  };

  const fillCredentials = (cred: typeof demoCredentials[0]) => {
    loginForm.setValue('email', cred.email);
    loginForm.setValue('password', cred.password);
    setTab('login');
    toast.success(`Credenciales de ${cred.role} cargadas`);
  };

  const onLoginSubmit = async (data: LoginForm) => {
    const isValid = demoCredentials.some(
      (c) => c.email === data.email && c.password === data.password
    );

    if (!isValid) {
      loginForm.setError('root', {
        message: 'Credenciales inválidas — usa las cuentas demo de abajo para iniciar sesión'
      });
      return;
    }

    setIsLoading(true);
    // BACKEND INTEGRATION: POST /api/auth/login with { email, password }
    await new Promise((r) => setTimeout(r, 1400));
    setIsLoading(false);
    toast.success('¡Bienvenida de vuelta! 🌹');
  };

  const onRegisterSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      registerForm.setError('confirmPassword', { message: 'Las contraseñas no coinciden' });
      return;
    }
    setIsLoading(true);
    // BACKEND INTEGRATION: POST /api/auth/register with user data + age verification
    await new Promise((r) => setTimeout(r, 1600));
    setIsLoading(false);
    toast.success('¡Cuenta creada! Revisa tu email para confirmar. 💛');
  };

  // Age Gate Screen
  if (ageGate === 'pending') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 opacity-30">
            <AppImage
              src="https://img.rocket.new/generatedImages/rocket_gen_img_110572a66-1772199851144.png"
              alt="Fondo artístico romántico con iluminación cálida"
              fill
              className="object-cover blur-sm" />
            
          </div>
          <div className="absolute inset-0 bg-noir/85" />
        </div>

        <div className="relative z-10 max-w-md w-full">
          <div className="bg-surface-elevated border border-primary/20 rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <AppLogo size={36} />
              <span className="font-display text-xl font-semibold text-gradient-gold">SoloLatinas</span>
            </div>

            <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-5">
              <span className="font-display text-2xl font-bold text-primary">18+</span>
            </div>

            <h2 className="font-display text-2xl font-bold text-foreground mb-3">
              Verificación de Edad
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              SoloLatinas contiene contenido literario para adultos. Al continuar, confirmas que tienes 18 años o más y que estás de acuerdo con nuestros{' '}
              <a href="#" className="text-primary hover:underline">Términos de Uso</a>.
            </p>

            <button
              onClick={() => setAgeGate('confirmed')}
              className="btn-primary w-full justify-center mb-3 py-3">
              
              Tengo 18 años o más — Continuar
            </button>
            <button
              onClick={() => setAgeGate('denied')}
              className="btn-ghost w-full justify-center text-sm text-muted-foreground">
              
              Soy menor de 18 años
            </button>
          </div>
        </div>
      </div>);

  }

  if (ageGate === 'denied') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-surface-elevated border border-border rounded-2xl p-8">
            <AlertCircle size={40} className="text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Acceso no disponible
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lo sentimos. SoloLatinas es una plataforma exclusiva para mayores de 18 años.
            </p>
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Panel — Artistic Brand */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden">
        <AppImage
          src="https://img.rocket.new/generatedImages/rocket_gen_img_1fda035c8-1763296347013.png"
          alt="Mujer latina en escena artística romántica, iluminación dorada y cálida, atmósfera literaria y sensual"
          fill
          priority
          className="object-cover" />
        
        <div className="absolute inset-0 bg-gradient-to-r from-noir/60 to-noir/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-noir/80 via-transparent to-transparent" />

        <div className="relative z-10 p-10 flex flex-col justify-between h-full">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={32} />
            <span className="font-display text-xl font-semibold text-gradient-gold">SoloLatinas</span>
          </Link>

          <div className="max-w-md">
            <blockquote className="font-display text-2xl lg:text-3xl italic text-cream leading-relaxed mb-4 hero-text-shadow">
              "Las mejores historias son las que hacen que el corazón olvide que está solo."
            </blockquote>
            <p className="text-sm text-cream/60">— Valentina Ríos, autora destacada</p>
          </div>
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-12 xl:px-16 py-10 overflow-y-auto">
        {/* Mobile Logo */}
        <div className="flex lg:hidden items-center gap-2 mb-8">
          <AppLogo size={28} />
          <span className="font-display text-lg font-semibold text-gradient-gold">SoloLatinas</span>
        </div>

        <div className="max-w-sm w-full mx-auto">
          {/* Tabs */}
          <div className="flex bg-muted rounded-lg p-1 mb-8">
            <button
              onClick={() => setTab('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === 'login' ? 'bg-surface-elevated text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
              }>
              
              Iniciar Sesión
            </button>
            <button
              onClick={() => setTab('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              tab === 'register' ? 'bg-surface-elevated text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`
              }>
              
              Crear Cuenta
            </button>
          </div>

          {/* LOGIN FORM */}
          {tab === 'login' &&
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  Bienvenida de vuelta
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tu próxima historia favorita te está esperando.
                </p>
              </div>

              {/* Root error */}
              {loginForm.formState.errors.root &&
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{loginForm.formState.errors.root.message}</p>
                </div>
            }

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Correo electrónico
                </label>
                <input
                type="email"
                placeholder="tu@email.com"
                className="input-field"
                {...loginForm.register('email', {
                  required: 'El correo es obligatorio',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' }
                })} />
              
                {loginForm.formState.errors.email &&
              <p className="text-xs text-red-400 mt-1">{loginForm.formState.errors.email.message}</p>
              }
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  className="input-field pr-10"
                  {...loginForm.register('password', { required: 'La contraseña es obligatoria' })} />
                
                  <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {loginForm.formState.errors.password &&
              <p className="text-xs text-red-400 mt-1">{loginForm.formState.errors.password.message}</p>
              }
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                  type="checkbox"
                  className="w-3.5 h-3.5 accent-primary rounded"
                  {...loginForm.register('remember')} />
                
                  <span className="text-xs text-muted-foreground">Recordarme</span>
                </label>
                <a href="#" className="text-xs text-primary hover:text-gold-light transition-colors">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed">
              
                {isLoading ?
              <>
                    <Loader2 size={16} className="animate-spin" />
                    Iniciando sesión...
                  </> :

              <>
                    <BookOpen size={16} />
                    Iniciar Sesión
                  </>
              }
              </button>

              {/* Divider */}
              <div className="relative flex items-center gap-3 my-2">
                <div className="flex-1 gold-divider" />
                <span className="text-xs text-muted-foreground">o continúa con</span>
                <div className="flex-1 gold-divider" />
              </div>

              {/* Google Auth */}
              <button
              type="button"
              className="btn-outline w-full justify-center py-3 gap-3"
              onClick={() => toast.info('Google OAuth — integración pendiente')}>
              
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </button>
            </form>
          }

          {/* REGISTER FORM */}
          {tab === 'register' &&
          <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                  Únete a la comunidad
                </h2>
                <p className="text-sm text-muted-foreground">
                  Miles de lectoras ya están disfrutando los relatos.
                </p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Nombre o pseudónimo
                </label>
                <input
                type="text"
                placeholder="¿Cómo te llamamos?"
                className="input-field"
                {...registerForm.register('name', {
                  required: 'El nombre es obligatorio',
                  minLength: { value: 2, message: 'Mínimo 2 caracteres' }
                })} />
              
                {registerForm.formState.errors.name &&
              <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.name.message}</p>
              }
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Correo electrónico
                </label>
                <input
                type="email"
                placeholder="tu@email.com"
                className="input-field"
                {...registerForm.register('email', {
                  required: 'El correo es obligatorio',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Correo inválido' }
                })} />
              
                {registerForm.formState.errors.email &&
              <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.email.message}</p>
              }
              </div>

              {/* Birth Year */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Año de nacimiento
                  <span className="ml-1 text-muted-foreground/60">(verificación de edad)</span>
                </label>
                <input
                type="number"
                placeholder="1990"
                className="input-field"
                {...registerForm.register('birthYear', {
                  required: 'El año de nacimiento es obligatorio',
                  validate: (v) => {
                    const year = parseInt(v);
                    const currentYear = 2026;
                    if (currentYear - year < 18) return 'Debes tener al menos 18 años';
                    if (currentYear - year > 120) return 'Año inválido';
                    return true;
                  }
                })} />
              
                {registerForm.formState.errors.birthYear &&
              <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.birthYear.message}</p>
              }
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Contraseña
                </label>
                <p className="text-xs text-muted-foreground/70 mb-1.5">Mínimo 8 caracteres, una mayúscula y un número</p>
                <div className="relative">
                  <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crea una contraseña segura"
                  className="input-field pr-10"
                  {...registerForm.register('password', {
                    required: 'La contraseña es obligatoria',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d).+$/,
                      message: 'Debe incluir una mayúscula y un número'
                    }
                  })} />
                
                  <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Ocultar' : 'Mostrar'}>
                  
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {registerForm.formState.errors.password &&
              <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.password.message}</p>
              }
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  className="input-field pr-10"
                  {...registerForm.register('confirmPassword', { required: 'Confirma tu contraseña' })} />
                
                  <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}>
                  
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {registerForm.formState.errors.confirmPassword &&
              <p className="text-xs text-red-400 mt-1">{registerForm.formState.errors.confirmPassword.message}</p>
              }
              </div>

              {/* Age Confirm */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-primary mt-0.5 flex-shrink-0"
                {...registerForm.register('ageConfirm', { required: 'Debes confirmar tu edad' })} />
              
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Confirmo que tengo 18 años o más y acepto el acceso a contenido para adultos
                </span>
              </label>
              {registerForm.formState.errors.ageConfirm &&
            <p className="text-xs text-red-400 -mt-2">{registerForm.formState.errors.ageConfirm.message}</p>
            }

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                type="checkbox"
                className="w-3.5 h-3.5 accent-primary mt-0.5 flex-shrink-0"
                {...registerForm.register('termsAccepted', { required: 'Debes aceptar los términos' })} />
              
                <span className="text-xs text-muted-foreground leading-relaxed">
                  Acepto los{' '}
                  <a href="#" className="text-primary hover:underline">Términos de Uso</a>
                  {' '}y la{' '}
                  <a href="#" className="text-primary hover:underline">Política de Privacidad</a>
                </span>
              </label>
              {registerForm.formState.errors.termsAccepted &&
            <p className="text-xs text-red-400 -mt-2">{registerForm.formState.errors.termsAccepted.message}</p>
            }

              <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 disabled:opacity-60 disabled:cursor-not-allowed">
              
                {isLoading ?
              <>
                    <Loader2 size={16} className="animate-spin" />
                    Creando cuenta...
                  </> :

              <>
                    <BookOpen size={16} />
                    Crear Cuenta Gratis
                  </>
              }
              </button>
            </form>
          }

          {/* Demo Credentials Box */}
          <div className="mt-8 p-4 bg-surface border border-primary/20 rounded-xl">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              Cuentas Demo
            </p>
            <div className="space-y-2">
              {demoCredentials.map((cred) =>
              <div
                key={`demo-cred-${cred.role}`}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-elevated border border-border hover:border-primary/30 transition-all">
                
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-primary">{cred.role}</p>
                    <p className="text-xs text-muted-foreground truncate">{cred.email}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                    type="button"
                    onClick={() => handleCopy(cred.email, `email-${cred.role}`)}
                    className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                    aria-label={`Copiar email de ${cred.role}`}>
                    
                      {copiedField === `email-${cred.role}` ?
                    <Check size={12} className="text-primary" /> :

                    <Copy size={12} />
                    }
                    </button>
                    <button
                    type="button"
                    onClick={() => fillCredentials(cred)}
                    className="px-2 py-1 text-xs bg-primary/15 text-primary rounded hover:bg-primary/25 transition-all font-medium">
                    
                      Usar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            {tab === 'login' ?
            <>
                ¿No tienes cuenta?{' '}
                <button onClick={() => setTab('register')} className="text-primary hover:underline font-medium">
                  Regístrate gratis
                </button>
              </> :

            <>
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setTab('login')} className="text-primary hover:underline font-medium">
                  Inicia sesión
                </button>
              </>
            }
          </p>
        </div>
      </div>
    </div>);

}