// **************************
// *   ENVIRONMENT SETUP
// **************************

const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');
const methodOverride = require('method-override');
const bcrypt = require('bcrypt');
const app = express();
const PORT = 8080; // default port 8080
const { generateRandomString, getUserByEmail, urlsForUser, goToError, getReadableDate } = require('./helpers');

app.use(cookieSession({
  name: 'session',
  secret: 's;dflj;odjfs;jf;osme;ofim;sioefmismer',

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));





// **************************
// *       DATA
// **************************
const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "abcdef" , stats: {visitors: [], visits: [], created: getReadableDate(Date.now())}},
  smxqxK: { longURL: "http://www.google.com", userID: "abcdef", stats: {visitors: [], visits: [], created: getReadableDate(Date.now())}},
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ghijkl", stats: {visitors: [], visits: [], created: getReadableDate(Date.now())}},
  i3BoGr: { longURL: "https://www.google.ca", userID: "ghijkl", stats: {visitors: [], visits: [], created: getReadableDate(Date.now())}}
};
const visitors = [];

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
  //read the userID and error, then clear the cookies
  let errMsg = req.session.error;
  let userID = req.session.userID;
  req.session = null;
  let email;
  //if the user was logged in reset that cookie
  if (userID) {
    email = users[userID].email;
    req.session.userId = userID;//reset the cookie
  }

  if (!errMsg) {
    res.redirect("/urls");
    return;
  }
  //render the error page
  const templateVars = { email, errMsg };
  res.render("error", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.userId) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { email: undefined };
  res.render("login", templateVars);
});

app.get("/register", (req, res) => {
  if (req.session.userId) {
    res.redirect("/urls");
    return;
  }
  const templateVars = { email: undefined };
  res.render("register", templateVars);
});

app.get("/urls", (req, res) => {
  const user = req.session.userId;
  if (!user) {
    goToError(req, res, "Please Log In Or Register To List Your Saved URLs");
    return;
  }
  let email = users[user].email;
  let urls = urlsForUser(user, urlDatabase);
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
  const urls = urlsForUser(user, urlDatabase);
  const sURL = req.params.shortURL;
  
  if (!(sURL in urls)) {
    goToError(req, res, 'The Requested URL Is Not In Your List');
    return;
  }
  const lURL = urlDatabase[sURL].longURL;
  const stats = urlDatabase[sURL].stats;
  const numVisits = stats.visits.length;
  const numVisitors = stats.visitors.length;
  const visits = stats.visits;
  const date = stats.created;

  const templateVars = { email, date, numVisits, numVisitors, visits, shortURL: sURL, longURL: lURL};
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  const sURL = req.params.shortURL;
  //check that the shortURL is valid
  if (urlDatabase[sURL]) {
    let visitor = req.session.visitor;
    if (!visitor) {
      //get a unique(unused) ID for the new visitor
      visitor = generateRandomString();
      while (visitors.includes(visitor)) {
        visitor = generateRandomString();
      }
      visitors.push(visitor);
      req.session.visitor = visitor;
    }
    let visit = [visitor, Date.now()];
    let stats = urlDatabase[sURL].stats;
    
    stats.visits.push(visit);
    if (!stats.visitors.includes(visitor)) {
      stats.visitors.push(visitor);
    }
    const longURL = urlDatabase[sURL].longURL;
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
  const id = getUserByEmail(email, users);
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
  if (getUserByEmail(email, users)) {
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
  urlDatabase[sURL] = {longURL: lURL, userID: user, stats: {visitors: [], visits: [], created: getReadableDate(Date.now())}};
  res.redirect(`/urls/${sURL}`);
});

app.post("/urls/:shortURL", (req, res) => {
  const sURL = req.params.shortURL;
  res.redirect(`/urls/${sURL}`);
});

// **************************
// *       PUT ROUTE
// **************************

app.put("/urls/:shortURL", (req, res) => {
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

// **************************
// *       DELETE ROUTE
// **************************

app.delete("/urls/:shortURL", (req, res) => {
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

// **************************
// *       LISTENERS
// **************************

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});



