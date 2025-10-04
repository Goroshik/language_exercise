"use client"

import React, {useState} from 'react';
import {useRouter} from "next/navigation";

import {signIn} from "next-auth/react";

import {Box, Button, TextField, Typography} from '@mui/material';

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    setError('');
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });


      if (res?.ok) {
        router.push("/topics");
      } else {
        setError("Неверные данные");
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
