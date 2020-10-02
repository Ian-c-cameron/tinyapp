const { assert } = require('chai');

const { getUserByEmail, urlsForUser, getReadableDate } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const date = getReadableDate(Date.now());

const urlDatabase = {
  b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "abcdef" , stats: {visitors: [], visits: [], created: date}},
  smxqxK: { longURL: "http://www.google.com", userID: "abcdef", stats: {visitors: [], visits: [], created: date}},
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "ghijkl", stats: {visitors: [], visits: [], created: date}},
  i3BoGr: { longURL: "https://www.google.ca", userID: "ghijkl", stats: {visitors: [], visits: [], created: date}}
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });
  it('should return undefined with an invalid email', function() {
    const user = getUserByEmail("nouser@example.com", testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});
describe('urlsForUser', function() {
  it('should return an object with only the given users URLs', function() {
    const actualOutput = urlsForUser("abcdef", urlDatabase);
    const expectedOutput = {
      b2xVn2: { longURL: "http://www.lighthouselabs.ca", userID: "abcdef" , stats: {visitors: [], visits: [], created: date}},
      smxqxK: { longURL: "http://www.google.com", userID: "abcdef", stats: {visitors: [], visits: [], created: date}}
    };
    assert.deepEqual(actualOutput, expectedOutput);
  });
  it('should return an empty object if the user has no URLs', function() {
    const actualOutput = urlsForUser("aaaaaa", urlDatabase);
    const expectedOutput = {};
    assert.deepEqual(actualOutput, expectedOutput);
  });
});
