import type { Request, Response } from "express";
import { createHmac, randomBytes } from "node:crypto";
import type { Transform } from "node:stream";
import { Readable } from "node:stream";
import type { ComponentType } from "react";
import React from "react";
import type { PipeableStream } from "react-dom/server";
import { renderToPipeableStream } from "react-dom/server";

export const path = process.env.REACT_ESI_PATH || "/_fragment";
const secret = process.env.REACT_ESI_SECRET || randomBytes(64).toString("hex");

/**
 * Signs the ESI URL with a secret key using the HMAC-SHA256 algorithm.
 */
function sign(url: URL) {
  const hmac = createHmac("sha256", secret);
  hmac.update(url.pathname + url.search);
  return hmac.digest("hex");
}

/**
 * Escapes ESI attributes.
 *
 * Adapted from https://stackoverflow.com/a/27979933/1352334 (hgoebl)
 */
function escapeAttr(attr: string): string {
  return attr.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

interface IEsiAttrs {
  src?: string;
  alt?: string;
  onerror?: string;
}

interface IEsiProps {
  attrs?: IEsiAttrs;
}

/**
 * Creates the <esi:include> tag.
 */
export const createIncludeElement = (
  fragmentID: string,
  props: object,
  esi: IEsiProps
) => {
  const esiAt = esi.attrs || {};

  const url = new URL(path, "http://example.com");
  url.searchParams.append("fragment", fragmentID);
  url.searchParams.append("props", JSON.stringify(props));
  url.searchParams.append("sign", sign(url));

  esiAt.src = url.pathname + url.search;
  let attrs = "";
  Object.entries(esiAt).forEach(
    ([key, value]) => (attrs += ` ${key}="${value ? escapeAttr(value) : ""}"`)
  );

  return `<esi:include${attrs} />`;
};

interface IServeFragmentOptions {
  pipeStream?: (stream: PipeableStream) => InstanceType<typeof Transform>;
}

type resolver<TProps = unknown> = (
  fragmentID: string,
  props: object,
  req: Request,
  res: Response
) => ComponentType<TProps>;

/**
 * Checks the signature, renders the given fragment as HTML and injects the initial props in a <script> tag.
 */
export async function serveFragment<TProps>(
  req: Request,
  res: Response,
  resolve: resolver<TProps>,
  options: IServeFragmentOptions = {}
) {
  const url = new URL(req.url, "http://example.com");
  const expectedSign = url.searchParams.get("sign");

  url.searchParams.delete("sign");
  if (sign(url) !== expectedSign) {
    res.status(400);
    res.send("Bad signature");
    return;
  }

  const rawProps = url.searchParams.get("props");
  const props = rawProps ? JSON.parse(rawProps) : {};

  const fragmentID = url.searchParams.get("fragment") || "";

  const Component = resolve(fragmentID, props, req, res);
  const { ...baseChildProps } = props;

  // TODO: add support for the new Next's getServerSideProps

  const childProps =
    "getInitialProps" in Component &&
    typeof Component.getInitialProps === "function"
      ? await Component.getInitialProps({
          props: baseChildProps,
          req,
          res
        })
      : baseChildProps;

  // Inject the initial props
  const encodedProps = JSON.stringify(childProps).replace(/</g, "\\u003c");

  // Remove the <script> class from the DOM to prevent breaking the React reconciliation algorithm
  const script =
    "<script>window.__REACT_ESI__ = window.__REACT_ESI__ || {}; window.__REACT_ESI__['" +
    fragmentID +
    "'] = " +
    encodedProps +
    ";document.currentScript.remove();</script>";
  const scriptStream = Readable.from(script);
  scriptStream.pipe(res, { end: false });

  const stream = renderToPipeableStream(<Component {...childProps} />);

  const lastStream = options.pipeStream ? options.pipeStream(stream) : stream;

  lastStream.pipe(res);
}
