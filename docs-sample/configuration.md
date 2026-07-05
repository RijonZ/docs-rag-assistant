# Configuration

The `Pulse.init` method accepts an options object that controls SDK behavior. All fields except `apiKey` and `projectId` are optional.

## Full Options Reference

```js
Pulse.init({
  apiKey: 'YOUR_API_KEY',          // required
  projectId: 'YOUR_PROJECT_ID',    // required
  region: 'us',                    // 'us' | 'eu' | 'ap' — default: 'us'
  batchSize: 50,                   // events per batch — default: 50, max: 200
  flushInterval: 5000,             // ms between automatic flushes — default: 5000
  retryCount: 3,                   // retries on network failure — default: 3
  debug: false,                    // log events to console — default: false
  sessionTracking: true,           // auto-track session start/end — default: true
  anonymize: false,                // strip IP and user agent — default: false
});
```

## Region

Set `region` to control where your data is processed and stored:

| Value | Location            |
|-------|---------------------|
| `us`  | United States (default) |
| `eu`  | European Union (Frankfurt) |
| `ap`  | Asia-Pacific (Singapore) |

Choosing `eu` ensures data never leaves the EU, which is required for GDPR compliance in many cases.

## Batching

Events are held in memory and flushed in two situations:

1. The batch reaches `batchSize` events.
2. `flushInterval` milliseconds have passed since the last flush.

Lower `flushInterval` values reduce data latency at the cost of more HTTP requests. For high-traffic applications, increase `batchSize` and `flushInterval` to reduce request volume.

To flush immediately (for example, before the page unloads), call:

```js
await Pulse.flush();
```

## Debug Mode

When `debug: true`, the SDK prints each event and each flush to the browser console:

```
[Pulse] track: button_clicked { button_id: 'signup-cta', page: '/home' }
[Pulse] flush: 1 events sent (200 OK)
```

Disable debug mode in production — it increases bundle overhead and can leak sensitive data to browser dev tools.

## Session Tracking

When `sessionTracking: true` (default), the SDK automatically fires:

- `session_start` — when `init` is called on a new session
- `session_end` — when the page is unloaded (`visibilitychange` or `beforeunload`)

Sessions expire after 30 minutes of inactivity. A new `session_start` fires when activity resumes.

To disable session tracking:

```js
Pulse.init({ apiKey: '...', projectId: '...', sessionTracking: false });
```

## Anonymization

Setting `anonymize: true` tells Pulse servers to discard the user's IP address and user-agent string before storing the event. The event payload itself is stored as-is — anonymization only affects transport-layer metadata.
