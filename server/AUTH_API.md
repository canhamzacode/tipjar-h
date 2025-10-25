# Authentication API Documentation

## Overview

The TipJar API uses JWT (JSON Web Tokens) for authentication. After linking a Twitter account via OAuth, users receive an access token and refresh token.

- **Access Token**: Short-lived (15 minutes) - used for authenticated requests
- **Refresh Token**: Long-lived (7 days) - used to obtain new access tokens

## Environment Variables

Add these to your `.env` file:

```env
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here
SESSION_SECRET=your-session-secret-here
```

**⚠️ Important**: Change these in production! Never commit secrets to git.

---

## Authentication Flow

```
1. User clicks "Connect Twitter"
   ↓
2. GET /api/v1/auth/twitter
   Returns OAuth URL
   ↓
3. User authorizes on Twitter
   ↓
4. Twitter redirects to /api/v1/auth/twitter/callback
   Returns: { access_token, refresh_token, user }
   ↓
5. Client stores tokens (localStorage/secure cookie)
   ↓
6. Client includes token in subsequent requests:
   Header: Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Initiate Twitter OAuth

**GET** `/api/v1/auth/twitter`

Starts the Twitter OAuth flow.

**Response:**

```json
{
  "message": "Twitter Auth Initiated",
  "data": {
    "url": "https://twitter.com/i/oauth2/authorize?..."
  }
}
```

**Usage:**

```javascript
const response = await fetch("http://localhost:3000/api/v1/auth/twitter");
const { data } = await response.json();
// Redirect user to data.url
window.location.href = data.url;
```

---

### 2. OAuth Callback (Auto-handled)

**GET** `/api/v1/auth/twitter/callback?code=...&state=...`

Twitter redirects here after user authorizes. Returns JWT tokens.

**Response:**

```json
{
  "message": "Twitter account linked successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "twitter_handle": "john_doe",
      "name": "John Doe",
      "profile_image_url": "https://pbs.twimg.com/profile_images/..."
    },
    "reconciled_tips": 3
  }
}
```

**Client should:**

1. Store `access_token` and `refresh_token` securely
2. Use `access_token` for authenticated requests
3. Use `refresh_token` when access token expires

---

### 3. Get Current User Info

**GET** `/api/v1/auth/me`

**Protected** ✅ - Requires valid access token

Returns authenticated user's information.

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "User info retrieved successfully",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "twitter_id": "123456789",
      "twitter_handle": "john_doe",
      "name": "John Doe",
      "profile_image_url": "https://...",
      "description": "Web3 enthusiast",
      "wallet_address": "0x1234...",
      "wallet_type": "non-custodial",
      "created_at": "2025-10-25T10:30:00.000Z"
    }
  }
}
```

**Usage:**

```javascript
const response = await fetch("http://localhost:3000/api/v1/auth/me", {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
const { data } = await response.json();
console.log(data.user);
```

**Error Responses:**

```json
// 401 Unauthorized - No token or invalid token
{
  "message": "Authentication required"
}

// 401 Unauthorized - Token expired
{
  "message": "Invalid or expired token"
}

// 404 Not Found - User deleted
{
  "message": "User not found"
}
```

---

### 4. Refresh Access Token

**POST** `/api/v1/auth/refresh`

Get a new access token using refresh token (when access token expires).

**Request Body:**

```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Usage:**

```javascript
async function refreshToken(refreshToken) {
  const response = await fetch("http://localhost:3000/api/v1/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (response.ok) {
    const { data } = await response.json();
    // Store new tokens
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  }

  // Refresh token expired - re-authenticate
  throw new Error("Refresh token expired");
}
```

**Error Responses:**

```json
// 400 Bad Request
{
  "message": "Refresh token is required"
}

