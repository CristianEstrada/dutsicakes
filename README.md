# Dutsicakes

A bakery storefront built with HTML, CSS, and JavaScript. The frontend combines product browsing, English/Spanish content, Snipcart checkout, and an external reviews API.

**Repository scope:** storefront source and product data. Payment processing is handled by Snipcart; the server-side reviews service is not included here.

## What is implemented

- Cookie and cupcake catalog with individual product JSON files.
- English/Spanish translations in `js/translations.js`.
- Product imagery, hero carousel, and review carousel.
- Snipcart integration and delivery-area information.
- Review data loaded from an external API.

## Run locally

No bundler or package installation is required for this static frontend. Serve the repository over HTTP so browser requests for JSON work:

```bash
git clone https://github.com/CristianEstrada/dutsicakes.git
cd dutsicakes
python3 -m http.server 8000
```

Open http://localhost:8000. Browse the catalog locally; checkout and review requests depend on their external services and configuration.

## Structure

```text
index.html           Storefront
about.html           Bakery information
reviews.html         Reviews page
products/*.json      Product records
js/                  UI behavior, translations, and checkout integration
assets/css/          Styles
assets/img/          Product and brand assets
```

## Integration boundaries

`js/snipcart.js` configures the browser-side Snipcart integration. Adapt that configuration for your own store before using this code elsewhere. The reviews API is called by the frontend; its backend implementation and deployment are maintained outside this repository.

## Maintenance

This repository preserves the storefront implementation. A new deployment should include manual checks of product data, translations, responsive layouts, checkout configuration, and reviews availability. Automated end-to-end checkout tests are not configured here.

Project author: [Cristian Estrada](https://github.com/CristianEstrada).
