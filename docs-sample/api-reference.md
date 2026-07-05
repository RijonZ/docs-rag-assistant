# API Reference

## Pulse.init(options)

Initializes the SDK. Must be called before any other method.

**Parameters:** See [Configuration](./configuration.md) for the full options object.

**Returns:** `void`

**Throws:** `PulseConfigError` if `apiKey` or `projectId` is missing.

---

## Pulse.track(eventName, properties?)

Records a single event.

```ts
Pulse.track(eventName: string, properties?: Record<string, unknown>): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `eventName` | `string` | yes | Name of the event. Max 128 characters. Use snake_case by convention. |
| `properties` | `object` | no | Key-value pairs attached to the event. Values must be JSON-serializable. |

**Example:**

```js
Pulse.track('purchase_completed', {
  product_id: 'prod_abc123',
  amount: 49.99,
  currency: 'USD',
});
```

**Notes:**
- `eventName` is case-sensitive. `Page_View` and `page_view` are distinct events.
- Properties with `undefined` values are stripped before sending.
- Nested objects are supported up to 5 levels deep.

---

## Pulse.identify(userId, traits?)

Associates the current session with a known user.

```ts
Pulse.identify(userId: string, traits?: Record<string, unknown>): void
```

**Parameters:**

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `userId` | `string` | yes | Your application's unique ID for this user. |
| `traits` | `object` | no | User attributes (e.g. `email`, `plan`, `created_at`). |

**Example:**

```js
Pulse.identify('user_789', {
  email: 'alex@example.com',
  plan: 'pro',
  created_at: '2024-01-15',
});
```

After calling `identify`, all subsequent `track` calls include the `userId` automatically.

---

## Pulse.page(name?, properties?)

Records a page view.

```ts
Pulse.page(name?: string, properties?: Record<string, unknown>): void
```

If `name` is omitted, Pulse uses `document.title`. The following properties are captured automatically unless overridden: `url`, `path`, `referrer`, `title`.

**Example:**

```js
Pulse.page('Checkout', { step: 2 });
```

---

## Pulse.flush()

Immediately sends all queued events to Pulse servers.

```ts
Pulse.flush(): Promise<void>
```

**Returns:** A promise that resolves when the flush is complete.

Call this before page unload to avoid losing queued events:

```js
window.addEventListener('beforeunload', () => Pulse.flush());
```

---

## Pulse.reset()

Clears the current user identity and generates a new anonymous session ID. Use this when a user logs out.

```ts
Pulse.reset(): void
```

---

## Error Types

| Error | When thrown |
|-------|-------------|
| `PulseConfigError` | `init` called without `apiKey` or `projectId` |
| `PulseNetworkError` | All retries exhausted without a successful response |
| `PulseValidationError` | `eventName` exceeds 128 characters or contains invalid characters |

Errors are emitted on an `error` event you can subscribe to:

```js
Pulse.on('error', (err) => {
  console.error('Pulse error:', err.message);
});
```
