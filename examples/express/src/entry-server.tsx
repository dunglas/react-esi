import { renderToString } from "react-dom/server";
import App from "./pages/App";

export const SSRRender = () => renderToString(<App />);
