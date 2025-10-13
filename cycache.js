// cycache.js - Cydog Browser Web Security Script
// https://github.com/Cydog-Browser/cy-cache-js/
// Protects against repeatedly refresed content and browser attacks by complicating rendering and event navigation.

// Encryption key management
const ENCRYPTION_KEY = 'q7aHtbBnUyeqZJlQ'; // 16-character key for AES-128 
// replace with your own key or use this universal key for future cross-decrypting capabilities with our browser extensions
            
// Database setup
const DB_NAME = 'CydogCacheDB';
const STORE_NAME = 'CydogCacheCacheStore';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

// Initialize database
let db;
const initDB = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'url' });
        }
    };
    
    request.onsuccess = (event) => {
        db = event.target.result;
        resolve(db);
        try{
          getCachedPage(window.location.href);
        } catch {
          window.onload = function() {
            const contentCache = document.documentElement.outerHTML;
            cachePage(window.location.href, contentCache);
          };
        }
    };
    
    request.onerror = (event) => {
        reject('IndexedDB error: ' + event.target.error);
    };
});

// Encryption/Decryption functions
async function encryptData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(ENCRYPTION_KEY),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );
    
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        dataBuffer
    );
    
    return {
        iv: Array.from(iv),
        encrypted: Array.from(new Uint8Array(encrypted))
    };
}

async function decryptData(encryptedData) {
    const { iv, encrypted } = encryptedData;
    const ivBuffer = new Uint8Array(iv).buffer;
    const encryptedBuffer = new Uint8Array(encrypted).buffer;
    
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(ENCRYPTION_KEY),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );
    
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuffer },
        key,
        encryptedBuffer
    );
    
    return new TextDecoder().decode(decrypted);
}

// Cache management functions
async function cachePage(url, content) {
    try {
        await initDB;
        const encrypted = await encryptData(content);
        const transaction = db.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        store.put({
            url,
            content: encrypted,
            timestamp: Date.now()
        });
    } catch (error) {
        console.error('Caching error:', error);
    }
}

async function getCachedPage(url) {
    try {
        await initDB;
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(url);
        
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                if (request.result) {
                    // Check cache expiration
                    const age = Date.now() - request.result.timestamp;
                    if (age < CACHE_DURATION) {
                        resolve(request.result);
                        console.info("Cydog served page with cy-cache.js.");
                    } else {
                        // Cache expired
                        resolve(null);
                        window.onload = function() {
                          const contentCache = document.documentElement.outerHTML;
                          cachePage(window.location.href, contentCache);
                        };
                    }
                } else {
                    // No result
                    resolve(null);
                    window.onload = function() {
                      const contentCache = document.documentElement.outerHTML;
                      cachePage(window.location.href, contentCache);
                    };
                }
            };
            request.onerror = () => reject(request.error);
        });
    } catch (error) {
        console.error('Cydog had problem retrieving cache with error:', error);
        return null;
    }
}

// Navigation interception
document.addEventListener('click', async (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    
    const url = link.href;
    if (url.startsWith('http') || url.startsWith(window.location.origin) || url.endsWith(".php")) {
        return; // Internal or external protocol specified web links are filtered
    }
    
    // Check for no-cache attribute
    if (link.hasAttribute('data-no-cache')) {
        return;
    }

    event.preventDefault();
    
    // Check cache
    const cached = await getCachedPage(url);
    if (cached) {
        const decryptedContent = await decryptData(cached.content);
        document.open();
        document.write(decryptedContent);
        document.close();
        setURLState(url);
        console.info("Cydog served page with cy-cache.js.");
    } else {
        // Fetch and cache
        try {
            const response = await fetch(url);
            const html = await response.text();
            // Cache the page
            await cachePage(url, html);
            document.open();
            document.write(html);
            document.close();
            setURLState(url);
            console.info("Cydog served page with cy-cache.js.");
        } catch (error) {
            console.error('Cydog had problem fetching with error:', error);
            window.location.href = url;
        }
    }
});

// Form submission interception
document.addEventListener('submit', (event) => {
    const form = event.target;
    
    // Check for no-cache attribute
    if (form.hasAttribute('data-no-cache')) {
        return; // Allow default form submission
    }
    
    event.preventDefault();
    
    // Handle form submission normally
    const formData = new FormData(form);
    fetch(form.action, {
        method: form.method,
        body: formData
    })
    .then(response => response.text())
    .then(html => {
        document.open();
        document.write(html);
        document.close();
    })
    .catch(error => {
        console.error('Cydog had problem submitting form with error:', error);
        window.location.reload();
    });
});

function setURLState(url){
    const newState = { page: 'cydog-cache', pageId: Math.random() };
	history.pushState(newState, document.title, url);
}
