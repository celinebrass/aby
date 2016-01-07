var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('superagent');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/balance', function(req, res, next) {
  request.get("http://api.reimaginebanking.com/customers/56241a13de4bf40b1711227d/accounts?key=1a18b43f3fb7cdb8a3a25fb703a5e848").end(function(err, response) {
    response = JSON.parse(response.text);
    if (err) {
      res.send(err);
    } else {
      var creditBal = 0;
      var checkingBal = 0;
      for (i = 0; i < response.length; i++) {
        if ((response[i].type).toLowerCase() == "credit card") {
          creditBal = response[i].balance;
        } else if ((response[i].type).toLowerCase() == "checking") {
          checkingBal = response[i].balance;
        }
      }
      res.send(JSON.stringify({current: (checkingBal - creditBal)}));
    }
  });
});


module.exports = router;
