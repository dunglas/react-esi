# Custom Server Example with TypeScript, Next, Varnish, and react-esi

This example showcases how you can use [TypeScript](https://typescriptlang.com) on both the server and client side. It demonstrates the integration of [Next.js](https://nextjs.org/) for universal application development. The integration of [Varnish](https://varnish-cache.org/intro/) server and the `react-esi` library provides robust caching capabilities using `esi:include` tags, enhancing your application's performance and scalability.

Server entry point is `server.ts` in development and `dist/server.js` in production.

## How to use

1. Clone this repository.
2. Navigate to the examples/next folder.
3. Use `docker compose up -d` to run the example.
