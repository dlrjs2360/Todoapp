const express = require("express")
const app = express()
const MongoClient = require("mongodb").MongoClient

const methodOverride = require("method-override")
app.use(methodOverride("_method"))

// ejs를 사용하기 위한 초기 세팅
app.set("view engine", "ejs")

// css파일을 public폴더에 넣고 사용하는 세팅
app.use("/public", express.static("public"))

let db
MongoClient.connect(
  "mongodb+srv://dlrjs2360:ab3670@nodereact.ysaen.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  (err, client) => {
    if (err) return console.log(err)

    db = client.db("todoapp")

    app.listen(8080, () => {
      console.log("http://localhost:8080")
    })
  }
)

const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({ extended: true }))

app.get("/write", (req, res) => {
  res.render("write.ejs")
})

app.get("/", (req, res) => {
  // ejs파일은 res.render를 통해 사용한다
  res.render("index.ejs")
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

app.delete("/delete", (req, res, next) => {
  // DB에 저장된 id는 int형이므로 parseInt를 사용하여 바꿔줘야 한다
  req.body._id = parseInt(req.body._id)
  db.collection("post").deleteOne(req.body, (err, result) => {
    console.log("삭제 성공")
    res.status(200).send({ message: " 삭제성공 " })
  })
})

app.get("/detail/:id", (req, res, next) => {
  db.collection("post").findOne(
    // DB에 저장된 id는 int형이므로 parseInt를 사용하여 바꿔줘야 한다
    { _id: parseInt(req.params.id) },
    (err, result) => {
      // render는 두번째 인자를 이용해 데이터를 요청과 함께 보낼 수 있다
      res.render("detail.ejs", { selected: result })
      console.log(result)
    }
  )
})

app.get("/edit/:id", (req, res, next) => {
  db.collection("post").findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      console.log(result)
      res.render("edit.ejs", { selected: result })
    }
  )
})

app.put("/edit", (req, res, next) => {
  db.collection("post").updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    (err, result) => {
      if (err) console.log(err)
      console.log("수정완료")
      res.redirect("/list")
    }
  )
})
