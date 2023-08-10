import express from "express";
import next from "next";
import { parse } from "url";
import { path, serveFragment } from "react-esi/lib/server";

const port = parseInt(process.env.PORT || "3000", 10);
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
