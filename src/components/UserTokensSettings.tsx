import React, { useEffect, useState } from 'react';

import DeleteIcon from '@mui/icons-material/Delete';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemText, MenuItem, Select, TextField } from '@mui/material';

const SERVICES = [
  { value: 'google', label: 'Google Translate' },
  { value: 'deepl', label: 'DeepL' },
  { value: 'ai', label: 'AI' },
];

export const UserTokensSettings: React.FC = () => {
  const [tokens, setTokens] = useState([]);
  const [open, setOpen] = useState(false);
  const [service, setService] = useState('google');
  const [token, setToken] = useState('');

  const fetchTokens = async () => {
    const res = await fetch('/api/tokens');
    if (res.ok) setTokens(await res.json());
  };

  useEffect(() => {
    fetchTokens();
  }, []);

  const handleAdd = async () => {
    await fetch('/api/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ service, token }),
    });
    setToken('');
    setOpen(false);
    fetchTokens();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tokens/${id}`, { method: 'DELETE' });
    fetchTokens();
  };

  return (
    <div>
      <h2>Мои токены для сервисов</h2>
      <Button variant="contained" onClick={() => setOpen(true)}>Добавить токен</Button>
      <List>
        {tokens.map((t: any) => (
          <ListItem key={t.id} secondaryAction={
            <IconButton edge="end" onClick={() => handleDelete(t.id)}><DeleteIcon /></IconButton>
          }>
            <ListItemText primary={SERVICES.find(s => s.value === t.service)?.label || t.service} secondary={t.token} />
          </ListItem>
        ))}
      </List>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Добавить токен</DialogTitle>
        <DialogContent>
          <Select value={service} onChange={e => setService(e.target.value as string)} fullWidth>
            {SERVICES.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
          </Select>
          <TextField label="Токен" value={token} onChange={e => setToken(e.target.value)} fullWidth margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Отмена</Button>
          <Button onClick={handleAdd} variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
