# Birthday Party Ticket App

A Next.js application for selling birthday party tickets with integrated payment processing (Stripe), ticket management (Ticket Tailor), and email collection (EmailOctopus).

## Features

- **User Registration**: Form with validation for name, email, phone, and ticket quantity
- **Payment Processing**: Stripe integration for secure payments (sandbox mode)
- **Ticket Management**: Ticket Tailor API integration for ticket creation
- **Email Collection**: EmailOctopus integration for building your email list
- **Webhook Handlers**: Receives webhooks from Stripe, Ticket Tailor, and EmailOctopus
- **Success Page**: Payment verification and confirmation page

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory and add the following variables:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# Ticket Tailor
TICKET_TAILOR_API_KEY=your_ticket_tailor_api_key
TICKET_TAILOR_EVENT_ID=your_event_id
TICKET_TAILOR_WEBHOOK_SECRET=your_webhook_secret

# EmailOctopus
EMAIL_OCTOPUS_API_KEY=your_email_octopus_api_key
EMAIL_OCTOPUS_LIST_ID=your_list_id
EMAIL_OCTOPUS_WEBHOOK_SECRET=your_webhook_secret

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

For detailed instructions on obtaining these keys, see [ENV_SETUP.md](./ENV_SETUP.md).

### 3. Set Up Webhooks

Configure webhooks for each service:

- **Stripe**: `https://your-domain.com/api/webhooks/stripe`
- **Ticket Tailor**: `https://your-domain.com/api/webhooks/ticket-tailor`
- **EmailOctopus**: `https://your-domain.com/api/webhooks/email-octopus`

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
app/
├── api/
│   ├── register/
│   │   └── route.ts          # Registration API with Stripe, Ticket Tailor, EmailOctopus
│   ├── verify-session/
│   │   └── route.ts          # Stripe session verification
│   └── webhooks/
│       ├── stripe/
│       │   └── route.ts      # Stripe webhook handler
│       ├── ticket-tailor/
│       │   └── route.ts      # Ticket Tailor webhook handler
│       └── email-octopus/
│           └── route.ts      # EmailOctopus webhook handler
├── page.tsx                  # Registration form
└── success/
    └── page.tsx              # Payment success page
```

## Testing

### Stripe Test Mode

Use Stripe's test mode with these test card numbers:
- **Success**: `4242 4242 4242 4242`
- **Failure**: `4000 0000 0000 0002`

### Ticket Tailor Sandbox

Use Ticket Tailor's sandbox environment for testing ticket creation.

### EmailOctopus Free Tier

Test email collection with EmailOctopus's free tier before upgrading.

## Free Email Service Alternatives

If you prefer alternatives to EmailOctopus, consider:
- **Resend**: [resend.com](https://resend.com/) - Free tier available
- **Mailgun**: [mailgun.com](https://www.mailgun.com/) - Free tier available
- **ConvertKit**: [convertkit.com](https://convertkit.com/) - Free tier available

See [ENV_SETUP.md](./ENV_SETUP.md) for integration details.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com/new)
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

Ensure you set the `NEXT_PUBLIC_BASE_URL` environment variable to your production domain.

## Security Notes

- Never commit `.env.local` to version control
- Use webhook secrets to verify incoming webhooks
- Enable HTTPS in production
- Keep API keys secure and rotate them regularly

## Support

For detailed setup instructions, see [ENV_SETUP.md](./ENV_SETUP.md).

## License

MIT
