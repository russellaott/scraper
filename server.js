// Dependencies
var express = require("express");
var bodyParser = require("body-parser"); 
// mongoose provided our mongo object model
var mongoose = require("mongoose"); 
// request makes our http calls
var request = require("request"); 
// cheerio is used as our scraper
var cheerio = require("cheerio"); 

// Require all models
var db = require("./models");

// configure our port for local use or deployment
var PORT = process.env.PORT || process.argv[2] || 8080;

// Initialize Express
var app = express();

// Use bodyParser
app.use(bodyParser.urlencoded({ extended: true }));

var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// serves up our public folder as static
app.use(express.static("public"));

// Controllers
var router = require("./controllers/api.js");
app.use(router);

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to use JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

// Start the server
app.listen(PORT, function () {
    console.log(`The server is listening on ${PORT}`);
});
