const express = require("express")
const app = express()

const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({ extended: true }))

app.listen(8080, () => {
  console.log("listening on 8080")
})

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html")
})

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.post("/add", (req, res, next) => {
  res.send("전송완료")
  console.log(req.body.title)
  console.log(req.body.date)
})
