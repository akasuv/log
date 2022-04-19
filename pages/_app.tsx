import "../styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "@mui/material";
import theme from "../config/muiTheme";
import { MoralisProvider } from "react-moralis";

const serverUrl = "https://cjwf7tegnqec.usemoralis.com:2053/server";
const appId = "KahkrlG9E0xTxqs8mpNtnQbNBHukInZn8G3OYlGb";
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MoralisProvider serverUrl={serverUrl} appId={appId}>
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </MoralisProvider>
  );
}

export default MyApp;
