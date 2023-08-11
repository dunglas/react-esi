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