// 401 Unauthorized
{
  "message": "Invalid or expired refresh token"
}
```

**Best Practice:**

- Implement automatic token refresh when you receive 401 on protected routes
- Store refresh token securely (httpOnly cookie preferred over localStorage)

---

### 5. Logout

**POST** `/api/v1/auth/logout`

**Protected** ✅ - Requires valid access token

Logout user (client should delete tokens).

**Headers:**

```
Authorization: Bearer <access_token>
```

**Response:**

```json
{
  "message": "Logged out successfully"
}
```

**Usage:**

```javascript
async function logout(accessToken) {
  await fetch("http://localhost:3000/api/v1/auth/logout", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Clear tokens from storage
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");

  // Redirect to login
  window.location.href = "/login";
}
```

**Note:** With JWT, tokens can't be truly invalidated on the server side without a blacklist. The logout endpoint is mainly for logging purposes. Client MUST delete tokens.

**TODO for Production:**

- Implement token blacklist in Redis for immediate invalidation
- Add token revocation on password change or suspicious activity

---

## Frontend Integration Example

### React Hook for Authentication

```javascript
// useAuth.js
import { useState, useEffect } from "react";

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(
    localStorage.getItem("access_token"),
  );

  useEffect(() => {
    if (accessToken) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [accessToken]);

  async function fetchUser() {
    try {
      const response = await fetch("http://localhost:3000/api/v1/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.status === 401) {
        // Try to refresh token
        const refreshToken = localStorage.getItem("refresh_token");
        if (refreshToken) {
          const newToken = await refreshAccessToken(refreshToken);
          setAccessToken(newToken);
          return; // Will retry with new token via useEffect
        }
        // Refresh failed - logout
        logout();
        return;
      }

      const { data } = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error("Failed to fetch user:", error);
    } finally {
      setLoading(false);
    }
  }

  async function refreshAccessToken(refreshToken) {
    const response = await fetch("http://localhost:3000/api/v1/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) throw new Error("Refresh failed");

    const { data } = await response.json();
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    return data.access_token;
  }

  function login(tokens) {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    setAccessToken(tokens.access_token);
  }

  function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setUser(null);
  }

  return { user, loading, login, logout, accessToken };
}
```

---

## Error Handling

All endpoints return standard error format:

```json
{
  "message": "Error description",
  "errors": [] // Optional validation errors (from Zod)
}
```

**HTTP Status Codes:**

- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (CSRF, invalid state)
- `404` - Not Found
- `500` - Internal Server Error

---

## Security Best Practices

### For Frontend:

1. **Store tokens securely**
   - Prefer httpOnly cookies over localStorage (protects against XSS)
   - If using localStorage, implement Content Security Policy

2. **Implement token refresh**
   - Automatically refresh when access token expires
   - Don't wait for 401 - refresh proactively before expiry

3. **Handle logout properly**
   - Clear all tokens on logout
   - Clear tokens on 401 errors (session expired)

4. **HTTPS Only**
   - Never send tokens over HTTP in production

### For Backend (TODO):

1. **Token Blacklist**
   - Implement Redis-based token blacklist for logout
   - Blacklist tokens on password change

2. **Rate Limiting**
   - Add rate limiting to refresh endpoint (prevent brute force)

3. **Token Rotation**
   - Implement refresh token rotation (new refresh token on each use)

4. **Monitoring**
   - Log suspicious token activity
   - Alert on multiple failed auth attempts

---

## Testing with cURL

### 1. Start OAuth Flow

```bash
curl http://localhost:3000/api/v1/auth/twitter
```

### 2. After OAuth (you'll get tokens)

```bash
# Get user info
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/auth/me

# Refresh token
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"refresh_token":"YOUR_REFRESH_TOKEN"}' \
  http://localhost:3000/api/v1/auth/refresh

# Logout
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  http://localhost:3000/api/v1/auth/logout
```

---

## Token Payload Structure

### Access Token Payload

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "twitterId": "123456789",
  "twitterHandle": "john_doe",
  "iat": 1698234567,
  "exp": 1698235467
}
```

### Refresh Token Payload

```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "twitterId": "123456789",
  "twitterHandle": "john_doe",
  "iat": 1698234567,
  "exp": 1698839367
}
```

**Note:** Tokens are signed with HS256 algorithm.
