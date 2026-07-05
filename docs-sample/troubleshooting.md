# Troubleshooting

## Events not appearing in the dashboard

**Wait a moment.** Events are batched and typically appear within 15 seconds. The Live Events view has a 10-second refresh cycle.

**Check your API key.** An invalid or revoked key causes all events to be silently dropped at the server. Verify the key in **Settings → API Keys** and confirm it matches what you passed to `init`.

**Confirm the projectId.** If `projectId` does not match an existing project on your account, events are accepted but discarded. Each project has its own ID shown on the project settings page.

**Check for ad blockers.** Some browser extensions block requests to analytics domains. Test in an incognito window with extensions disabled.

---

## PulseNetworkError in the console

This error appears when all retry attempts fail. Common causes:

- The device has no internet connection at flush time. The SDK will retry on the next flush cycle.
- A corporate firewall blocks `api.pulse.example.com`. Allowlist that hostname on port 443.
- The Pulse API is experiencing an outage. Check the status page at status.pulse.example.com.

---

## "init called multiple times" warning

You called `Pulse.init` more than once. This usually happens when the initialization code runs in a component that re-renders (in React, for example). Move `Pulse.init` to the top-level entry file (e.g., `index.js` or `main.js`) outside of any component or function.

---

## High event volume causing slow page loads

If you are tracking a very high number of events (thousands per minute), increase `batchSize` and `flushInterval` to reduce the number of HTTP requests:

```js
Pulse.init({
  apiKey: '...',
  projectId: '...',
  batchSize: 200,
  flushInterval: 15000,
});
```

This batches up to 200 events and flushes every 15 seconds instead of the defaults.

---

## Events appearing with wrong userId

This happens when `identify` is called after the first `track` calls. Always call `identify` before tracking any events tied to a user. If the user is not yet known (anonymous visitor), track events without calling `identify` — Pulse will assign an anonymous ID automatically.

---

## Upgrading from SDK v1 to v2

The v2 SDK has two breaking changes:

1. **`Pulse.initialize` was renamed to `Pulse.init`.**
2. **The `endpoint` option was removed.** Region is now controlled by the `region` option (`'us'`, `'eu'`, or `'ap'`).

Replace any `Pulse.initialize({ endpoint: '...' })` calls with the new init signature. If you were using a custom endpoint for data residency, set the appropriate `region` instead.
