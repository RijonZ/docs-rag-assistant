# Getting Started

Welcome to **Pulse**, a real-time analytics API for web and mobile applications. This guide walks you through creating your account, installing the SDK, and sending your first event.

## Prerequisites

Before you begin, make sure you have:

- Node.js 18 or later (for the JavaScript SDK)
- A Pulse account — sign up at pulse.example.com
- Your Project API key (found in **Settings → API Keys**)

## Installation

Install the Pulse JavaScript SDK with npm or yarn:

```bash
npm install @pulse/sdk
# or
yarn add @pulse/sdk
```

The SDK is also available as a CDN script for browser-only projects:

```html
<script src="https://cdn.pulse.example.com/sdk/v2/pulse.min.js"></script>
```

## Initializing the SDK

Import and initialize Pulse at the top level of your application, before any other calls:

```js
import Pulse from '@pulse/sdk';

Pulse.init({
  apiKey: 'YOUR_API_KEY',
  projectId: 'YOUR_PROJECT_ID',
});
```

Call `init` only once per application lifecycle. Calling it multiple times will log a warning and ignore subsequent calls.

## Sending Your First Event

Once initialized, track an event with `Pulse.track`:

```js
Pulse.track('button_clicked', {
  button_id: 'signup-cta',
  page: '/home',
});
```

Events are batched and sent to the Pulse servers every 5 seconds, or immediately when the batch reaches 50 events.

## Verifying Your Setup

Log in to the Pulse dashboard and open the **Live Events** view. Within a few seconds you should see your test event appear. If it does not appear after 30 seconds, check:

1. Your API key is correct and active.
2. The `projectId` matches the project in your dashboard.
3. Your network does not block outbound HTTPS requests to `api.pulse.example.com`.

## Next Steps

- [Configuration](./configuration.md) — timeouts, retry behavior, data residency
- [API Reference](./api-reference.md) — full method signatures
- [Troubleshooting](./troubleshooting.md) — common errors and fixes
