import React, {useState} from 'react';

import {TextFieldProps} from "@mui/material/TextField/TextField";
import {IconButton, InputAdornment, Stack, TextField} from '@mui/material';

import {Visibility, VisibilityOff} from '@mui/icons-material';

const typeSwitcher = (type: React.HTMLInputTypeAttribute, showPassword: boolean) => {
  if (type !== 'password') return type;

  return showPassword ? 'text' : 'password';
};

const PasswordIcon = ({showPassword, setShowPassword}: {
  showPassword: boolean,
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>
}) => (
  <InputAdornment position="end">
    <IconButton
      aria-label={showPassword ? 'hide the password' : 'display the password'}
      onClick={() => setShowPassword(show => !show)}
      edge="end"
    >
      {showPassword ? <Visibility/> : <VisibilityOff/>}
    </IconButton>
  </InputAdornment>
);

const BaseInput = (props: Omit<TextFieldProps, 'variant'>) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = ({target}) => {
    if (props.type === 'number') {
      const {min, max} = props.inputProps;
      const {value} = target;

      if (value === '') return props.onChange(null);

      if (typeof min === 'number' && Number(value) < Number(min)) props.onChange(String(min));
      else if (typeof max === 'number' && Number(value) > Number(max)) props.onChange(String(max));
      else props.onChange(value);
    } else props.onChange(target.value);
  };


  return (
    <Stack direction="row" alignItems="center">
      <TextField
        label={props.lable}
        type={typeSwitcher(props.type, showPassword)}
        fullWidth
        margin="normal"
        value={props.value}
        onChange={handleChange}
        {...props}
      />
      {props.type === 'password' ? <PasswordIcon showPassword={showPassword} setShowPassword={setShowPassword}/> : null}
    </Stack>
  );
};


export default BaseInput;
