const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const dbpath = path.join(__dirname, "userData.db");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
let db = null;
const connectAndserver = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running");
    });
  } catch (e) {
    console.log(`db error:${e.message}`);
    process.exit(1);
  }
};

connectAndserver();

app.post("/register/", async (request, response) => {
  const { userName, name, password, gender, location } = request.body;
  const usernameAva = `select * from user where username = '${userName}';`;
  const result1 = await db.get(usernameAva);
  if (result1 !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    const pswLength = password.length;
    if (pswLength < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const Mpassword = await bcrypt.hash(password, 10);
      const rQuery = `insert into
                            user(username,name,password,gender,location)
                        values
                            ('${userName}','${name}','${Mpassword}','${gender}','${location}';`;
      await db.run(rQuery);
      response.status(200);
      response.send("User created successfully");
    }
  }
});

app.post("/login/", async (request, response) => {
  const { userName, password } = request.body;
  const checkUserQuery = `select * from user where username = '${userName}';`;
  const result = await db.get(checkUserQuery);
  if (result === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const checkPws = await bcrypt.compare(password, result.password);
    if (checkPws === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const checkUser = `select * from user where username = '${username}';`;
  const result = await db.get(checkUser);
  if (result !== undefined) {
    const checkPws = await bcrypt.compare(oldPassword, result.password);
    if (checkPws === true) {
      const Length = newPassword.length;
      if (Length < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const Mpassword = await bcrypt.hash(newPassword, 13);
        const query2 = `update user set password = '${Mpassword}' where username = '${username}';`;
        const result2 = await db.run(query2);
        response.status(200);
        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
