import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ApiError } from '@/shared/lib/apiClient'
import { PasswordField } from '@/features/auth/components/PasswordField'
import { useAuthOutlet } from '@/features/auth/context/AuthLayoutContext'
import { validateEmail, validatePassword } from '@/features/auth/validation/authValidation'
import styles from '@/features/auth/components/AuthForm.module.css'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const { login } = useAuth()
  const { setMascotPose } = useAuthOutlet()
  const navigate = useNavigate()
  const {
    control,
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { email: '', password: '' },
  })

  const onSubmit: SubmitHandler<LoginFormValues> = async (values) => {
    clearErrors('root.server')
    try {
      await login(values)
      navigate('/patients')
    } catch (error) {
      const isInvalidCredentials =
        error instanceof ApiError && [400, 401, 404].includes(error.status)

      setError('root.server', {
        type: 'server',
        message: isInvalidCredentials
          ? 'Email or password entered is incorrect'
          : 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      <div className={styles.fieldGroup}>
        <label htmlFor="email" className={styles.label}>
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register('email', {
            setValueAs: (value: string) => value.trim(),
            validate: validateEmail,
          })}
          className={`${styles.input} ${errors.email ? styles.inputInvalid : ''}`}
          autoComplete="username"
          placeholder="name@vorgavet.com"
          autoFocus
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
        />
        {errors.email?.message && (
          <p id="login-email-error" className={styles.fieldError} role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="password" className={styles.label}>
          Password
        </label>
        <Controller
          name="password"
          control={control}
          rules={{ validate: validatePassword }}
          render={({ field, fieldState }) => (
            <PasswordField
              id="password"
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              autoComplete="current-password"
              onMascotChange={setMascotPose}
              onValidationBlur={field.onBlur}
              inputRef={field.ref}
              isInvalid={Boolean(fieldState.error)}
              errorId="login-password-error"
            />
          )}
        />
        {errors.password?.message && (
          <p id="login-password-error" className={styles.fieldError} role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root?.server?.message && (
        <p className={styles.error} role="alert">
          {errors.root.server.message}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className={styles.button}>
        {isSubmitting && <span className={styles.spinner} />}
        {isSubmitting ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}
