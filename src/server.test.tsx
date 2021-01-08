import express from "express";
import React from "react";
import Stream from "stream";
import request from "supertest";

process.env.REACT_ESI_SECRET = "dummy";
process.env.REACT_ESI_PATH = "/_custom";
import { createIncludeElement, path, serveFragment } from "./server";

test("path", () => {
  expect(path).toBe("/_custom");
});

test("createIncludeElement", () => {
  const elem = createIncludeElement(
    "fragmentID",
    { name: "Kévin" },
    { attrs: { alt: `"'<&Alt>'"` } }
  );
  expect(elem).toMatchSnapshot();
});

const fragmentURL =
  "/_custom?fragment=fragmentID&props=%7B%22name%22%3A%22K%C3%A9vin%22%7D&sign=f7ddf06659aadbcba0cdad4c927ac5bf38167d714e1a15cad13115e7e9d21a9d";
test("serveFragment", async () => {
  const app = express();
  const resolver = (
    fragmentID: string,
    props: object,
    req: express.Request,
    res: express.Response
  ) => {
    expect(fragmentID).toBe("fragmentID");
    expect(props).toMatchObject({ name: "Kévin" });
    expect(req.header("user-agent")).toBe("test");
    expect(res).toBeDefined();

    return (p: { name: string }) => <div>Hello {p.name}</div>;
  };

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(fragmentURL)
    .set("user-agent", "test")
    .expect(200);
  expect(response.text).toMatchSnapshot();
});

test("serveFragment with pipeStream option", async () => {
  const app = express();
  const resolver = (
    fragmentID: string,
    props: object,
    req: express.Request,
    res: express.Response
  ) => {
    expect(fragmentID).toBe("fragmentID");
    expect(props).toMatchObject({ name: "Kévin" });
    expect(req.header("user-agent")).toBe("test");
    expect(res).toBeDefined();

    return (p: { name: string }) => <div>Hello {p.name}</div>;
  };

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver, {
      pipeStream: (input) => {
        const transformer = new Stream.Transform({
          transform: (chunk, encoding, callback) => {
            callback(undefined, "<div>hi there</div>");
          },
        });
        input.pipe(transformer);
        return transformer;
      },
    })
  );

  const response: any = await request(app)
    .get(fragmentURL)
    .set("user-agent", "test")
    .expect(200);
  const addedScript = "<script>window.__REACT_ESI__ = window.__REACT_ESI__ || {}; window.__REACT_ESI__['fragmentID'] = {\"name\":\"Kévin\"};document.currentScript.remove();</script>";
  expect(response.text).toEqual(`${addedScript}<div>hi there</div>`);
});

test("initial props", async () => {
  const app = express();
  const resolver = (
    fragmentID: string,
    props: object,
    req: express.Request,
    res: express.Response
  ) => {
    expect(fragmentID).toBe("fragmentID");
    expect(props).toMatchObject({ name: "Kévin" });
    expect(req.header("user-agent")).toBe("test");
    expect(res).toBeDefined();

    interface IPropsType {
      name: string;
    }
    const Component = (p: IPropsType) => <div>Hello {p.name}</div>;
    Component.getInitialProps = async () => {
      return { name: "Anne" };
    };

    return Component;
  };

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(fragmentURL)
    .set("user-agent", "test")
    .expect(200);
  expect(response.text).toMatchSnapshot();
});

test("invalid signature", async () => {
  const app = express();
  const resolver = () => () => <div />;

  app.get(path, (req: express.Request, res: express.Response) =>
    serveFragment(req, res, resolver)
  );

  const response: any = await request(app)
    .get(
      "/_custom?fragment=fragmentID&props=%7B%22foo%22%3A%22bar%22%7D&sign=invalid"
    )
    .expect(400);
  expect(response.text).toMatchSnapshot();
});
