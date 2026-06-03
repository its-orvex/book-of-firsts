# Our Book of Firsts 📖
Dilee & Ashley — Year One

---

## First-time setup

```bash
cd book-of-firsts-final
npm install
```

Create `.env.local`:
```
BLOB_READ_WRITE_TOKEN=your_token_here
```

Test locally:
```bash
npm run dev
```

Deploy:
```bash
vercel --prod
```

---

## Passwords
- **Ashley (read-only):** `ashleyndileeforever`
- **Builder (your editor):** `dileeonly`

---

## How to add photos

1. Copy your photos into the `public/photos/` folder on your computer
2. Name them anything — e.g. `first-date-1.jpg`, `japan-trip.jpg`
3. Open Claude Code and say: **"Push the photos to GitHub"**
4. Wait ~30 seconds for Vercel to redeploy
5. Open your builder → select a chapter → click **"+ Pick photos"**
6. Click the photos you want for that chapter (up to 5)
7. Click **Save Book** — Ashley sees it instantly

---

## How to add a new chapter

1. Open the builder → **Chapters** tab
2. Click **"+ Add Chapter"** at the bottom of the list
3. Fill in the title, date, notes and pick photos
4. Click **Save Book**

---

## How to reorder chapters

- Hover over any chapter in the list → use the **↑ ↓** arrows to move it
- Click **Save Book** when done

---

## How to edit your dedication message

1. Open the builder → click **✉ Message** tab
2. Edit the dedication (inside front cover) and back cover text
3. Click **Save Changes**

---

## Storage breakdown
- **Photos:** stored in GitHub repo (`public/photos/`) — free, no limits
- **Chapter data:** stored in Vercel Blob — just a small JSON file (~10KB)

