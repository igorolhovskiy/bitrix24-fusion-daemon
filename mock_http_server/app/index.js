const express = require('express'),
    bodyParser = require('body-parser');

const app = express();

app.set('x-powered-by', false);
app.use(bodyParser.json());

app.post('/*',  (req, res) => {
    console.log("[MAIN][EXPRESS][REQUEST RECEIVED] " + JSON.stringify(req, null, 2));

    res.json({
        status: "200",
        message: "Failsafe answer"
    });
});

// Failsafe answer
app.use(function(err, req, res, next) {
    res.json({
        status: "500",
        message: err && err.message
    });
});

app.listen(80, () => {
    console.log("  [MAIN][EXPRESS] Server welcomes you on port 80");
});