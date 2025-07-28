import express from "express";

const app = express();

app.get("/", (req, res) => {
  res.send("<h1>Hello Express!</h1>");
});

app.listen(3000, () => {
  console.log("3000 포트에서 서버가 동작중입니다.");
});
