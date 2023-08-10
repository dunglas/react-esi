export interface IWebpackProcess extends NodeJS.Process {
  browser?: boolean;
}

export type GlobalProcess = typeof globalThis & {
  process: IWebpackProcess;
  __REACT_ESI__: { [s: string]: object };
};
