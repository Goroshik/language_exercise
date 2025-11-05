This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Project Documentation

### Features

- [Exercise History](./EXERCISE_HISTORY.md) - Comprehensive documentation for the generated sentences history feature
- [Exercise History AI Guide](./EXERCISE_HISTORY_AI_PROMPT.md) - Quick reference for AI assistants working with exercise history
- [Exercise History TODO](./EXERCISE_HISTORY_TODO.md) - Future improvements and AI-ready implementation prompts

### Other Documentation

- [Alert System](./ALERT_SYSTEM.md) - Alert and notification system documentation
- [AI Model Selector](./AI_MODEL_SELECTOR_TESTING.md) - AI model selection feature testing guide
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md) - Summary of key implementations

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Deployment

For comprehensive deployment instructions including environment setup, database configuration, and deployment to various platforms (Vercel, Railway, Render, DigitalOcean, Docker), see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Quick Start

1. Copy `.env.example` to `.env` and configure environment variables
2. Set up MongoDB database (MongoDB Atlas recommended)
3. Choose your deployment platform and follow the guide
4. Deploy and enjoy!

### Key Requirements

- Node.js 20+
- MongoDB with replica set support (required for Prisma transactions)
- Environment variables properly configured
