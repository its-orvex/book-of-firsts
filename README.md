# Our Book of Firsts 📖

A private digital book documenting Dilee & Ashley's first year together.

## Setup

```bash
npm install
```

## Environment Variables

Create a `.env.local` file:

```
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here
```

Get your token: vercel.com → your project → Storage → Create Blob Store → copy `BLOB_READ_WRITE_TOKEN`

Photos are linked from Google Photos — no photo storage needed on Vercel.

## Passwords

- **Ashley's password**: `ashleyndileeforever`
- **Builder password**: `dileeonly`

## Deploy to Vercel

```bash
npm install
vercel
```

Then in Vercel dashboard → Settings → Environment Variables → add `BLOB_READ_WRITE_TOKEN`.

## How to Add Photos (Google Photos)

1. Open a photo in Google Photos on desktop
2. Right-click the image → **Open image in new tab**
3. Copy the URL from the address bar (starts with `lh3.googleusercontent.com`)
4. Go to your builder → select a chapter → paste the URL → click Add
5. Click **Save Book** when done
