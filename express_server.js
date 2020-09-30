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
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "abcdef": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "ghijkl": {
    id: "user2RandomID",
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
      return true;
    }
  }
  return false;
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

app.get("/register", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const error = req.cookies.error;
  if (error) {
    res.clearCookie("error")
  }
  const templateVars = { user, error };
  if (user) {
    res.redirect("/urls");
    console.log("Customer already logged in.");
    return;
  }
  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user, urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// **************************
// *       POST ROUTES
// **************************

// *************************************
app.post("/login", (req, res) => {
  const username = req.body.username;
  res.cookie("username", username)
    .redirect('/urls');
});
// *************************************

app.post("/register", (req, res) => {
  const {username, email, password} = req.body;
  if (!username || !email || !password) {
    res.cookie("error", "Please fill in all fields.")
      .redirect("/register");
    return;
  }
  if (isAlreadyUser(email)) {
    res.cookie("error", "There is already a user with this email.")
      .redirect("/register");
    return;
  }
  // get a unique(unused) ID for the new user
  let id = generateRandomString();
  while (users[id]) {
    id = generateRandomString();
  }
  users[id] = {username, email, password};
  res.cookie("user_id", id)
    .redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id")
    .redirect('/urls');
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  while (urlDatabase[shortURL]) {
    shortURL = generateRandomString();
  }
  urlDatabase[shortURL] = req.body.longURL;
  console.log(`${shortURL}: ${req.body.longURL}`);
  res.redirect(`/urls/${shortURL}`);         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  const sURL = req.params.shortURL;
  delete urlDatabase[sURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  const sURL = req.params.shortURL;
  const lURL = req.body.longURL;
  urlDatabase[sURL] = lURL;
  
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



