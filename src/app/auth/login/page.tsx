"use client"

import React, {useState} from 'react';
import {useRouter, useSearchParams} from "next/navigation";

import {signIn} from "next-auth/react";

import {Box, Button, TextField, Typography} from '@mui/material';

export default function Login() {
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
    <Box maxWidth={400} mx="auto" mt={8}>
      <Typography variant="h5" mb={2}>Вход</Typography>
      <form onSubmit={handleLogin}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Пароль"
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {error && <Typography color="error" mt={1}>{error}</Typography>}
        <Button type="submit" loading={loading} variant="contained" fullWidth sx={{mt: 2}}>Войти</Button>
        <Button variant="text" loading={loading} fullWidth sx={{mt: 1}} onClick={() => router.push('/auth/reset')}>Забыли
          пароль?</Button>
      </form>
    </Box>
  );
}
