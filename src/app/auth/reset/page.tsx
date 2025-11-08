'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Box, Button, TextField, Typography, Alert, CircularProgress } from '@mui/material';

function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [checkingToken, setCheckingToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  // Check if we have a token in URL
  useEffect(() => {
    if (token) {
      setCheckingToken(true);
      fetch(`/api/auth/verify-token?token=${token}`)
        .then(res => res.json())
        .then(data => {
          if (data.valid) {
            setTokenValid(true);
            if (data.email) {
              setEmail(data.email);
            }
          } else {
            setError('Ссылка недействительна или истекла. Запросите новую ссылку для сброса пароля.');
          }
        })
        .catch(() => {
          setError('Ошибка проверки токена');
        })
        .finally(() => {
          setCheckingToken(false);
        });
    }
  }, [token]);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ошибка запроса сброса пароля');
      }
    } catch {
      setError('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setError(data.error || 'Ошибка сброса пароля');
      }
    } catch {
      setError('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  if (checkingToken) {
    return (
      <Box maxWidth={400} mx="auto" mt={8} display="flex" justifyContent="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box maxWidth={400} mx="auto" mt={8}>
      <Typography variant="h5" mb={2}>
        Сброс пароля
      </Typography>

      {!token ? (
        // Step 1: Request password reset
        <form onSubmit={handleRequestReset}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Введите ваш email, и мы отправим вам ссылку для сброса пароля
          </Typography>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            disabled={loading || success}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Письмо для сброса пароля отправлено на ваш email. Проверьте папку входящих и спам.
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Отправить ссылку для сброса'}
          </Button>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => router.push('/auth/login')}
          >
            Назад к входу
          </Button>
        </form>
      ) : tokenValid ? (
        // Step 2: Reset password with token
        <form onSubmit={handleResetPassword}>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Введите новый пароль для вашей учетной записи
          </Typography>
          <TextField
            label="Новый пароль"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            disabled={loading || success}
          />
          <TextField
            label="Подтвердите пароль"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            disabled={loading || success}
          />
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Пароль успешно изменён! Перенаправление на страницу входа...
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading || success}
          >
            {loading ? <CircularProgress size={24} /> : 'Сбросить пароль'}
          </Button>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => router.push('/auth/login')}
          >
            Назад к входу
          </Button>
        </form>
      ) : (
        // Invalid or expired token
        <Box>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || 'Ссылка недействительна или истекла'}
          </Alert>
          <Button
            variant="contained"
            fullWidth
            onClick={() => router.push('/auth/reset')}
          >
            Запросить новую ссылку
          </Button>
          <Button
            variant="text"
            fullWidth
            sx={{ mt: 1 }}
            onClick={() => router.push('/auth/login')}
          >
            Назад к входу
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <Box maxWidth={400} mx="auto" mt={8} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
