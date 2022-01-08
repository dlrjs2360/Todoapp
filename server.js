const express = require("express")
const app = express()
const MongoClient = require("mongodb").MongoClient

app.set("view engine", "ejs")

let db

MongoClient.connect(
  "mongodb+srv://dlrjs2360:ab3670@nodereact.ysaen.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  (err, client) => {
    if (err) return console.log(err)

    db = client.db("todoapp")

    app.listen(8080, () => {
      console.log("listening on 8080")
    })
  }
)

const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({ extended: true }))

app.get("/write", (req, res) => {
  res.sendFile(__dirname + "/write.html")
})

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

app.post("/add", (req, res, next) => {
  //add라는 포스트 요청을 하게되면
  db.collection("counter").findOne({ name: "게시물갯수" }, (err, result) => {
    //mongodb의 counter라는 콜렉션에서 name이 게시물 갯수인 것을 찾고 콜백함수를 실행한다.
    let totalnumber = result.totalPost
    //콜백함수는 err와 result 매개변수를 갖는다.
    db.collection("post").insertOne(
      //post콜렉션에 한가지를 추가한다.
      { _id: totalnumber + 1, 제목: req.body.title, 날짜: req.body.date },
      (err, result) => {
        console.log("저장완료")
        db.collection("counter").updateOne(
          { name: "게시물갯수" },
          { $inc: { totalPost: 1 } },
          function (err, result) {
            if (err) {
              return console.log(err)
            }
          }
        )
      }
    )
  })
})

app.get("/list", (req, res, next) => {
  db.collection("post")
    .find()
    .toArray((err, result) => {
      res.render("list.ejs", { posts: result })
    })
})
