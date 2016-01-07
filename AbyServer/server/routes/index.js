var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('superagent');

var key = "f8608da12d10def4ff1509075e4e5cd";



/* GET home page. */
router.get('/', function(req, res, next) {

    request.get('http://api.reimaginebanking.com/atms?lat=38.9283&lng=-77.1753&rad=1&key=f8608da12d10def4ff1509075e4e5cd5').end(function(err, response){
    	console.log(response.status);
    	console.log(response.body);
    	res.render('index', { title: 'Express' });
	});
});

module.exports = router;
