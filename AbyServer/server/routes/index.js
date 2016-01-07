var express = require('express');
var router = express.Router();

var request = require('superagent');

var key = f8608da12d10def4ff1509075e4e5cd;


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
