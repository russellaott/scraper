var express = require("express");
var router = express.Router();
var db = require("../models");
var request = require("request"); 
var cheerio = require("cheerio");
 
// route for scraping NYT
router.get("/scrape", (req, res) => {
    console.log("scrape ran")
    // grab the body of HTML with request
    request("https://www.nytimes.com/", (error, response, body) => {
        if (!error && response.statusCode === 200) {
         
            var $ = cheerio.load(body);
            var count = 0;
            // grab all articles
            $('article').each(function (i, element) {
                // create empty refult object
                var count = i;
                var result = {};
                // Add the text and href of every link, summary, byline and then save to result object
                result.title = $(element)
                    .children('.story-heading')
                    .children('a')
                    .text().trim();
                result.link = $(element)
                    .children('.story-heading')
                    .children('a')
                    .attr("href");
                result.summary = $(element)
                    .children('.summary')
                    .text().trim()
                    || $(element)
                        .children('ul')
                        .text().trim();
                result.byline = $(element)
                    .children('.byline')
                    .text().trim()
                    || 'No byline available'
                
                if (result.title && result.link && result.summary){
                    // create an article from our results object
                    db.Article.create(result)
                        .then(function (dbArticle) {
                            count++;
                        })
                        .catch(function (err) {
                            return res.json(err);
                        });
                };
            });
            // If we are successful then redirect to index
            res.redirect('/')
        }
        else if (error || response.statusCode != 200){
            res.send("Error- Could not scrape new articles")
        }
    });
});

router.get("/", (req, res) => {
    db.Article.find({})
        .then(function (dbArticle) {
            const retrievedArticles = dbArticle;
            let hbsObject;
            hbsObject = {
                articles: dbArticle
            };
            res.render("index", hbsObject);        
        })
        .catch(function (err) {
            res.json(err);
        });
});

router.get("/saved", (req, res) => {
    db.Article.find({isSaved: true})
        .then(function (retrievedArticles) {
            var hbsObject;
            hbsObject = {
                articles: retrievedArticles
            };
            res.render("saved", hbsObject);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// get route that pulls all our articled from database
router.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles send to client
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// put route to update articles
router.put("/save/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: true })
        .then(function (data) {
            res.json(data);
        })
        .catch(function (err) {
            res.json(err);
        });;
});

// put route to remove articles
router.put("/remove/:id", function (req, res) {
    db.Article.findOneAndUpdate({ _id: req.params.id }, { isSaved: false })
        .then(function (data) {
            res.json(data)
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
router.get("/articles/:id", function (req, res) {
    // use id to find query to populate notes associated with ID
    db.Article.find({ _id: req.params.id })
        .populate({
            path: 'note',
            model: 'Note'
        })
        .then(function (dbArticle) {
           // if we find an article with that ID send it to client
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
router.post("/note/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            return db.Article.findOneAndUpdate({ _id: req.params.id }, {$push: { note: dbNote._id }}, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// delete route 
router.delete("/note/:id", function (req, res) {
    db.Note.findByIdAndRemove({ _id: req.params.id })
        .then(function (dbNote) {

            return db.Article.findOneAndUpdate({ note: req.params.id }, { $pullAll: [{ note: req.params.id }]});
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

module.exports = router;