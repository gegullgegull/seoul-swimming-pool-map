# Seoul Swim Map

Seoul Swim Map is a static web app that shows public pools and Hangang pools on a map and in a list.

## Files

- `index.html`: page structure
- `styles.css`: styling
- `app.js`: Kakao Maps loading, filters, list and marker sync
- `pools.js`: pool data
- `config.js`: Kakao JavaScript key

## Run Locally

1. Get a JavaScript key from Kakao Developers.
2. Put it in `config.js`.

```js
window.KAKAO_JAVASCRIPT_KEY = "YOUR_KAKAO_JAVASCRIPT_KEY";
```

3. Open the site through a local server.

Example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. In the repository settings, open `Pages`.
3. Set the source to `GitHub Actions`.
4. Push to `main` or run the `Deploy to GitHub Pages` workflow manually.
5. After deployment, open the Pages URL shown by GitHub Actions.

Important: add the final Pages URL to Kakao Developers as a `JavaScript SDK domain`, because the map script will only load from registered origins.

## Data

Edit the `window.SWIM_POOLS` array in `pools.js`. The map markers and the list update together.

Example item:

```js
{
  id: "unique-id",
  name: "Pool name",
  district: "District",
  address: "Address",
  lat: 37.0,
  lng: 127.0,
  tags: ["public", "indoor"],
  hours: "Hours",
  price: "Price note",
  note: "Extra note",
  source: "Source note"
}
```

## Deploy

- GitHub Pages: works as-is for static hosting
- Netlify / Vercel: connect the repository and deploy as a static site
