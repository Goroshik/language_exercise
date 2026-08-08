import React, { useState } from 'react';

import { IconButton, InputAdornment, Stack, TextField, TextFieldProps } from '@mui/material';

import { Visibility, VisibilityOff } from '@mui/icons-material';

const typeSwitcher = (type: React.HTMLInputTypeAttribute | undefined, showPassword: boolean) => {
  if (type !== 'password') return type;

  return showPassword ? 'text' : 'password';
};

const PasswordIcon = ({
  showPassword,
  setShowPassword
}: {
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}) => (
  <InputAdornment position="end">
    <IconButton
      aria-label={showPassword ? 'hide the password' : 'display the password'}
      onClick={() => setShowPassword(show => !show)}
      edge="end"
    >
      {showPassword ? <Visibility /> : <VisibilityOff />}
    </IconButton>
  </InputAdornment>
);

const BaseInput = (props: Omit<TextFieldProps, 'variant'>) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = ({ target }: React.ChangeEvent<HTMLInputElement>) => {
    const htmlInput = props.slotProps?.htmlInput;

    if (props.type === 'number' && htmlInput && typeof htmlInput !== 'function') {
      const { min, max } = htmlInput as { min?: number; max?: number };
      const { value } = target;

      // TODO: Fix types - properly type onChange handler instead of using any
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (value === '') return props.onChange?.(null as any);

      if (typeof min === 'number' && Number(value) < Number(min))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props.onChange?.(String(min) as any);
      else if (typeof max === 'number' && Number(value) > Number(max))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        props.onChange?.(String(max) as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else props.onChange?.(value as any);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } else props.onChange?.(target.value as any);
  };

  return (
    <Stack
      direction="row"
      sx={{
        alignItems: 'center'
      }}
    >
      <TextField
        label={props.label}
        type={typeSwitcher(props.type, showPassword)}
        fullWidth
        margin="normal"
        value={props.value}
        onChange={handleChange}
        {...props}
      />
      {props.type === 'password' ? (
        <PasswordIcon showPassword={showPassword} setShowPassword={setShowPassword} />
      ) : null}
    </Stack>
  );
};

export default BaseInput;
