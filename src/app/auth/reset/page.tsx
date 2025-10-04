"use client"

import React, { useState } from 'react';
import { useRouter } from "next/navigation";

import { Box, Button, TextField, Typography } from '@mui/material';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const navigate = useRouter();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || 'Ошибка сброса пароля');
      }
    } catch {
      setError('Ошибка сервера');
    }
  };

  return (
    <Box maxWidth={400} mx="auto" mt={8}>
      <Typography variant="h5" mb={2}>Сброс пароля</Typography>
      <form onSubmit={handleReset}>
        <TextField
          label="Email"
          type="email"
          fullWidth
          margin="normal"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <TextField
          label="Новый пароль"
          type="password"
          fullWidth
          margin="normal"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
        />
        {error && <Typography color="error" mt={1}>{error}</Typography>}
        {success && <Typography color="primary" mt={1}>Пароль успешно изменён!</Typography>}
        <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>Сбросить пароль</Button>
        <Button variant="text" fullWidth sx={{ mt: 1 }} onClick={() => navigate.push('/auth/login')}>Назад к входу</Button>
      </form>
    </Box>
  );
}
