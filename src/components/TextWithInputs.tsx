import React, {useState} from 'react';
import {TextField} from '@mui/material';
import {StyledErrorMessage, StyledInputContainerWrapper, StyledTextContainer} from '../constants/styles';

interface TextWithInputsProps {
  text: string;
  exerciseIndex?: string | number;
  validationResults?: { [key: string]: { isCorrect: boolean; error?: string } };
}

interface InputData {
  id: string;
  value: string;
}


const TextWithInputs: React.FC<TextWithInputsProps> = ({text, exerciseIndex = 0, validationResults = {}}) => {
  const [inputs, setInputs] = useState<InputData[]>([]);

  // Парсим текст и находим все триггеры вида {{input}}
  const parseText = (text: string) => {
    const parts: (string | { type: 'input'; id: string })[] = [];
    const regex = /\{\{input\}\}/g;
    let lastIndex = 0;
    let match;
    let inputCounter = 0;

    while ((match = regex.exec(text)) !== null) {
      // Добавляем текст перед триггером
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Добавляем маркер инпута с индексом упражнения
      const inputId = `input_${exerciseIndex}_${inputCounter++}`;
      parts.push({type: 'input', id: inputId});

      // Инициализируем значение инпута если его еще нет
      if (!inputs.find(input => input.id === inputId)) {
        setInputs(prev => [...prev, {id: inputId, value: ''}]);
      }

      lastIndex = regex.lastIndex;
    }

    // Добавляем оставшийся текст
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  const handleInputChange = (id: string, value: string) => {
    setInputs(prev =>
      prev.map(input =>
        input.id === id ? {...input, value} : input
      )
    );
  };

  const getInputValue = (id: string) => {
    const input = inputs.find(input => input.id === id);
    return input ? input.value : '';
  };

  const parsedParts = parseText(text);

  return (
    <StyledTextContainer>
      {parsedParts.map((part, index) => {
        if (typeof part === 'string') {
          return (
            <span key={index} style={{whiteSpace: 'pre-wrap'}}>
              {part}
            </span>
          );
        } else {
          const isValidated = validationResults.hasOwnProperty(part.id);
          const validationResult = validationResults[part.id];
          const isCorrect = validationResult?.isCorrect;
          const errorMessage = validationResult?.error;

          return (
            <StyledInputContainerWrapper key={index}>
              <TextField
                id={part.id}
                size="small"
                variant="outlined"
                value={getInputValue(part.id)}
                onChange={(e) => handleInputChange(part.id, e.target.value)}
                className={`exercise-input ${isValidated ? (isCorrect ? 'exercise-input-correct' : 'exercise-input-incorrect') : ''}`}
              />
              {isValidated && !isCorrect && errorMessage && (
                <StyledErrorMessage>
                  {errorMessage}
                </StyledErrorMessage>
              )}
            </StyledInputContainerWrapper>
          );
        }
      })}
    </StyledTextContainer>
  );
};

export default TextWithInputs;
