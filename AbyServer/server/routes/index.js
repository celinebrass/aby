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
					var billDate  = toDate(bill.creation_date);
					if (billDate.getTime()>=minDate.getTime()){
						bills.push(bill);
					}
				});
				console.log(bills = "XXXXX");
				done(err, bills);
			});
		},
		function(bills, done){
			var apiCall = request.get('http://api.reimaginebanking.com/customers/'+ customer + '/accounts?key=' + key);
			apiCall.set('Content-Type', 'application/json');
			apiCall.end(function (err, response) {
				var accounts = JSON.parse(response.text);
				console.log(bills + "YYYYYYYYYYY");
				done(err, bills, accounts);
			});
		},

		function (bills, accounts, done){
			var creditPurchases = [];
			var checkingPurchases = [];
			var deposits = [];
			async.forEach(accounts, function (account, callback){
				console.log("111111111111");
				console.log(bills + "YYYYYYYYYYY");
				var type = account.type;
				async.waterfall([
					function (done){
						console.log("2222222");
						var purchases = [];
						if (type == "Checking" | type =="Credit Card");
						var apiCall = request.get('http://api.reimaginebanking.com/accounts/'+ account._id + '/purchases?key=' + key);
						apiCall.set('Content-Type', 'application/json');
						apiCall.end(function (err, response) {
							var purchaseArray = JSON.parse(response.text);
							var minDate = sixMonths();
							purchaseArray.forEach(function(purchase){
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
					function (done){
						var apiCall = request.get('http://api.reimaginebanking.com/accounts/'+ account._id + '/deposits?key=' + key);
						apiCall.set('Content-Type', 'application/json');
						apiCall.end(function (err, response) {
							var depositArray = JSON.parse(response.text);
							var minDate = sixMonths();
							depositArray.forEach(function(deposit){
								var depositDate = toDate(deposit.transaction_date);
								if (depositDate.getTime()>=minDate.getTime()){
									deposits.push(deposit);
								}
							});
							done(null)
						});

					}

				], function (err){
					callback();
				}); 
			}, function (err){
				done(null, bills, accounts, creditPurchases, checkingPurchases, deposits);
			});
		},
		//now, try to find patterns
		function (bills, accounts, creditPurchases, checkingPurchases, deposits, done){
			console.log("333333");
			var billGroups = {};
			for (bill in bills){
				var payee = bill.payee;
				if (billGroups[payee] == undefined ){
					console.log("in if");
					billGroups[payee] = [];
					billGroups[payee].push(bill);
				}
				else {
					console.log("in else");
					billGroups[payee].push(bill);
				}
			};
			done(null, accounts, creditPurchases, checkingPurchases, deposits, billGroups);
		},
		function (accounts, creditPurchases, checkingPurchases, deposits, billGroups, done){
			console.log("4444444");
			var purchaseGroups = {};
			var i = 0;
			creditPurchases.forEach(function (purchase) {
				//console.log(i);
				i++;
				var merchant = purchase.merchant_id;
				if (purchaseGroups[merchant] == undefined){
					purchaseGroups[merchant] = [purchase];
				}
				else {
					purchaseGroups[merchant].push(purchase);
				}

			});
			done(null, accounts, deposits, billGroups, purchaseGroups);
		},
		function (accounts, deposits, billGroups, purchaseGroups, done){
			var depositGroups = {};
			console.log("5555");
			deposits.forEach(function (deposit) {
				var descript = deposit.description;
				if (depositGroups[descript] == undefined){
					depositGroups[descript] = [deposit];
				}
				else {
					depositGroups[descript].push(deposit);
				}

			});
			done(null, accounts, billGroups, purchaseGroups, depositGroups);
		},
		function (accounts, billGroups, purchaseGroups, depositGroups) {
			console.log("WOOOOOOO");
			console.log(purchaseGroups);
		}
	])

});
//parses a JSON date string from API into a js date
function toDate(jsonString) {
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
