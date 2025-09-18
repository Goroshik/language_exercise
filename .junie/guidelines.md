# Project Guidelines

* don't create tests files
* don't run project

## Code Standards

* All comments must be written in English only
* All comments must be prefixed with "// NOTE:" (e.g., `// NOTE: Filter by tags`)

## Project Overview

This is an interactive English language learning application built with React and TypeScript. The project provides
AI-powered grammar exercises and learning tools.

### Key Features

- Grammar topic generation using AI
- Interactive grammar exercises
- AI-powered answer checking
- Chat assistant for Polish language learning
- Modern Material-UI design with gradients and animations

### Technical Stack

- **Frontend**: React 18, TypeScript
- **UI Library**: Material-UI (MUI)
- **Forms**: React Hook Form
- **Package Manager**: Yarn
- **AI Integration**: Google AI API
- **Architecture**: Modular component-based structure with custom hooks

### Project Structure

- `src/components/` - React components (Header, exercises, topic selection, etc.)
- `src/hooks/` - Custom hooks for state management (useAppState)
- `src/prompts/` - AI prompts for grammar and chat functionality
- `src/types/` - TypeScript interfaces and types
- `src/constants/` - Application constants and centralized styles
- `src/services/` - External service integrations (Google AI)

### Main Functionality

The app allows users to:

1. Generate English grammar topics
2. Create and complete interactive exercises
3. Get AI-powered feedback on answers
4. Use a chat assistant for learning support
5. Experience modern, responsive UI design

The project follows a modular architecture for easy maintenance and feature expansion.


