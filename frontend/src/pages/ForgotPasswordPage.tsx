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

const requestSchema = z.object({
  email: z.string().email('Introduce un email válido'),
});
type RequestValues = z.infer<typeof requestSchema>;

const confirmSchema = z.object({
  code: z.string().min(1, 'Introduce el código de verificación'),
  newPassword: z.string().min(8, PASSWORD_HINT),
});
type ConfirmValues = z.infer<typeof confirmSchema>;

export default function ForgotPasswordPage() {
  const { forgotPassword, confirmForgotPassword } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const requestForm = useForm<RequestValues>({ resolver: zodResolver(requestSchema) });
  const confirmForm = useForm<ConfirmValues>({ resolver: zodResolver(confirmSchema) });

  const handleRequest = async (values: RequestValues) => {
    setError(null);
    try {
      await forgotPassword(values.email);
      setEmail(values.email);
      setStep('confirm');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleConfirm = async (values: ConfirmValues) => {
    setError(null);
    try {
      await confirmForgotPassword(email, values.code, values.newPassword);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (step === 'confirm') {
    return (
      <AuthCard title="Elige una contraseña nueva" description={`Introduce el código que hemos enviado a ${email}`}>
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
            <Field data-invalid={!!confirmForm.formState.errors.newPassword}>
              <FieldLabel htmlFor="newPassword">Contraseña nueva</FieldLabel>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...confirmForm.register('newPassword')}
              />
              <FieldDescription>{PASSWORD_HINT}</FieldDescription>
              <FieldError
                errors={
                  confirmForm.formState.errors.newPassword ? [confirmForm.formState.errors.newPassword] : undefined
                }
              />
            </Field>
            <Field>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={confirmForm.formState.isSubmitting}>
                {confirmForm.formState.isSubmitting ? 'Guardando...' : 'Guardar contraseña'}
              </Button>
            </Field>
          </FieldGroup>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Recuperar contraseña"
      description="Te enviaremos un código de verificación a tu email"
    >
      <form onSubmit={requestForm.handleSubmit(handleRequest)}>
        <FieldGroup>
          <Field data-invalid={!!requestForm.formState.errors.email}>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input id="email" type="email" placeholder="tu@email.com" {...requestForm.register('email')} />
            <FieldError
              errors={requestForm.formState.errors.email ? [requestForm.formState.errors.email] : undefined}
            />
          </Field>
          <Field>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={requestForm.formState.isSubmitting}>
              {requestForm.formState.isSubmitting ? 'Enviando...' : 'Enviar código'}
            </Button>
            <FieldDescription className="text-center">
              <Link to="/">Volver a iniciar sesión</Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </AuthCard>
  );
}
