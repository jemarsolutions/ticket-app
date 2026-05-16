# Environment Variables Setup

This app requires the following environment variables to be set in your `.env.local` file.

## Stripe Configuration

```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
```

To get these values:
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or sign in
3. Go to Developers > API keys
4. Copy the **Secret key** (starts with `sk_test_` for test mode)
5. Go to Developers > Webhooks
6. Add a webhook endpoint: `https://your-domain.com/api/webhooks/stripe`
7. Copy the **Signing secret** (starts with `whsec_`)

## Ticket Tailor Configuration

```env
TICKET_TAILOR_API_KEY=your_ticket_tailor_api_key
TICKET_TAILOR_EVENT_ID=your_event_id
TICKET_TAILOR_WEBHOOK_SECRET=your_webhook_secret (optional)
```

To get these values:
1. Go to [Ticket Tailor](https://www.tickettailor.com/)
2. Create an account and sign in
3. Go to Settings > API
4. Generate an API key
5. Create an event and copy the Event ID
6. Set up webhooks in Ticket Tailor settings to point to: `https://your-domain.com/api/webhooks/ticket-tailor`

## EmailOctopus Configuration

```env
EMAIL_OCTOPUS_API_KEY=your_email_octopus_api_key
EMAIL_OCTOPUS_LIST_ID=your_list_id
EMAIL_OCTOPUS_WEBHOOK_SECRET=your_webhook_secret (optional)
```

To get these values:
1. Go to [EmailOctopus](https://emailoctopus.com/)
2. Create an account and sign in
3. Go to API > Create API key
4. Create a list and copy the List ID
5. Set up webhooks in EmailOctopus to point to: `https://your-domain.com/api/webhooks/email-octopus`

## Application Configuration

```env
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

Set this to your production URL when deploying:
- Development: `http://localhost:3000`
- Production: `https://your-domain.com`

## Free Alternative to EmailOctopus

If you prefer a free alternative to EmailOctopus, consider:

### Resend (Free tier available)
- Sign up at [resend.com](https://resend.com/)
- Get API key from dashboard
- Modify the `addToEmailOctopus` function in `app/api/register/route.ts` to use Resend API instead

### Mailgun (Free tier available)
- Sign up at [mailgun.com](https://www.mailgun.com/)
- Get API key from dashboard
- Modify the email integration to use Mailgun API

### ConvertKit (Free tier available)
- Sign up at [convertkit.com](https://convertkit.com/)
- Get API key from dashboard
- Modify the email integration to use ConvertKit API

## Complete .env.local Example

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Ticket Tailor
TICKET_TAILOR_API_KEY=your_api_key
TICKET_TAILOR_EVENT_ID=your_event_id
TICKET_TAILOR_WEBHOOK_SECRET=optional_secret

# EmailOctopus
EMAIL_OCTOPUS_API_KEY=your_api_key
EMAIL_OCTOPUS_LIST_ID=your_list_id
EMAIL_OCTOPUS_WEBHOOK_SECRET=optional_secret

# App
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## Webhook Setup

You'll need to set up webhooks for each service to receive real-time updates:

### Stripe Webhook
- Endpoint: `https://your-domain.com/api/webhooks/stripe`
- Events to listen for:
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`

### Ticket Tailor Webhook
- Endpoint: `https://your-domain.com/api/webhooks/ticket-tailor`
- Events to listen for:
  - `ticket.created`
  - `ticket.purchased`
  - `order.completed`

### EmailOctopus Webhook
- Endpoint: `https://your-domain.com/api/webhooks/email-octopus`
- Events to listen for:
  - `subscribed`
  - `unsubscribed`
  - `email_bounced`
  - `email_complained`

## Testing in Sandbox Mode

All services support sandbox/test mode:
- **Stripe**: Use test mode with test card numbers (e.g., `4242 4242 4242 4242`)
- **Ticket Tailor**: Use their sandbox environment for testing
- **EmailOctopus**: Test with their free tier before upgrading
