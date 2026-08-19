import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';
import AuthCard from '@/components/AuthCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';

const PASSWORD_HINT = 'Mínimo 8 caracteres, con mayúscula, minúscula y número.';

const registerSchema = z.object({
  email: z.string().email('Introduce un email válido'),
  password: z.string().min(8, PASSWORD_HINT),
});
type RegisterValues = z.infer<typeof registerSchema>;

const confirmSchema = z.object({
  code: z.string().min(1, 'Introduce el código de verificación'),
});
type ConfirmValues = z.infer<typeof confirmSchema>;

export default function RegisterPage() {
  const { register: registerUser, confirmRegistration } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'register' | 'confirm'>('register');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const registerForm = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });
  const confirmForm = useForm<ConfirmValues>({ resolver: zodResolver(confirmSchema) });

  const handleRegister = async (values: RegisterValues) => {
    setError(null);
    try {
      await registerUser(values.email, values.password);
      setEmail(values.email);
      setStep('confirm');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirm = async (values: ConfirmValues) => {
    setError(null);
    try {
      await confirmRegistration(email, values.code);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (step === 'confirm') {
    return (
      <AuthCard title="Verifica tu cuenta" description={`Introduce el código que hemos enviado a ${email}`}>
        <form onSubmit={confirmForm.handleSubmit(handleConfirm)}>
          <input
            type="text"
            autoComplete="username"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          />
          <FieldGroup>
            <Field data-invalid={!!confirmForm.formState.errors.code}>
              <FieldLabel htmlFor="code">Código de verificación</FieldLabel>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                {...confirmForm.register('code')}
              />
              <FieldError
                errors={confirmForm.formState.errors.code ? [confirmForm.formState.errors.code] : undefined}
              />
            </Field>
            <Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={confirmForm.formState.isSubmitting}>
                {confirmForm.formState.isSubmitting ? 'Verificando...' : 'Verificar y entrar'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Crear cuenta" description="Introduce tus datos para crear una cuenta nueva">
      <form onSubmit={registerForm.handleSubmit(handleRegister)}>
        <FieldGroup>
          <Field data-invalid={!!registerForm.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" {...registerForm.register('email')} />
            <FieldError
              errors={registerForm.formState.errors.email ? [registerForm.formState.errors.email] : undefined}
            />
          </Field>
          <Field data-invalid={!!registerForm.formState.errors.password}>
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <Input id="password" type="password" {...registerForm.register('password')} />
            <FieldDescription>{PASSWORD_HINT}</FieldDescription>
            <FieldError
              errors={registerForm.formState.errors.password ? [registerForm.formState.errors.password] : undefined}
            />
          </Field>
          <Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={registerForm.formState.isSubmitting}>
              {registerForm.formState.isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
            <FieldDescription className="text-center">
              ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
