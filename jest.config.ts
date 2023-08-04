import type { Config } from "jest";

const commonConfig: Config = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"]
};

const config: Config = {
  projects: [
    {
      ...commonConfig,
      displayName: "server",
      testRegex: "/__tests__/server/.*\\.[jt]sx?$",
      testEnvironment: "node",
    },
    {
      ...commonConfig,
      displayName: "client",
      testRegex: "/__tests__/client/.*\\.[jt]sx?$",
      testEnvironment: "jsdom",
    }
  ]
};

export default config;
