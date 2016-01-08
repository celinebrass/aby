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
router.get('/:type', function(req, res, next) {
  switch (req.params.type.toLowerCase()) {
    case "expense":
      var Expense = Parse.Object.extend("Expense");
      var query = new Parse.Query(Expense);
      query.find({
        success: function(result) {
          var out = [];
          for (i = 0; i < result.length; i++) {
            var cur = result[i];
            // console.log(cur.id);
            var temp = {
              id: cur.id,
              amount: cur.get("amount"),
              date: cur.get("date").toJSON(),
              title: cur.get("title"),
            }
            out.push(temp);
          }
          res.json(out);
        },
        error: function(err) {
          res.send(err);
        }
      });
      break;

    case "bill":
      var Expense = Parse.Object.extend("Bill");
      var query = new Parse.Query(Expense);
      query.find({
        success: function(result) {
          var out = [];
          for (i = 0; i < result.length; i++) {
            var cur = result[i];
            // console.log(cur.id);
            var temp = {
              id: cur.id,
              amount: cur.get("amount"),
              day: cur.get("day"),
              title: cur.get("title"),
              repeat: cur.get("repeat"),
              merchantID: cur.get("merchantID")
            }
            out.push(temp);
          }
          res.json(out);
        },
        error: function(err) {
          res.send(err);
        }
      });
      break;

    case "habit":
      var Expense = Parse.Object.extend("Habit");
      var query = new Parse.Query(Expense);
      query.find({
        success: function(result) {
          var out = [];
          for (i = 0; i < result.length; i++) {
            var cur = result[i];
            // console.log(cur.id);
            var temp = {
              id: cur.id,
              amount: cur.get("amount"),
              title: cur.get("title"),
              merchantID: cur.get("merchantID")
            }
            out.push(temp);
          }
          res.json(out);
        },
        error: function(err) {
          res.send(err);
        }
      });
      break;

    default:
      res.send("Incorrect type provided");
  }
});

//Get expense by id
router.get('/:type/:id', function(req, res, next) {
  switch (req.params.type.toLowerCase()) {
    case "expense":
      var Expense = Parse.Object.extend("Expense");
      var query = new Parse.Query(Expense);
      query.get(req.params.id, {
        success: function(cur) {
          var temp = {
            id: cur.id,
            amount: cur.get("amount"),
            date: cur.get("date").toJSON(),
            title: cur.get("title"),
            type: cur.get("type")
          }
          res.json(temp);
        },
        error: function(something, error) {
          res.send(error);
        }
      });
      break;

    case "bill":
      var Expense = Parse.Object.extend("Bill");
      var query = new Parse.Query(Expense);
      query.get(req.params.id, {
        success: function(cur) {
          var temp = {
            id: cur.id,
            amount: cur.get("amount"),
            day: cur.get("day"),
            title: cur.get("title"),
            repeat: cur.get("repeat"),
            merchantID: cur.get("merchantID")
          }
          res.json(temp);
        },
        error: function(something, error) {
          res.send(error);
        }
      });
      break;

    case "habit":
      var Expense = Parse.Object.extend("Habit");
      var query = new Parse.Query(Expense);
      query.get(req.params.id, {
        success: function(cur) {
          var temp = {
            id: cur.id,
            amount: cur.get("amount"),
            title: cur.get("title"),
            merchantID: cur.get("merchantID")
          }
          res.json(temp);
        },
        error: function(something, error) {
          res.send(error);
        }
      });
      break;

    default:
      res.send("Incorrect type provided");
  }
});

