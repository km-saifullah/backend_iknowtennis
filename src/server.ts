import app from "./app";
import { dbConfig } from "./config/db";
import { serverPort } from "./config/index";

dbConfig();

app.listen(serverPort, () => console.log(`http://localhost:${serverPort}`));
