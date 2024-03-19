import express from "express";
import next from "next";
import { parse } from "url";
import { path, serveFragment } from "react-esi/lib/server";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const app = next({ dev, hostname, port });
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
      console.error({ error });

      res.status(500);
      res.send((error as Error).message);
    }
  });

  // Next.js routes
  server.get("*", async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);

      return handle(req, res, parsedUrl);
    } catch (error) {
      console.error("Error occurred handling", req.url, error);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

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
});
