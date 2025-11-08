import { Visibility, VisibilityOff } from '@mui/icons-material';
import type { TextFieldProps } from '@mui/material';
import { IconButton, InputAdornment, TextField } from '@mui/material';
import React, { useState } from 'react';

type PasswordInputProps = Omit<TextFieldProps, 'type'>;

const PasswordInput: React.FC<PasswordInputProps> = ({ ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleTogglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <TextField
      {...props}
      type={showPassword ? 'text' : 'password'}
      InputProps={{
        ...props.InputProps,
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              onClick={handleTogglePassword}
              edge="end"
              size="small"
            >
              {showPassword ? <VisibilityOff /> : <Visibility />}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};

export default PasswordInput;
