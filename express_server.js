// **************************
// *   ENVIRONMENT SETUP
// **************************

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieSession({
  name: 'session',
  secret: 's;dflj;odjfs;jf;osme;ofim;sioefmismer',

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
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
    password: (bcrypt.hashSync("xxx", 10))
  },
  "ghijkl": {
    id: "abcdef",
    email: "user2@example.com",
    password: (bcrypt.hashSync("yyy", 10))
  }
};

// **************************
// *       FUNCTIONS
// **************************

/**
 *generateRandomString - produces a random 6 character string
 *  @params - none
 *
 *  returns - string of 6 random alphabetic characters
 */
const generateRandomString = function() {
  let alph = "abcdefghijklmnopqrstuvwxyz";
  alph = alph.split('');
  let out = [];
  for (let i = 0; i < 6; i++) {
    out.push(alph[Math.floor(Math.random() * 26)]);
  }
  return out.join('');
};

/**
 * isAlreadyUser - takes an email and returns the user if one matches it
 * @param {*} eMail - a string containing a possible users email address
 *
 * returns - the user ID string of the matching user, or undefined
 */
const isAlreadyUser = (eMail) => {
  for (const id in users) {
    if (users[id].email === eMail) {
      return id;
    }
  }
  return undefined;
};

/**
 * urlsForUser - retrieves the URLs owned by the user with the given ID
 * @param {*} id - a string used to identify a registered user
 *
 * return - an object containing the URLs belonging to the given user
 */
const urlsForUser = (id) => {
  const output = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
};

/**
 * goToError - redirects the user to an error page with a cookie containing the error to be displayed
 * @param {*} req - an Express request object to set the cookie to
 * @param {*} res - an Express response object to set up the redirect
 * @param {*} errMsg - the error message to be displayed by the Error page
 *
 * returns - none
 */
const goToError = (req, res, errMsg) => {
  req.session.error = errMsg;
  res.redirect('/error');
  return;
};

// **************************
// *       GET ROUTES
// **************************

app.get("/", (req, res) => {
  if (req.session.userId) {
    res.redirect("/urls");
    return;
  }
  res.redirect("/login");
});

app.get("/error", (req, res) => {
  let errMsg = req.session.error;
  let userID = req.session.userID;
  req.session = null;
  let email;
  if (!errMsg) {
    res.redirect("/urls");
    return;
  }
  if (userID) {
    email = users[userID].email;
    req.session.userId = userID;
  }
  const templateVars = { email, errMsg };
  res.render("error", templateVars);
});

app.get("/login", (req, res) => {
  let email;
  if (req.session.userId) {
    email = users[req.session.userId].email;
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
  if (req.session.userId) {
    console.log("cookie in");
    email = users[req.session.userId].email;
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
  const user = req.session.userId;
  if (!user) {
    goToError(req, res, "Please Log In Or Register To List Your Saved URLs");
    return;
  }
  let email = users[user].email;
  let urls = urlsForUser(user);
  const templateVars = { email, urls };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const user = req.session.userId;
  if (!user) {
    goToError(req, res, "Please Log In Or Register To Add New URLs");
    return;
  }
  const email = users[user].email;
  const templateVars = { email };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const user = req.session.userId;
  if (!user) {
    goToError(req, res, 'Please Log In To Access Your Saved URLs');
    return;
  }

  const email = users[user].email;
  const urls = urlsForUser(user);
  const sURL = req.params.shortURL;
  
  if (!(sURL in urls)) {
    goToError(req, res, 'The Requested URL Is Not In Your List');
    return;
  }

  const templateVars = { email, shortURL: sURL, longURL: urlDatabase[sURL].longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL);

  if (urlDatabase[req.params.shortURL]) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    console.log(`"${longURL}"`);
    res.redirect(longURL);
    return;
  }
  goToError(req, res, '404: Short URL Not Found');
});

// **************************
// *       POST ROUTES
// **************************

app.post("/login", (req, res) => {
  //check for invalid input
  const {email, password} = req.body;
  if (!email || !password) {
    goToError(req, res, '400: Please fill in all fields.');
    return;
  }
  const id = isAlreadyUser(email);
  if (!id) {
    goToError(req, res, '403: Invalid Email or Password.');
    return;
  }
  if (!(bcrypt.compareSync(password, users[id].password))) {
    goToError(req, res, '403: Invalid Email or Password.');
    return;
  }

  //log the user in
  req.session.userId = id;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  //check for invalid input
  const {email, password} = req.body;
  if (!email || !password) {
    goToError(req, res, '400: Please fill in all fields.');
    return;
  }
  if (isAlreadyUser(email)) {
    goToError(req, res, '400: There is already a user with this email.');
    return;
  }

  //get a unique(unused) ID for the new user
  let id = generateRandomString();
  while (users[id]) {
    id = generateRandomString();
  }

  //create a new user and log them in
  users[id] = {id, email, password: (bcrypt.hashSync(password, 10))};
  req.session.userId = id;
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  //check that the user is logged in and a URL was provided
  const user = req.session.userId;
  if (!user) {
    goToError(req, res, '403: Please Log In Or Register To Add New URLs');
    return;
  }
  const lURL = req.body.longURL;
  if (!lURL) {
    goToError(req, res, '400: You Must Provide A URL');
    return;
  }

  //generate an unused small URL to ID the new URL
  let sURL = generateRandomString();
  while (urlDatabase[sURL]) {
    sURL = generateRandomString();
  }

  //store the new URL in the database and redirect to it's sub-page
  urlDatabase[sURL] = {longURL: lURL, userID: user};
  res.redirect(`/urls/${sURL}`);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  //check that the user is logged in and owns the URL
  const user = req.session.userId;
  const sURL = req.params.shortURL;
  if (user !== urlDatabase[sURL].userID) {
    goToError(req, res, '403: You Must Be Logged In And Own This URL To Delete It!');
    return;
  }

  //delete the URL and redirect to the users URL list
  delete urlDatabase[sURL];
  res.redirect('/urls');
});

app.post("/urls/:shortURL/edit", (req, res) => {
  //get the input, and check that it is valid.
  const user = req.session.userId;
  const sURL = req.params.shortURL;
  const lURL = req.body.longURL;
  if (user !== urlDatabase[sURL].userID) {
    goToError(req, res, '403: You Must Be Logged In And Own This URL To Edit It!');
    return;
  }
  if (!lURL) {
    goToError(req, res, '400: You Must Provide A URL To Change The Link');
    return;
  }

  //change the stored URL to the new one
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



