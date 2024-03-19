import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/entry-client.tsx"],
  outfile: "dist/entry-client.js",
  define: {
    "process.env.NODE_ENV": '"production"',
  },
  target: ["es6"],
  bundle: true,
  treeShaking: true,
  minify: true,
  keepNames: true,
});
