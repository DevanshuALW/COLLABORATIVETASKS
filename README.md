# TaskHub

A collaborative task management application built with React, Express, and PostgreSQL.

## Features

- User authentication with phone number verification
- Create and manage boards
- Add and assign tasks
- Collaborate with team members
- Real-time updates

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Auth
- **Deployment**: Vercel

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file with the following variables:
   ```
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/taskboard
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
   VITE_FIREBASE_APP_ID=your_firebase_app_id
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment to Vercel

### Prerequisites

1. A Vercel account
2. A PostgreSQL database (e.g., Neon, Supabase, or any other PostgreSQL provider)
3. A Firebase project with Authentication enabled

### Steps to Deploy

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to Vercel:
   ```bash
   vercel
   ```

4. Set up environment variables in the Vercel dashboard:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `VITE_FIREBASE_API_KEY`: Your Firebase API key
   - `VITE_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `VITE_FIREBASE_APP_ID`: Your Firebase app ID
   - `CSRF_SECRET`: A random string for CSRF protection

5. Deploy to production:
   ```bash
   vercel --prod
   ```

## Database Setup

Before running the application, you need to set up the database:

1. Create a PostgreSQL database
2. Set the `DATABASE_URL` environment variable
3. Run the database migrations:
   ```bash
   npm run db:push
   ```

## Security Features

- Password hashing with bcrypt
- CSRF protection
- Security headers
- Input validation with Zod
