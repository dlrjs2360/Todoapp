const express = require("express")
const app = express()
const MongoClient = require("mongodb").MongoClient

const methodOverride = require("method-override")

const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const session = require("express-session")

// 미들웨어 : 요청과 응답 중간에 실행되는 코드
app.use(methodOverride("_method"))
app.use(session({ secret: "비밀코드", resave: true, saveUninitialized: false }))
app.use(passport.initialize())
app.use(passport.session())
// css파일을 public폴더에 넣고 사용하는 세팅
app.use("/public", express.static("public"))

// ejs를 사용하기 위한 초기 세팅
app.set("view engine", "ejs")

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
  //글의 id 파라미터를 기준으로 edit페이지 설정
  db.collection("post").findOne(
    //받아온 id를 parseInt를 이용해 int화 시키고 DB에서 매칭시킨다.
    { _id: parseInt(req.params.id) },
    (err, result) => {
      console.log(result)
      //매칭시킨 결과는 콜백함수 내에 인자로 받아올 수 있다.
      res.render("edit.ejs", { selected: result })
      // ejs파일을 rendering하며 함께 데이터를 전송할 수 있다.
    }
  )
})

app.put("/edit", (req, res, next) => {
  // edit페이지에서 작성한 글들을 post하는 API설정
  db.collection("post").updateOne(
    //DB의 값을 수정하기 위해서는 update메서드를 사용한다.
    { _id: parseInt(req.body.id) },
    { $set: { 제목: req.body.title, 날짜: req.body.date } },
    // 바꿀 때는 $set을 사용한다. -> 증가시키는 것은 $inc
    (err, result) => {
      if (err) console.log(err)
      console.log("수정완료")
      res.redirect("/list")
      // 수정이 완료되면 list페이지로 돌아간다.
    }
  )
})

app.get("/login", (req, res, next) => {
  res.render("login.ejs")
})

//세션을 이용한 로그인 기능 구현
passport.use(
  new LocalStrategy(
    {
      usernameField: "id",
      passwordField: "pw",
      session: true,
      passReqToCallback: false,
    },
    function (id, pw, done) {
      //console.log(id, pw);
      db.collection("login").findOne({ id: id }, function (err, result) {
        if (err) return done(err)
        if (!result)
          return done(null, false, { message: "존재하지않는 아이디요" })
        if (pw == result.pw) {
          return done(null, result)
        } else {
          return done(null, false, { message: "비번틀렸어요" })
        }
      })
    }
  )
)
passport.serializeUser((user, done) => {
  done(null, user.id)
})
passport.deserializeUser((id, done) => {
  done(null, {})
})

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/fail",
  }),
  (req, res, next) => {
    res.redirect("/")
  }
)

app.get("/mypage", islogin, (req, res, next) => {
  res.render("mypage.ejs")
})

//로그인되면 res.user가 존재한다는 것을 이용
function islogin(req, res, next) {
  if (res.user) {
    next()
  } else {
    res.send("로그인하지 않았습니다")
  }
}
