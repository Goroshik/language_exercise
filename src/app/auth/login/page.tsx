'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';

import { Box, Button, TextField, Typography } from '@mui/material';
import { PasswordInput } from 'src/components/Form/base';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/topics';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (res.ok) {
        router.push(callbackUrl);
        router.refresh();
      } else {
        const data = await res.json().catch(() => ({ error: 'Ошибка' }));
        setError(data.error || 'Неверные данные');
      }
    } catch {
      setError('Ошибка сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 8
      }}
    >
      <Typography
        variant="h5"
        sx={{
          mb: 2
        }}
      >
        Вход
      </Typography>
      <form onSubmit={handleLogin}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <PasswordInput
          label="Пароль"
          fullWidth
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && (
          <Typography
            color="error"
            sx={{
              mt: 1
            }}
          >
            {error}
          </Typography>
        )}
        <Button type="submit" loading={loading} variant="contained" fullWidth sx={{ mt: 2 }}>
          Войти
        </Button>
        <Button
          variant="text"
          loading={loading}
          fullWidth
          sx={{ mt: 1 }}
          onClick={() => router.push('/auth/reset')}
        >
          Забыли пароль?
        </Button>
      </form>
    </Box>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            maxWidth: 400,
            mx: 'auto',
            mt: 8
          }}
        >
          <Typography>Загрузка...</Typography>
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
