# UYNM Backend

Backend API for United Youth Nigeria Movement website.

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Email**: Nodemailer

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Fill in your Supabase credentials in `.env`

4. Run the database schema in Supabase SQL Editor:
   - Go to your Supabase project → SQL Editor
   - Copy and run `database/schema.sql`

5. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/reset-password` - Password reset

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (admin)

### Newsletter
- `POST /api/newsletter/subscribe` - Subscribe
- `DELETE /api/newsletter/unsubscribe` - Unsubscribe

### Events
- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create event (admin)
- `POST /api/events/:id/register` - Register for event

### Members
- `POST /api/members/register` - Member registration
- `GET /api/members` - Get all members (admin)

## Deployment (Render)

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set environment variables
5. Deploy!

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `FRONTEND_URL` | Frontend URL for CORS |
| `SMTP_HOST` | Email SMTP host |
| `SMTP_USER` | Email username |
| `SMTP_PASS` | Email password/app password |
| `NOTIFICATION_EMAIL` | Email to receive notifications |
