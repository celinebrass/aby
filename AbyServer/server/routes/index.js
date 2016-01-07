var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('superagent');

var key = "1a18b43f3fb7cdb8a3a25fb703a5e848";

var customer = "56241a13de4bf40b1711227d"



/* GET home page. */
router.get('/', function(req, res, next) {

    request.get('http://api.reimaginebanking.com/atms?lat=38.9283&lng=-77.1753&rad=1&key=1a18b43f3fb7cdb8a3a25fb703a5e848').end(function (err, response){
    	console.log(response.status);
    	console.log(response.body);
    	res.render('index', { title: 'Express' });
	});
});

/*GET purchase predictions*/

router.get('/predict', function (req, res, next)  {
	var bills = [];
	async.waterfall([ 
		function (done){
			var apiCall = request.get('http://api.reimaginebanking.com/customers/' + customer + '/bills?key=' + key);
			apiCall.set('Content-Type', 'application/json');
			apiCall.end(function (err, response) {
				var billArray = JSON.parse(response.text);
				var minDate = sixMonths();
				billArray.forEach(function(bill){
					console.log(bill);
					var billDate  = toDate(bill.creation_date);
					console.log(billDate.getTime());
					console.log(minDate.getTime());
					if (billDate.getTime()>=minDate.getTime()){
						bills.push(bill);
					}
				});
				done(err, bills);
			});
		},
		function(bills, done){
			var apiCall = request.get('http://api.reimaginebanking.com/customers/'+ customer + '/accounts?key=' + key);
			apiCall.set('Content-Type', 'application/json');
			apiCall.end(function (err, response) {
				var accounts = JSON.parse(response.text);
				console.log(accounts);
				done(err, bills, accounts);
			})
		},

		function (bills, accounts, done){
			var creditPurchases = [];
			var checkingPurchases = [];
			async.forEach(accounts, function (account, callback){
				var type = account.type;
				async.waterfall([
					function (done){
						var purchases = [];
						if (type == "Checking" | type =="Credit Card");
						var apiCall = request.get('http://api.reimaginebanking.com/accounts/'+ account._id + '/purchases?key=' + key);
						apiCall.set('Content-Type', 'application/json');
						apiCall.end(function (err, response) {
							var purchaseArray = JSON.parse(response.text);
							var minDate = sixMonths();
							purchaseArray.forEach(function(purchase){
								//console.log(purchase);
								var purchaseDate  = toDate(purchase.purchase_date);
								if (purchaseDate.getTime()>=minDate.getTime()){
									purchases.push(purchase);
								}
							});
							done(null, type, purchases);
						});
					},
					function (type, purchases, done) {
						if (account.type == 'Credit Card'){
							creditPurchases = purchases;
						}
						else if (account.type == 'Checking'){
							checkingPurchases = purchases;
						}
						done(null);
					},

				], function (err){
					callback();
				}); 
			},
			function (err){
				var billGroups = {};
				bills.forEach( function (bill){
					var payee = bill.payee;
					if (billGrouds[payee].length == undefined ){
						billGroups[payee] = [];
						billGroups[payee].push(bill);
					}
					else {
						billGroups[payee].push(bill);
					}
					done(null, billgroups);
				})
				//console.log(creditPurchases);
				done(err, bills, accounts, creditPurchases, checkingPurchases)
			};
		},
		//now, try to find patterns
		function (err){
				var billGroups = {};
				bills.forEach( function (bill){
					var payee = bill.payee;
					if (billGrouds[payee].length == undefined ){
						billGroups[payee] = [];
						billGroups[payee].push(bill);
					}
					else {
						billGroups[payee].push(bill);
					}
					done(null, billgroups);
				})
				//console.log(creditPurchases);
				done(err, bills, accounts, creditPurchases, checkingPurchases)
			}
		}


	])

});
//parses a JSON date string from API into a js date
function toDate(jsonString) {
	console.log(jsonString);
	jsonString = jsonString.replace("\\\"", "");
	jsonString = jsonString.replace("\\\\", "");
	jsonString = jsonString.replace("\"", "");
	var year = parseInt(jsonString.substring(0,4));
	var month = parseInt(jsonString.substring(5,7)) - 1;
	var day = parseInt(jsonString.substring(8,10));
	var date = new Date(year, month, day);
	return date;
}
//returns the first day of the month six months ago.
function sixMonths(){
	var date = new Date();
	var curMS = date.getTime();
	var oldMS = curMS - (6*30*24*60*60*1000);
	var oldDate = new Date(oldMS);
	var billDate  = new Date(oldDate.getFullYear(), oldDate.getMonth(), 1);
	return billDate;
}

module.exports = router;
