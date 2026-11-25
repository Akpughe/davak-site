# David Akpughe's portfolio

Astro portfolio at https://www.davak.site.

## Development

```sh
npm install
npm run dev -- --background
npm run astro -- dev status
npm run astro -- dev logs
npm run astro -- dev stop
npm run build
```

## Identity and search metadata

- `src/lib/site.ts` contains the biography, portrait, education, and official profile URLs. Set `completed` only for awarded qualifications.
- `src/layouts/Layout.astro` generates canonical URLs, social previews, and a linked JSON-LD graph for the person, portrait, website, organization, and page. The home and About pages use `ProfilePage`; write-ups use `TechArticle`.
- `astro.config.mjs` sets the production domain and generates the sitemap. Update the relevant `lastmod` date after meaningful page changes.
- `public/robots.txt` allows crawling and points to the sitemap.

## Google setup after deployment

These account steps remain manual; repository changes do not verify ownership or submit pages to Google.

1. Open [Google Search Console](https://search.google.com/search-console), add the Domain property `davak.site`, and verify ownership with the DNS TXT record Google provides at the domain's DNS provider.
2. Submit `https://www.davak.site/sitemap-index.xml` in the property's Sitemaps section.
3. Use URL Inspection on `https://www.davak.site/` and `https://www.davak.site/about/`. Run the live test and request indexing.
4. Check both URLs with [Google's Rich Results Test](https://search.google.com/test/rich-results) to validate the deployed profile markup.
5. Add `https://www.davak.site/` to your LinkedIn, GitHub, and Substack profiles, and keep their name and biography consistent with the site.
6. Monitor indexing in Search Console. If Google creates a Knowledge Panel for David Akpughe, use its “Claim this knowledge panel” option and follow [Google's verification process](https://support.google.com/knowledgepanel/answer/7534902?hl=en).

Structured data helps describe identity; it does not guarantee indexing, rankings, or a Knowledge Panel. See [Google's profile-page guidance](https://developers.google.com/search/docs/appearance/structured-data/profile-page) and [Knowledge Panel explanation](https://support.google.com/knowledgepanel/answer/9163198?hl=en).
