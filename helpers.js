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
 * getUserByEmail - takes an email and returns the user if one matches it
 * @param {*} eMail - a string containing a possible users email address
 * @param {*} database - a database with user objects keyed by id
 *
 * returns - the user ID string of the matching user, or undefined
 */
const getUserByEmail = (eMail, database) => {
  for (const id in database) {
    if (database[id].email === eMail) {
      return id;
    }
  }
  return undefined;
};

/**
 * urlsForUser - retrieves the URLs owned by the user with the given ID
 * @param {*} id - a string used to identify a registered user
 * @param {*} database - database of all stored URLs
 *
 * return - an object containing the URLs belonging to the given user
 */
const urlsForUser = (id, database) => {
  const output = {};
  for (const url in database) {
    if (database[url].userID === id) {
      output[url] = database[url];
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

/**
 * getReadableDate - convertes a timestamp to readable format.
 * @param {*} timestamp - a timestamp to be converted to readable text.
 *
 * returns - date in readable string form
 */
const getReadableDate = (timestamp) => {
  const datetime = new Date(0);
  datetime.setUTCSeconds(timestamp);
  return `${datetime}`;
};

module.exports = {generateRandomString, getUserByEmail, urlsForUser, goToError, getReadableDate};