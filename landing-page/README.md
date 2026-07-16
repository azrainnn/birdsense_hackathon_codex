# BirdSense landing page

A fresh TypeScript, Tailwind CSS, and shadcn-compatible Next.js landing page for BirdSense.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Structure

- `components/ui/scroll-expansion-hero.tsx` — reusable scroll-to-expand image/video hero.
- `app/page.tsx` — BirdSense landing page and its content sections.
- `components.json` — shadcn configuration, with `/components/ui` as the UI component path.

The hero uses remote Unsplash imagery configured in `next.config.ts`. Replace those URLs with project-owned imagery before production.