//POST new expense to Parse
router.post('/:type', function(req, res, next) {
  var body = req.body;
  if (!body) {
    res.send("Request body empty");
  }
  switch (req.params.type.toLowerCase()) {
    case "expense":
      var Expense = Parse.Object.extend("Expense");
      var newExpense = new Expense();
      var d = new Date(body.date);
      var data = {
        date: d,
        title: body.title,
        amount: body.amount
      }
      newExpense.save(data, {
        success: function(ret) {
          console.log("Posted data");
          res.send("Expense has been pushed to Parse");
        },
        error: function(something, err) {
          res.send(err);
        }
      });
      break;

    case "bill":
      var Expense = Parse.Object.extend("Bill");
      var newExpense = new Expense();
      var data = {
        day: body.day,
        title: body.title,
        amount: body.amount,
        repeat: body.repeat,
        merchantID: body.merchantID
      }
      newExpense.save(data, {
        success: function(ret) {
          console.log("Posted data");
          res.send("Bill has been pushed to Parse");
        },
        error: function(something, err) {
          res.send(err);
        }
      });
      break;

    case "habit":
      var Expense = Parse.Object.extend("Habit");
      var newExpense = new Expense();
      var data = {
        title: body.title,
        amount: body.amount,
        merchantID: body.merchantID
      }
      newExpense.save(data, {
        success: function(ret) {
          console.log("Posted data");
          res.send("Habit has been pushed to Parse");
        },
        error: function(something, err) {
          res.send(err);
        }
      });
      break;

    default:
      res.send("Incorrect type provided");
  }
});

//DELETE expense by id
router.delete('/:type/:id', function(req, res, next) {
  switch (req.params.type.toLowerCase()) {
    case "expense":
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
      break;

    case "bill":
      var Expense = Parse.Object.extend("Bill");
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
      break;

    case "habit":
      var Expense = Parse.Object.extend("Habit");
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
      break;

    default:
      res.send("Incorrect type provided");
  }
});

router.put('/:type/:id', function(req, res, next) {
  switch (req.params.type.toLowerCase()) {
    case "expense":
      var Expense = Parse.Object.extend("Expense");
      var query = new Parse.Query(Expense);
      query.get(req.params.id, {
        success: function(result) {
          if (req.body.date) {
            result.set("date", new Date(req.body.date));
          }
          if (req.body.title) {
            result.set("title", req.body.title);
          }
          if (req.body.amount) {
            result.set("amount", req.body.amount);
          }
          if (req.body.type) {
            result.set("type", req.body.type);
          }
          if (req.body.day) {
            result.set("day", req.body.day);
          }
          if (req.body.merchantID) {
            result.set("merchantID", req.body.merchantID);
          }
          if (req.body.repeat) {
            result.set("repeat", req.body.repeat);
          }
          result.save(null, {
            success: function(obj) {
              res.send("I think the update worked")
            }
          });
        }
      });
      break;

    case "bill":
      var Expense = Parse.Object.extend("Bill");
      var query = new Parse.Query(Expense);
      query.get(req.params.id, {
        success: function(result) {
          if (req.body.date) {
            result.set("date", new Date(req.body.date));
          }
          if (req.body.title) {
            result.set("title", req.body.title);
          }
          if (req.body.amount) {
            result.set("amount", req.body.amount);
          }
          if (req.body.type) {
            result.set("type", req.body.type);
          }
          if (req.body.day) {
            result.set("day", req.body.day);
          }
          if (req.body.merchantID) {
            result.set("merchantID", req.body.merchantID);
          }
          if (req.body.repeat) {
            result.set("repeat", req.body.repeat);
          }
          result.save(null, {
            success: function(obj) {
              res.send("I think the update worked")
            }
          });
        }
      });
      break;

    case "habit":
      var Expense = Parse.Object.extend("Habit");
      var query = new Parse.Query(Expense);
      query.get(req.params.id, {
        success: function(result) {
          if (req.body.date) {
            result.set("date", new Date(req.body.date));
          }
          if (req.body.title) {
            result.set("title", req.body.title);
          }
          if (req.body.amount) {
            result.set("amount", req.body.amount);
          }
          if (req.body.type) {
            result.set("type", req.body.type);
          }
          if (req.body.day) {
            result.set("day", req.body.day);
          }
          if (req.body.merchantID) {
            result.set("merchantID", req.body.merchantID);
          }
          if (req.body.repeat) {
            result.set("repeat", req.body.repeat);
          }
          result.save(null, {
            success: function(obj) {
              res.send("I think the update worked")
            }
          });
        }
      });
      break;

    default:

  }
});


module.exports = router;
