# aylnor.ai

A modern Next.js 15 application built with TypeScript and Tailwind CSS, featuring AI-powered academic and coding assistance with Supabase backend integration.

## 🚀 Features

- **Next.js 15** - Latest version with improved performance and features
- **React 19** - Latest React version with enhanced capabilities
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Supabase Integration** - Secure database and authentication
- **Multi-AI System** - Gemini Pro, Gemini Pro Vision, Llama 3 70B, and Mixtral 8x7B
- **Three AI Modes** - Fast, Thoughtful, and Programming modes
- **Secure Authentication** - Email/password authentication with session management

## 🛠️ Installation

1. Install dependencies:
  ```bash
  npm install
  # or
  yarn install
  ```

2. Set up environment variables:
  ```bash
  cp .env.example .env.local
  ```
  Then fill in your API keys in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
  - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
  - `GEMINI_API_KEY` - Your Google Gemini API key
  - `GROQ_API_KEY` - Your Groq API key
  - `NEXTAUTH_SECRET` - Generate a random secret for NextAuth
  - `NEXTAUTH_URL` - Your application URL (http://localhost:4028 for local)

3. Set up Supabase database:
  - Create a new project at https://supabase.com
  - Navigate to the SQL Editor in Supabase dashboard
  - Execute the SQL commands from `DATABASE_SCHEMA.md`
  - Enable Email/Password authentication in Supabase dashboard

4. Start the development server:
  ```bash
  npm run dev
  # or
  yarn dev
  ```
5. Open [http://localhost:4028](http://localhost:4028) with your browser to see the result.

## 📁 Project Structure

```
aylnor/
├── public/             # Static assets
├── src/
│   ├── app/            # App router components
│   │   ├── layout.tsx  # Root layout component
│   │   ├── page.tsx    # Main landing page
│   │   ├── chat-page/  # Chat interface
│   │   ├── sign-up-login-screen/  # Authentication pages
│   │   └── components/  # Page-specific components
│   ├── components/     # Reusable UI components
│   │   └── AuthProvider.tsx  # Authentication context provider
│   ├── lib/            # Utility functions and services
│   │   ├── supabase.ts  # Supabase client configuration
│   │   └── ai-service.ts  # AI tool orchestration
│   └── styles/         # Global styles and Tailwind configuration
├── DATABASE_SCHEMA.md  # Database schema documentation
├── next.config.mjs     # Next.js configuration
├── package.json        # Project dependencies and scripts
├── postcss.config.js   # PostCSS configuration
└── tailwind.config.js  # Tailwind CSS configuration

```

## 🧩 Page Editing

You can start editing the page by modifying `src/app/page.tsx`. The page auto-updates as you edit the file.

## 🤖 AI Integration

The application integrates four AI tools:

### Gemini Tools
- **Gemini Pro**: Used for academic content generation and detailed explanations
- **Gemini Pro Vision**: Used for code analysis with visual input

### Groq Tools
- **Llama 3 70B**: Used for fast, instant responses in Fast Mode
- **Mixtral 8x7B**: Used for code generation and debugging in Programming Mode

### AI Modes
- **Fast Mode**: Uses Llama 3 70B for quick, concise answers
- **Thoughtful Mode**: Uses Gemini Pro for deep, detailed explanations
- **Programming Mode**: Uses Mixtral 8x7B for code generation and debugging

## 🔐 Authentication

The application uses Supabase Authentication with the following features:
- Email/password authentication
- Session management with automatic refresh
- Protected routes via middleware
- User preferences and profile management

## 🎨 Styling

This project uses Tailwind CSS for styling with the following features:
- Utility-first approach for rapid development
- Custom theme configuration
- Responsive design utilities
- PostCSS and Autoprefixer integration

## 📦 Available Scripts

- `npm run dev` - Start development server on port 4028
- `npm run build` - Build the application for production
- `npm run start` - Start the development server
- `npm run serve` - Start the production server
- `npm run lint` - Run ESLint to check code quality
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run format` - Format code with Prettier

## 📱 Deployment

Build the application for production:

  ```bash
  npm run build
  ```

## 📚 Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

You can check out the [Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## 🙏 Acknowledgments

- Built with [Rocket.new](https://rocket.new)
- Powered by Next.js and React
- Styled with Tailwind CSS

Built with ❤️ on Rocket.new