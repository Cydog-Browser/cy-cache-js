# Cydog Browser CyCache.js
This is a free-to-use javascript drop-in to secure your website. It adds a browser cache to an IndexedDB for every rendered webpage. Pages rendered less than 30 minutes ago are served as an encrypted cache that cannot be modified by the browser.

## Installation & Implementation
1. Download cycache.js
2. Add to web project (e.g., `/js/security/cycache.js`)
3. Include in your HTML **before any other scripts**:
```html
<head>
  <!-- Existing meta tags -->
  <script src="/js/security/cycache.js"></script>
</head>
```

## Core Protections
| Feature | Protection Level | Impact |
|---------|------------------|--------|
| **Encrypted Caching** | Critical | Prevents cache transit manipulation |
| **Cache Expiration** | High | Inhibits cache at rest attacks |
| **Navigation Interception** | High | Complicates navigation events |

## Implementation Notes
1. **Opt-out Mechanism**: 
  - Add `data-no-cache` attribute to links/forms to bypass cache interceptions
    - Example 1: `<a href="/about.html">About Us</a> <!-- Will be cached -->`
    - Example 2: `<a href="/secure-page.html" data-no-cache>Secure Page</a>`

## Performance Impact
- Minimal runtime overhead (< 2ms initialization)
- Zero ongoing CPU usage during idle
- Network latency only during certificate validation

## Security Considerations
1. **Key Management**: The encryption key is hardcoded to interface with our browser extensions. If using your own key, please make sure you:
   - Generate a custom 16-character key for AES-128 [here](https://acte.ltd/utils/randomkeyge)
   - Rotate keys periodically

2. **Sensitive Data**: Never cache pages containing sensitive information:
   - User profiles
   - Payment pages
   - Admin interfaces

3. **Cache Validation**: Add cache validation logic for dynamic content:
   ```javascript
   // Example validation logic
   if (url.includes('/dashboard')) {
       return null; // Never cache dashboard
   }
   ```

## Browser Compatibility
This solution works in modern browsers with:
- IndexedDB support
- Web Crypto API support
- Async/await support

## Important Notes
- This implementation intercepts navigation within the same origin only
- Form submissions are intercepted but not cached
- Always test before going live with this drop-in

> **Critical Note**: This script supplements but doesn't replace server-side security. Always implement backend caching mechanisms like OPcache and a Web Application Firewall (WAF).

## Contribute
Send me a pull request!

## See our terms & conditions
[Our terms & conditions](https://cydogbrowser.com/cyterms.html)

## Want to know more?
Visit [https://cydogbrowser.com](https://cydogbrowser.com/)
