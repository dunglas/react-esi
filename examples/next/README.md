# Custom server example with TypeScript, Next, Nodemon, Varnish, and react-esi

This example showcases how you can use [TypeScript](https://typescriptlang.com) on both the server and client side. It leverages [Nodemon](https://nodemon.io/) for live server code reloading without affecting the [Next.js](https://nextjs.org/) universal code. The integration of [Varnish](https://varnish-cache.org/intro/) server and the `react-esi` library provides robust caching capabilities using `esi:include` tags.

Server entry point is `server.ts` in development and `dist/server.js` in production.

## Deploy your own

Deploy the example using [Vercel](https://vercel.com) or preview live with [StackBlitz](https://stackblitz.com/github/dunglas/react-esi/tree/main/examples/next)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/dunglas/react-esi/tree/main/examples/next)

## How to use

1. Clone this repository.
2. Navigate to the examples/next folder.
3. Run `yarn install` to install the dependencies.
4. Use `docker compose` to run the example.
