import { createTheme } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: { main: "rgb(0, 30, 60)" },
  },
  typography: { fontFamily: ["Noto Sans"].join(",") },
});

export default theme;
