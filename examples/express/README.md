# Custom server example with Express, Varnish, and react-esi

This example demonstrates how to set up an [Express](https://expressjs.com/) server using TypeScript. Additionally, it introduces caching optimization with a [Varnish](https://varnish-cache.org/intro/) server and the `react-esi` library using `esi:include` tags.

The server entry point is `server.tsx` in development and `dist/server.js` in production.

## How to use

1. Clone this repository.
2. Navigate to the examples/express folder.
3. Use `docker compose up -d` to run the example.
