var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('superagent');
var Parse = require('parse/node');
Parse.initialize("KCRcO4MK7dW8maRqktTwyXGswsP8NGxNC5QsnAaH", "nQBdEWP0OpyNSZNpbzJ9N8PdJtXTF1mS0L4Q6X9S");

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
      res.json({current: (checkingBal - creditBal)});
    }
  });
});

router.get('/dayExpenses/:day', function(req, res, next) {
  //get total expenses for a given day
  res.send("I don't know what I'm doing");
});

//Get all expenses from Parse
router.get('/expense', function(req, res, next) {
  var Expense = Parse.Object.extend("Expense");
  var query = new Parse.Query(Expense);
  query.find({
    success: function(result) {
      var out = [];
      for (i = 0; i < result.length; i++) {
        var cur = result[i];
        console.log(cur.id);
        var temp = {
          id: cur.id,
          amount: cur.get("amount"),
          date: cur.get("date").toJSON(),
          title: cur.get("title"),
          type: cur.get("type")
        }
        out.push(temp);
      }
      res.json(out);
    },
    error: function(err) {
      res.send(err);
    }
  });
});

//Get expense by id
router.get('/expense/:id', function(req, res, next) {
  var Expense = Parse.Object.extend("Expense");
  var query = new Parse.Query(Expense);
  query.get(req.params.id, {
    success: function(cur) {
      var temp = {
        id: cur.id,
        amount: cur.get("amount"),
        date: cur.get("date").toDateString(),
        title: cur.get("title"),
        type: cur.get("type")
      }
      res.json(temp);
    },
    error: function(something, error) {
      res.send(error);
    }
  });
});

//POST new expense to Parse
router.post('/expense', function(req, res, next) {
  var body = req.body;
  if (!body) {
    res.send("Request body empty");
  }
  var Expense = Parse.Object.extend("Expense");
  var newExpense = new Expense();
  var d = new Date(body.date);
  var data = {
    date: d,
    title: body.title,
    amount: body.amount,
    type: body.type
  }
  newExpense.save(data, {
    success: function(ret) {
      res.send("Expense has been pushed to Parse");
    },
    error: function(something, err) {
      res.send(err);
    }
  });
});

//DELETE expense by id
router.delete('/expense/:id', function(req, res, next) {
  var Expense = Parse.Object.extend("Expense");
  var query = new Parse.Query(Expense);
  query.get(req.params.id, {
    success: function(exp) {
      exp.destroy({
        success: function(obj) {
          res.send("Deletion success");
        },
        error: function(obj, error) {
          res.send(error);
        }
      });
    },
    error: function(something, error) {
      res.send(error);
    }
  });
});

router.put('expense/:id', function(req, res, next) {
  var Expense = Parse.Object.extend("Expense");
  var query = new Parse.Query(Expense);
  query.get(req.params.id, {
    success: function(result) {
      result.set("date", new Date(req.body.date));
      result.set("title", req.body.date);
      result.set("amount", req.body.amount);
      result.set("type", req.body.type);
      result.save();
    }
  });
});


module.exports = router;
