const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");

// **************************
// *       DATA
// **************************
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "abcdef" },
  smxqxK: { longURL: "http://www.google.com", userID: "abcdef" },
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ghijkl" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "ghijkl" }
};

const users = {
  "abcdef": {
    id: "abcdef",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "ghijkl": {
    id: "abcdef",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

// **************************
// *       FUNCTIONS
// **************************

const generateRandomString = function() {
  let alph = "abcdefghijklmnopqrstuvwxyz";
  alph = alph.split('');
  let out = [];
  for (let i = 0; i < 6; i++) {
    out.push(alph[Math.floor(Math.random() * 26)]);
  }
  return out.join('');
};

const isAlreadyUser = (eMail) => {
  for (const id in users) {
    if (users[id].email === eMail) {
      return id;
    }
  }
  return undefined;
};

// **************************
// *       GET ROUTES
// **************************

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/login", (req, res) => {
  let email;
  if (req.cookies["user_id"]) {
    email = users[req.cookies["user_id"]].email;
  }
  const templateVars = { email };
  if (email) {
    res.redirect("/urls");
    console.log("Customer already logged in.");
    return;
  }
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  let email;
  if (req.cookies["user_id"]) {
    email = users[req.cookies["user_id"]].email;
  }
  const templateVars = { email };
  if (email) {
    res.redirect("/urls");
    console.log("Customer already logged in.");
    return;
  }
  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  let email;
  if (user) {
    email = users[user].email;
  }
  const templateVars = { user, email, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let email;
  if (req.cookies["user_id"]) {
    email = users[req.cookies["user_id"]].email;
  }
  const templateVars = { email };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  let email;
  let correctUser = false;
  const sURL = req.params.shortURL;
  if (req.cookies["user_id"]) {
    email = users[req.cookies["user_id"]].email;
    if (req.cookies["user_id"] === urlDatabase[sURL].userID) {
      correctUser = true;
    }
  }
  const templateVars = { email, correctUser, shortURL: sURL, longURL: urlDatabase[sURL].longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
    return;
  }
  res.status(404).send('Short URL Not Found');
});

// **************************
// *       POST ROUTES
// **************************

app.post("/login", (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400).send('Please fill in all fields.');
    return;
  }
  const id = isAlreadyUser(email);
  if (!id) {
    res.status(403).send('Invalid Email or Password');
    return;
  }
  if (users[id].password !== password) {
    res.status(403).send('Invalid Email or Password');
    return;
  }
  
  res.cookie("user_id", id)
    .redirect('/urls');
});

app.post("/register", (req, res) => {
  const {email, password} = req.body;
  if (!email || !password) {
    res.status(400).send('Please fill in all fields.');
    return;
  }
  if (isAlreadyUser(email)) {
    res.status(400).send('There is already a user with this email.');
    return;
  }
  // get a unique(unused) ID for the new user
  let id = generateRandomString();
  while (users[id]) {
    id = generateRandomString();
  }
  users[id] = {id, email, password};
  res.cookie("user_id", id)
    .redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
    .redirect('/urls');
});

app.post("/urls", (req, res) => {
  const user = req.cookies["user_id"];
  if (!user) {
    res.status(403).send('You Must Be Logged In To Add URLs');
    return;
  }
  const lURL = req.body.longURL;
  if (!lURL) {
    res.status(400).send('You Must Provide A URL');
    return;
  }
  let sURL = generateRandomString();
  while (urlDatabase[sURL]) {
    sURL = generateRandomString();
  }
  urlDatabase[sURL] = {longURL: lURL, userID: user};
  console.log(`${sURL}: ${lURL}`);
  res.redirect(`/urls/${sURL}`);         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const user = req.cookies["user_id"];
  const sURL = req.params.shortURL;
  if (user !== urlDatabase[sURL].userID) {
    res.status(403).send('You Must Be Logged In And Own This URL To Delete It!');
    return;
  }
  delete urlDatabase[sURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const user = req.cookies["user_id"];
  const sURL = req.params.shortURL;
  const lURL = req.body.longURL;
  if (user !== urlDatabase[sURL].userID) {
    res.status(403).send('You Must Be Logged In And Own This URL To Edit It!');
    return;
  }
  if (!lURL) {
    res.status(400).send('You Must Provide A URL To Change The Link');
  }
  urlDatabase[sURL].longURL = lURL;
  
  res.redirect(`/urls/${sURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const sURL = req.params.shortURL;
  res.redirect(`/urls/${sURL}`);
});

// **************************
// *       LISTENERS
// **************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



