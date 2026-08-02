import { Controller, useForm, type SubmitHandler } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { useAuth } from '@/features/auth/context/AuthContext'
import { ApiError } from '@/shared/lib/apiClient'
import { PasswordField } from '@/features/auth/components/PasswordField'
import { useAuthOutlet } from '@/features/auth/context/AuthLayoutContext'
import {
  validateEmail,
  validatePassword,
  validateRequired,
} from '@/features/auth/validation/authValidation'
import styles from '@/features/auth/components/AuthForm.module.css'

interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  password: string
}

export function RegisterPage() {
  const { register: registerUser } = useAuth()
  const { setMascotIsCovering } = useAuthOutlet()
  const navigate = useNavigate()
  const {
    control,
    register,
    handleSubmit,
    clearErrors,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    mode: 'onBlur',
    reValidateMode: 'onChange',
    defaultValues: { firstName: '', lastName: '', email: '', password: '' },
  })

  const onSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
    clearErrors('root.server')
    try {
      await registerUser(values)
      navigate('/login')
    } catch (error) {
      setError('root.server', {
        type: 'server',
        message:
          error instanceof ApiError ? error.message : 'Something went wrong. Please try again.',
      })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
      <div className={styles.grid}>
        <div className={styles.fieldGroup}>
          <label htmlFor="firstName" className={styles.label}>
            First name
          </label>
          <input
            id="firstName"
            type="text"
            {...register('firstName', {
              setValueAs: (value: string) => value.trim(),
              validate: (value) => validateRequired(value, 'First name'),
            })}
            className={`${styles.input} ${errors.firstName ? styles.inputInvalid : ''}`}
            autoComplete="given-name"
            placeholder="Milan"
            autoFocus
            aria-invalid={Boolean(errors.firstName) || undefined}
            aria-describedby={errors.firstName ? 'register-first-name-error' : undefined}
          />
          {errors.firstName?.message && (
            <p id="register-first-name-error" className={styles.fieldError} role="alert">
              {errors.firstName.message}
            </p>
          )}
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="lastName" className={styles.label}>
            Last name
          </label>
          <input
            id="lastName"
            type="text"
            {...register('lastName', {
              setValueAs: (value: string) => value.trim(),
              validate: (value) => validateRequired(value, 'Last name'),
            })}
            className={`${styles.input} ${errors.lastName ? styles.inputInvalid : ''}`}
            autoComplete="family-name"
            placeholder="Vorga"
            aria-invalid={Boolean(errors.lastName) || undefined}
            aria-describedby={errors.lastName ? 'register-last-name-error' : undefined}
          />
          {errors.lastName?.message && (
            <p id="register-last-name-error" className={styles.fieldError} role="alert">
              {errors.lastName.message}
            </p>
          )}
        </div>
      </div>

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
          autoComplete="email"
          placeholder="name@vorgavet.com"
          aria-invalid={Boolean(errors.email) || undefined}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
        />
        {errors.email?.message && (
          <p id="register-email-error" className={styles.fieldError} role="alert">
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
              autoComplete="new-password"
              onMascotChange={setMascotIsCovering}
              onValidationBlur={field.onBlur}
              inputRef={field.ref}
              isInvalid={Boolean(fieldState.error)}
              errorId="register-password-error"
            />
          )}
        />
        {errors.password?.message && (
          <p id="register-password-error" className={styles.fieldError} role="alert">
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
        {isSubmitting ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
