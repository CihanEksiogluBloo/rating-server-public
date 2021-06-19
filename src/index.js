require("./models/User");
require("./models/Post");
const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./routers/authRoutes");
const requireAuth = require("./middlewares/requireAuth");
const ratingRoutes = require("./routers/ratingRoutes");
const profileRoutes = require("./routers/profileRoutes");
const path = require("path");
const postRoutes = require("./routers/postRoutes");
const dotenv = require("dotenv");
const PORT = process.env.PORT || 3000;

const app = express();
const rootDir = path.dirname(require.main.filename);
const publicDir = path.dirname(rootDir);

dotenv.config({
  path: "../.env/config.env",
});

app.use("/ProfilePhoto", express.static(path.join(publicDir, "ProfilePhoto")));
app.use("/posts", express.static(path.join(publicDir, "posts")));

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

app.use(authRoutes);
app.use(ratingRoutes);
app.use(postRoutes);
app.use(profileRoutes);

const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

mongoose.connection.on("connected", () => {
  console.log("Connected to mongo instance");
});
mongoose.connection.on("error", (err) => {
  console.error("Error connecting to mongo ", err);
});
mongoose.set("useFindAndModify", false);

app.get("/", requireAuth, (req, res) => {
  res.send(`Your email : ${req.user}`);
});

app.listen(PORT, () => {
  console.log(`Listenin on port ${PORT}`);
});
