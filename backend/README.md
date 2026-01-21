# QuickPay Backend API

A powerful Express.js backend for the QuickPay Invoicing Dashboard with Supabase integration.

## Features

- 🚀 **Express.js Server** - Fast and lightweight Node.js framework
- 🗄️ **Supabase Integration** - PostgreSQL database with real-time capabilities
- 🔒 **Security** - Helmet, CORS, rate limiting, and input validation
- 📊 **Comprehensive APIs** - Payments, Invoices, Clients, and Statistics
- 🏗️ **RESTful Architecture** - Clean, predictable API endpoints
- ✅ **Input Validation** - Express-validator for robust data validation
- 📈 **Real-time Ready** - Compatible with Supabase real-time subscriptions
- 🔍 **Error Handling** - Comprehensive error handling and logging
- 📱 **CORS Enabled** - Ready for frontend integration

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- Supabase account and project
- PostgreSQL database (via Supabase)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env
   ```

3. **Configure your `.env` file**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_KEY=your-service-role-key
   SUPABASE_ANON_KEY=your-anon-key
   PORT=7200
   NODE_ENV=development
   CORS_ORIGIN=https://telvoip-code-challenge.vercel.app
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and execute the SQL from `database/schema.sql`

5. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The server will be running at `https://telvoip-code-challenge.fly.dev/`

## API Endpoints

### Base URL: `https://telvoip-code-challenge.fly.dev/api/v1`

### Health Check
- `GET /health` - Server health status

### Payments
- `GET /payments` - List all payments with pagination and filtering
- `GET /payments/:id` - Get single payment details
- `PATCH /payments/:id` - Update payment status/details
- `DELETE /payments/:id` - Delete payment
- `GET /payments/recent/:count` - Get recent payments

### Invoices
- `POST /invoices` - Create new invoice with items
- `GET /invoices/:id` - Get single invoice with items
- `GET /invoices` - List invoices with pagination
- `DELETE /invoices/:id` - Delete invoice (pending only)
- `PUT /invoices/:id/send` - Mark invoice as sent

### Clients
- `GET /clients` - List all clients with pagination
- `GET /clients/:id` - Get single client with payment history
- `POST /clients` - Create new client
- `PUT /clients/:id` - Update client details
- `DELETE /clients/:id` - Delete client (if no payments)
- `GET /clients/:id/stats` - Get client statistics

### Statistics
- `GET /stats/dashboard` - Main dashboard statistics
- `GET /stats/payments` - Payment analytics with time filters
- `GET /stats/clients` - Client performance metrics

## API Examples

### Create a new invoice
```bash
curl -X POST https://telvoip-code-challenge.fly.dev/api/v1/invoices \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "uuid-here",
    "due_date": "2024-12-31",
    "tax_rate": 6.0,
    "items": [
      {
        "description": "Web Development",
        "quantity": 40,
        "rate": 50
      }
    ]
  }'
```

### Get dashboard statistics
```bash
curl https://telvoip-code-challenge.fly.dev/api/v1/stats/dashboard
```

### Update payment status
```bash
curl -X PATCH https://telvoip-code-challenge.fly.dev/api/v1/payments/uuid-here \
  -H "Content-Type: application/json" \
  -d '{"status": "paid"}'
```

## Database Schema

The application uses the following main tables:

- **clients** - Customer information
- **payments** - Invoice/payment records
- **invoice_items** - Line items for each invoice

See `database/schema.sql` for the complete schema with indexes, constraints, and sample data.

## Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin request handling
- **Rate Limiting** - API request throttling
- **Input Validation** - Express-validator for all endpoints
- **Error Handling** - Comprehensive error responses
- **RLS** - Row Level Security in Supabase

## Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Your Supabase project URL | Required |
| `SUPABASE_SERVICE_KEY` | Service role key | Required |
| `SUPABASE_ANON_KEY` | Anonymous key | Optional |
| `PORT` | Server port | 7200 |
| `NODE_ENV` | Environment mode | development |
| `CORS_ORIGIN` | Frontend URL | https://telvoip-code-challenge.vercel.app |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 900000 (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |

## Development

### Project Structure
```
backend/
├── config/
│   └── supabase.js          # Database configuration
├── middleware/
│   ├── errorHandler.js      # Global error handling
│   └── validateSupabase.js  # DB connection validation
├── routes/
│   ├── payments.js          # Payment endpoints
│   ├── invoices.js          # Invoice endpoints
│   ├── clients.js           # Client endpoints
│   └── stats.js             # Statistics endpoints
├── database/
│   └── schema.sql           # Database schema
├── server.js                # Main application file
├── package.json
└── .env.example
```

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests (when implemented)

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed description",
  "timestamp": "2024-12-07T10:30:00.000Z"
}
```

## Pagination

List endpoints support pagination:

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Check the API documentation at `/api/v1`
- Review the database schema in `database/schema.sql`
- Check server logs for debugging information

---

Built with ❤️ using Express.js and Supabase