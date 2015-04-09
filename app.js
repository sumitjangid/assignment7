/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";
var express = require("express"),
    path = require("path"),
    bodyParser = require("body-parser"),
    redis = require("redis"),
    port = 3000,
    client = redis.createClient(),
    app = express();

    

app.use(express.static(path.join(__dirname, "client")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

client.on("connect", function() {
    console.log("Connection complete");
});
function Longurl(longurl, callback) {
    client.hget("sort1", "longurl", function(err, response) {
        callback(err, response);
    });
}
function Shorturl() {
    var temp = Date.now();
    return (temp.toString(36));
}
app.get("/gettop", function(req, res) {
    client.zrevrangebyscore("views", "+inf", 0, "limit", 0, 10, function(err, response) {
        res.json({
            "top10": response
        });
    });
});
app.post("/", function(req, res) {
    var url = req.body.ogurl;
    var index = url.indexOf("localhost:3000");
    if (index > -1 && index < 9) {
        client.hget(url, "longurl", function(err, response) {
            res.json({
                "url": response
            });
        });
    } else {
        client.hget(url, "shorturl", function(err, response) {
            if (response === null) {
                var shorturl = Shorturl();
                shorturl = "localhost:3000/" + shorturl;
                client.hset(url, "shorturl", shorturl);
                client.hset(shorturl, "longurl", url);
                client.zincrby("views", 1, shorturl);
                res.json({
                    "url": shorturl
                });
            } else {

                res.json({
                    "url": response
                });
            }
        });

    }


});
app.route("/:url").all(function(req, res) {
    var url = req.params.url;
    url = "localhost:3000/" + url;
    client.hget(url, "longurl", function(err, response) {
        if (response === null) {
            res.status(404).send("Url not exist");
        } else {
            client.zincrby("views", 1, url);
            res.status(301);
            res.set("Location", response);
            res.send();
        }
    });

});
app.listen(port);
console.log("Listening on port " + port);