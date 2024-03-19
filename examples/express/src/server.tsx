import express from "express";
import { join } from "node:path";
import { path, serveFragment } from "react-esi/lib/server";
import { SSRRender } from "./entry-server";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const server = express();
const app = SSRRender();

server.use((req, res, next) => {
  // Send the Surrogate-Control header to announce ESI support to proxies
  // (optional with Varnish, depending of your config)
  res.set("Surrogate-Control", 'content="ESI/1.0"');
  next();
});

server.get("/", (req, res) => {
  const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <script src="/entry-client.js" type="module"></script>
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
    // "fragmentID" is the second parameter passed to the "WithESI" HOC,
    // the root component used for this fragment must be returned
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    (fragmentID) => require(`./components/${fragmentID}`).default
  );
});

// ...
// Other Express routes come here

server.use(express.static(join(__dirname, "../dist")));

server
  .listen(port, () => {
    console.log(
      `> Server listening at http://localhost:${port} as ${
        dev ? "development" : process.env.NODE_ENV
      }`
    );
  })
  .once("error", (err) => {
    console.error(err);
    process.exit(1);
  });
