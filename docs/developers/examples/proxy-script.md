# Example Proxy Script

An example proxy script for use with the `QWEN_SANDBOX_PROXY_COMMAND` environment variable lives at:

**[`scripts/example-proxy.js`](../../../scripts/example-proxy.js)**

This script only allows `HTTPS` connections to `example.com` and `googleapis.com` on port 443, and declines all other requests.

## Usage

```bash
QWEN_SANDBOX_PROXY_COMMAND=scripts/example-proxy.js qwen --sandbox
```

Test from inside the sandbox shell:

```bash
curl https://example.com    # allowed
curl https://other.com      # blocked (403 Forbidden)
```

## Customisation

Edit `ALLOWED_DOMAINS` in `scripts/example-proxy.js` to whitelist additional domains for your environment.
