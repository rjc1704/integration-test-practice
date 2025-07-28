import express from "express";
import "dotenv/config";

const app = express();

app.get("/", (req, res) => {
  res.send(`<h1>Hi Express! DB_HOST: ${process.env.DB_HOST} </h1>`);
});

app.listen(3000, () => {
  console.log("3000 포트에서 서버가 동작중입니다.");
});
