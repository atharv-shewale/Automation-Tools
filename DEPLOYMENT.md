# Deployment Guide

This guide explains how to deploy your application so that the verification page works properly for everyone.

## 1. Hosting Requirements

Since this application stores verification data in a local file (`data/certificates.json`), you have two main options for deployment:

### Option A: VPS / Dedicated Server (Recommended)
Suitable for: DigitalOcean Droplet, AWS EC2, Linode, Hetzner, or a personal server.
- **Why?** Since you have full control, the `certificates.json` file will persist on the disk.
- **How?**
  1. Login to your server.
  2. Clone the repository.
  3. Install Node.js.
  4. Run `npm install` and then `npm run web` (or use PM2 to keep it running: `pm2 start server.js -- --web`).

### Option B: Platform with Persistent Storage
Suitable for: Render (with disk), Railway (with volume), Fly.io.
- **Why?** These platforms allow you to attach a "disk" or "volume" to your app so files aren't deleted when the app restarts.
- **How?** detailed in platform docs. You must mount the `./data` directory to a persistent volume.

> [!WARNING]
> **Avoid Serverless Platforms** (like Vercel, Netlify Functions, AWS Lambda) for the backend.
> These platforms are ephemeral, meaning they reset the file system frequently. Your `certificates.json` would be deleted, and verification links would stop working.

## 2. Configuration for Deployment

Once deployed, you must update your environment variables on the server.

### Critical Step: Update VERIFICATION_URL
In your production `.env` file (or platform environment variables settings), you must change `VERIFICATION_URL` to your actual public domain.

**Example:**
If your deployed site is `https://my-certificate-app.com`, then set:
```env
VERIFICATION_URL=https://my-certificate-app.com/verify/
```

This ensures that the QR codes generated on the certificates point to the correct, publicly accessible verification page.

## 3. Verification Checklist
After deployment:
1.  [ ] Checking that the `VERIFICATION_URL` is set to the public domain.
2.  [ ] Ensure the `data/` folder is writable and persistent.
3.  [ ] Test by generating a certificate and scanning the QR code with your phone (disconnected from WiFi to ensure it's public).
