# React ESI: Blazing-fast Server-Side Rendering for React and Next.js

![CI status](https://github.com/github/docs/actions/workflows/test.yml/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/dunglas/react-esi/badge.svg?branch=master)](https://coveralls.io/github/dunglas/react-esi?branch=master)
[![npm version](https://badge.fury.io/js/react-esi.svg)](https://badge.fury.io/js/react-esi)
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

React ESI is a super powerful cache library for vanilla [React](https://reactjs.org/) and [Next.js](https://nextjs.org/) applications, that can make highly dynamic applications as fast as static sites.  

It provides a straightforward way to boost your application's performance by storing **fragments** of server-side rendered pages in **edge cache servers**.  
It means that after the first rendering, fragments of your pages will be served in a few milliseconds by servers close to your end users!  
It's a very efficient way to improve the performance and the SEO of your websites and to dramatically reduce both your hosting costs and the energy consumption of these applications. Help the planet, use React ESI!

Because it is built on top of the [Edge Side Includes (ESI)](https://www.w3.org/TR/esi-lang) W3C specification, 
React ESI natively supports most of the well-known cloud cache providers including [Cloudflare Workers](https://blog.cloudflare.com/edge-side-includes-with-cloudflare-workers/), [Akamai](https://www.akamai.com/us/en/support/esi.jsp) and [Fastly](https://docs.fastly.com/guides/performance-tuning/using-edge-side-includes).  
Of course, React ESI also supports the open source [Varnish cache server](https://varnish-cache.org/intro/index.html#intro) that you can use in your own infrastructure for free ([configuration example](https://github.com/zeit/next.js/blob/canary/examples/with-react-esi/docker/varnish/default.vcl)).

Also, React ESI allows to specify of different Time To Live (TTL) per React component and generating the corresponding HTML asynchronously using a secure (signed) URL.  
The cache server fetches and stores in the cache all the needed fragments (the HTML corresponding to every React component), builds the final page, and sends it to the browser.  
React ESI also allows components to (re-)render client-side without any specific configuration.

![ESI example](https://book.varnish-software.com/4.0/_images/esi.png)
> Schema from [The Varnish Book](https://book.varnish-software.com/4.0/chapters/Content_Composition.html)

**[Discover React ESI in depth with this presentation](https://dunglas.fr/2019/04/react-esi-blazing-fast-ssr/)**

## Examples

* [Next.js and Varnish example](https://github.com/zeit/next.js/pull/6225)

## Install

Using Yarn:

    $ yarn add react-esi

Or using NPM:

    $ npm install react-esi

## Usage

React ESI provides a convenient [Higher Order Component](https://reactjs.org/docs/higher-order-components.html) that will:
* replace the wrapped component by an ESI tag server-side (don't worry React ESI also provides the tooling to generate the corresponding fragment);
* render the wrapped component client-side, and feed it with the server-side computed props (if any).

React ESI automatically calls a `static async` method named `getInitialProps()` to populate the initial props of the component. Server-side, this method can access to the HTTP request and response, for instance, to set the `Cache-Control` header, or some [cache tags](https://api-platform.com/docs/core/performance/#enabling-the-built-in-http-cache-invalidation-system).

These props returned by `getInitialProps()` will also be injected in the server-side generated HTML (in a `<script>` tag).
Client-side the component will reuse the props coming from the server (the method will not be called a second time).
If the method hasn't been called server-side, then it will be called client-side the first time the component is mounted.

### The Higher Order Component

```javascript
// pages/App.jsx
import React from "react";
import withESI from "react-esi/lib/withESI";
import MyFragment from "../components/MyFragment";

const MyFragmentESI = withESI(MyFragment, "MyFragment");
// The second parameter is an unique ID identifying this fragment.
// If you use different instances of the same component, use a different ID per instance.

export const App = () => (
  <div>
    <h1>React ESI demo app</h1>
    <MyFragmentESI greeting="Hello!" />
  </div>
);
```

```javascript
// components/MyFragment.jsx
import React from "react";

export default class MyFragment extends React.Component {
  render() {
    return (
      <section>
        <h1>A fragment that can have its own TTL</h1>

        <div>{this.props.greeting /* access to the props as usual */}</div>
        <div>{this.props.dataFromAnAPI}</div>
      </section>
    );
  }

  static async getInitialProps({ props, res }) {
    return new Promise((resolve) => {
      if (res) {
        // Set a TTL for this fragment
        res.set("Cache-Control", "s-maxage=60, max-age=30");
      }

      // Simulate a delay (call to a remote service such as a web API)
      setTimeout(
        () =>
          resolve({
            ...props, // Props coming from index.js, passed through the internal URL
            dataFromAnAPI: "Hello there"
          }),
        2000
      );
    });
  }
}

```

The initial props **must** be serializable using `JSON.stringify()`. Beware `Map`, `Set` and `Symbol`!

Note: for convenience, `getInitialProps()` has the same signature than the Next.js one.
However, it's a totally independent and standalone implementation (you don't need Next.js to use it).

### Serving the Fragments

To serve the fragments, React ESI provides a ready to use controller compatible with [Express](https://expressjs.com/), you can find the full example [here](ttps://github.com/dunglas/react-esi/tree/main/examples/express)

```javascript
// server.jsx
import express from "express";
import { path, serveFragment } from "react-esi/lib/server";
import { renderToString } from "react-dom/server";
import { App } from "./pages/App";
import React from "react";

const port = Number.parseInt(process.env.PORT || "3000", 10);

const server = express();
server.use((req, res, next) => {
  // Send the Surrogate-Control header to announce ESI support to proxies (optional with Varnish, depending of your config)
  res.set("Surrogate-Control", 'content="ESI/1.0"');
  next();
});

server.get("/", (req, res) => {
  const app = renderToString(<App />);

  const html = `
      <html lang="en">
      <head>
          <script src="app.js" async defer></script>
      </head>
      <body>
          <div id="root">${app}</div>
      </body>
      </html>
  `;
  res.send(html);
});

// "path" default to /_fragment, change it using the REACT_ESI_PATH env var
server.get(path, (req, res) => {
  return serveFragment(
    req,
    res,
    // "fragmentID" is the second parameter passed to the "WithESI" HOC, the root component used for this fragment must be returned
    (fragmentID) => require(`./components/${fragmentID}`).default
  );
});

// ...
// Other Express routes come here

server.use(express.static("./dist"));

server.listen(port,  () => {
  console.log(`> Ready on http://localhost:${port}`);
});

```

Alternatively, here is a full example using [a Next.js server](https://github.com/dunglas/react-esi/tree/main/examples/next):

```javascript
// server.ts
import express from "express";
import next from "next";
import { parse } from "url";
import { path, serveFragment } from "react-esi/lib/server";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = express();

  server.use((req, res, next) => {
    // Send the Surrogate-Control header to announce ESI support to proxies (optional with Varnish)
    res.set("Surrogate-Control", 'content="ESI/1.0"');
    next();
  });

  server.get(path, (req, res) => {
    try {
      return serveFragment(req, res, (fragmentID) => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        return require(`./components/${fragmentID}`).default;
      });
    } catch (error) {
      res.status(500);
      res.send(error.message);
    }
  });

  server.get("*", (req, res) => {
    const parsedUrl = parse(req.url!, true);
    return handle(req, res, parsedUrl);
  }); // Next.js routes

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

## Features

* Support Varnish, Cloudflare Workers, Akamai, Fastly and any other cache systems having ESI support
* Written in TypeScript
* Next.js-friendly API

## Environment Variables

React ESI can be configured using environment variables:

* `REACT_ESI_SECRET`: a secret key used to sign the fragment URL (default to a random string, **it's highly recommended to set it to prevent problems when the server restart, or when using multiple servers**)
* `REACT_ESI_PATH`: the internal path used to generate the fragment, should not be exposed publicly (default: `/_fragment`)

## Passing Attributes to the `<esi:include>` Element

To pass attributes to the `<esi:include>` element generated by React ESI, pass a prop having the following structure to the HOC:

```javascript
{
  esi: {
    attrs: {
      alt: "Alternative text",
      onerror: "continue"
    }
  }
}
```

## Troubleshooting

### The Cache is Never Hit

By default, most cache proxies, [including Varnish](https://book.varnish-software.com/4.0/chapters/Content_Composition.html#cookies), never serve a response from the cache if the request contains a cookie.
If you test using `localhost` or a similar local domain, **clear all pre-existing cookies for this origin**.
If the cookies are expected (e.g.: Google Analytics or ad cookies), then you must configure properly your cache proxy to ignore them. [Here are some examples for Varnish](https://www.varnish-software.com/wiki/content/tutorials/varnish/sample_vclTemplate.html#cookie-manipulation).

## Design Considerations

To allow the client-side app to reuse the props fetched or computed server-side, React ESI injects `<script>` tags containing them in the ESI fragments.
After the assembling of the page by the cache server, these script tags end up mixed with the legit HTML.
These tags are automatically removed from the DOM before the rendering phase.

## Going Further

React ESI plays very well with advanced cache strategies including:

* Cache invalidation (purge) with cache tags ([Varnish](https://github.com/varnish/varnish-modules/blob/master/docs/vmod_xkey.rst) / [Cloudflare](https://blog.cloudflare.com/introducing-a-powerful-way-to-purge-cache-on-cloudflare-purge-by-cache-tag/))
* Warming the cache when data changes in the persistence layer ([Varnish](https://blog.theodo.fr/2015/11/auto-warm-up-varnish4-cache/))

Give them a try!

## Vue.js / Nuxt

We love Vue and Nuxt as much as React and Next, so we're currently porting React ESI for this platform.
Contact us if you want to help!

## Credits

Created by [Kévin Dunglas](https://dunglas.dev).
Sponsored by [Les-Tilleuls.coop](https://les-tilleuls.coop).
