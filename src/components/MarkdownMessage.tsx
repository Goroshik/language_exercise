'use client';

import { Box, Typography } from '@mui/material';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownMessageProps {
  content: string;
  role: 'user' | 'assistant';
}

const MarkdownMessage: React.FC<MarkdownMessageProps> = ({ content, role }) => {

  return (
    <Box
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: role === 'user' ? '#e3f2fd' : '#fff',
        alignSelf: role === 'user' ? 'flex-end' : 'flex-start',
        maxWidth: '85%',
        boxShadow: 1,
        '& p': {
          margin: '0.5em 0',
          '&:first-of-type': { marginTop: 0 },
          '&:last-child': { marginBottom: 0 }
        },
        '& ul, & ol': {
          marginLeft: '1.5em',
          marginTop: '0.5em',
          marginBottom: '0.5em'
        },
        '& li': {
          marginBottom: '0.25em'
        },
        '& code': {
          backgroundColor: role === 'user' ? '#bbdefb' : '#f5f5f5',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.9em',
          fontFamily: 'monospace'
        },
        '& pre': {
          margin: '0.5em 0',
          borderRadius: '8px',
          overflow: 'hidden'
        },
        '& blockquote': {
          borderLeft: '4px solid #ccc',
          margin: '0.5em 0',
          paddingLeft: '1em',
          color: '#666'
        },
        '& h1, & h2, & h3, & h4, & h5, & h6': {
          marginTop: '0.8em',
          marginBottom: '0.4em',
          '&:first-of-type': { marginTop: 0 }
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          margin: '0.5em 0'
        },
        '& th, & td': {
          border: '1px solid #ddd',
          padding: '8px',
          textAlign: 'left'
        },
        '& th': {
          backgroundColor: '#f5f5f5',
          fontWeight: 'bold'
        }
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mb: 1,
          color: 'text.secondary',
          fontWeight: 'bold'
        }}
      >
        {role === 'user' ? 'Вы' : 'AI'}
      </Typography>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // TODO: Fix types - properly type ReactMarkdown component props
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';

            if (!inline && match) {
              return React.createElement(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                SyntaxHighlighter as any,
                {
                  style: vscDarkPlus,
                  language: language,
                  PreTag: 'div',
                  ...props
                },
                String(children).replace(/\n$/, '')
              );
            }

            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownMessage;
