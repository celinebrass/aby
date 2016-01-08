var express = require('express');
var router = express.Router();
var async = require('async');
var request = require('superagent');
var Parse = require('parse/node');

var key = "1a18b43f3fb7cdb8a3a25fb703a5e848";

var customer = "56241a13de4bf40b1711227d";
Parse.initialize("KCRcO4MK7dW8maRqktTwyXGswsP8NGxNC5QsnAaH", "nQBdEWP0OpyNSZNpbzJ9N8PdJtXTF1mS0L4Q6X9S");



/* GET home page. */
router.get('/', function(req, res, next) {

	request.get('http://api.reimaginebanking.com/atms?lat=38.9283&lng=-77.1753&rad=1&key=1a18b43f3fb7cdb8a3a25fb703a5e848').end(function (err, response){
		// console.log(response.status);
		// console.log(response.body);
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
			//var deposits = [];
			async.forEach(accounts, function (account, callback){
				console.log("111111111111");
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

				], function (err){
					callback();
				});
				}, function (err){
					done(null, bills, accounts, creditPurchases, checkingPurchases);
				}
			);
		},
		//now, try to find patterns
		function (bills, accounts, creditPurchases, checkingPurchases, done){
			console.log("333333");
			var billGroups = new Map();
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
			done(null, accounts, creditPurchases, checkingPurchases, billGroups);
		},
		function (accounts, creditPurchases, checkingPurchases, billGroups, done){
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
			done(null, accounts, billGroups, purchaseGroups);
		},
		/*function (accounts, deposits, billGroups, purchaseGroups, done){
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
		},*/
		function (accounts, billGroups, purchaseGroups, done) {
			for (var group in purchaseGroups){
				var purchases = purchaseGroups[group];

				var dates = [];
				var amounts = []
				var title = purchases[0].description;
				var merchant = group;
				purchases.map(function(purchase) {
					var date = toDate(purchase.purchase_date);
					dates.push(date.getTime());
					amounts.push(purchase.amount);
				});
				dates.sort();
				var days = [];
				for (var i = 0; i<dates.length; i++){
					var date = new Date(dates[i]);
					dates[i] = date;
					days.push(date.getDate());
				}
				var subscription = false;
				var distances = [];

				for (var i = 1; i<dates.length; i++){
					var distance = dates[i].getDate() - dates[i-1].getDate();
					console.log("distance is" + distance);
					//var distances = [];
					distances.push(distance);
				}
				console.log(distances);//SORT THROUGH ARRAYS
				var counter = 0.0;
				for(var i = 0; i<distances.length; i++){
					if (distances[i]==0){
						counter++;
					}
				}
				if ((counter/distances.length)>0.7){
					console.log("FOUND MONTHLY SUBSCRIPTION");
					var total = 0.0;
					for (var i = 0; i<days.length; i++){
						total += days[i];
					}
					var avg = (total/days.length);
					var finalDay = Math.round(avg);
					var dollar = 0;
					for (var i = 0; i<amounts.length; i++){
						dollar += amounts[i];
					}
					var avgDol = (dollar/amounts.length);
					var Bill = Parse.Object.extend("Bill");
					var newBill = new Bill();
					var data = {
						day: finalDay,
						//TODO: get title of
						title: title,
						amount: avgDol,
						repeat: "month",
						merchantID: merchant
					}
					newBill.save(data, {
						success: function(ret) {
							console.log("Guessed Bill has been pushed to Parse");
						},
						error: function(something, err) {
							console.log(err);
						}
					});
					subscription = true;
				}
				if (!subscription){
					var days = [];
					for (var i = 1; i<dates.length; i++){
						var distance = dates[i].getDay() - dates[i-1].getDay();
						//var distances = [];
						days.push(distance);
					}
					var counter = 0.0;
					for(var i = 0; i<days.length; i++){
						if (days[i]==0){
							counter++;
						}
					}
					if ((counter/distances.length)>0.7){
						console.log("FOUND WEEKLY SUBSCRIPTION");
						var week = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
						var weekDays = [0,0,0,0,0,0,0]
						var dollar = 0;
						for (var i = 0; i<amounts.length; i++){
							dollar += amounts[i];
						}
						for (var i = 0; i<dates.length; i++){
							var wkDay = dates[i].getDay();
							var idx = week.indexOf(wkDay);
							week[idx] = week[idk] + 1;
						}
						var max = -1
						for (var i = 0; i<weekDays.length; i++){
							if (weekDays[i]>max){
								max = i;
							}
						}
						var avgDol = (dollar/amount.length);
						var Bill = Parse.Object.extend("Bill");
						var newBill = new Bill();
						var data = {
							day: max,
							//TODO: get title of
							title: title,
							amount: avgDol,
							repeat: "month",
							merchantID: merchant
						}
						newBill.save(data, {
							success: function(ret) {
								console.log("Guessed Bill has been pushed to Parse");
							},
							error: function(something, err) {
								console.log(err);
							}
						});
						subscription = true;
					}
					if(!subscription){
						console.log("looking for habit");
						if (purchases.length<12){continue;}

						console.log("lookgng for habit--more than 12 found");
						var monthMap = new Map();
						purchases.map(function(purchase){
							var date = toDate(purchase.purchase_date);
							var month = date.getMonth();
							//console.log("!!!!!" + month);
							if (monthMap[month]==undefined){
								console.log("undefined found");
								monthMap[month] = [purchase];
							}
							else {
								console.log("hit this");
								monthMap[month].push(purchase);
							}
						});
						var average;
						var size = 0;
						var total = 0.0;
						for (month in monthMap){
							size++;
							console.log(month);
							var purchases = monthMap[month];
							for (var i = 0; i<purchases.length; i++){
							//for (purchase in purchases){
								var purchase = purchases[i];
								console.log(purchase);
								console.log("old total is" + total);
								total += parseFloat(purchase.amount);
								console.log("new total is" + total);
							}
							console.log("FOUND HABIT OBJECT");
						}
						console.log("FINAL NUMBERS");
						console.log(total);
						console.log(size);
						average = (total/size);
						var Habit = Parse.Object.extend("Habit");
						var newHabit = new Habit();
						var data = {
							//TODO: get title of
							title: title,
							amount: average,
							merchantID: merchant
						}
						newHabit.save(data, {
							success: function(ret) {
								console.log("Guessed Habit has been pushed to Parse");
							},
							error: function(something, err) {
								console.log(err);
							}
						});
					}

				}

			}
			done(null, accounts, billGroups);
		}, function (accounts, billGroups, done){
			console.log(billGroups.size + "********");
			for (var i = 0; i<billGroups.size; i++){
			//for (billGroup in billGroups){
				billGroup = billGroups[i];
				var merchant = billGroup;
				var title = billGroup.nickname;
				console.log("GETTING INTO LOOP");
				console.log("Billgroup is")
				var bills = billGroups[billGroup];
				var today = new Date();
				var month = today.getMonth();
				var newMonth;
				var newYear = today.getFullYear();
				if (month!=0){
					newMonth = month - 1;
				}
				else {
					newMonth = 12;
				}
				var dates = [];
				for (var i = 0; i<bills.length; i++){
					var bill = bills[i];
					var date = toDate(bill.creation_date);
					dates.push(date);
				}
				for(var i = 0; i<dates.length; i++){
					var ms = dates[i].getTime();
					dates[i] = ms;
				}
				dates.sort();
				var max = dates[dates.length];
				var lastDate = new Date(ms);
				var lastMonth = lastDate.getMonth();
				var day = lastDate.getDate();
				if (lastMonth == newMonth){
					console.log("FOUND A BILL OBJECT");
					var amt = 0;
					for (bill in bills){
						amt += bill.payment_amount;
					}

					var average = (amt/(bills.length));

					var Bill = Parse.Object.extend("Bill");
					var newBill = new Bill();
					var data = {
						day: day,
						title: title,
						amount: average,
						repeat: "month",
						merchantID: merchant
					}
					newBill.save(data, {
						success: function(ret) {
							console.log("Bill has been pushed to Parse");
						},
						error: function(something, err) {
							console.log(err);
						}
					});
				}
			}
			res.send("done");
			done(null);
		}
		]);

});

router.get('/expenseList', function (req, res, next) {
	async.waterfall([
		function (done){
			console.log("1")
			var query = new Parse.Query("Expense");
			query.find({
				success: function(result) {
					done(null, result);
				}
			});
		},
		function (expenses, done){
			var query = new Parse.Query("Habit");
			console.log("2")
			query.find({
				success: function(result) {
					done(null, expenses, result);
				}
			});
		},
		function (expenses, habits, done){
			var query = new Parse.Query("Bill");
			console.log("3")
			query.find({
				success: function(result) {
					done(null, expenses, habits, result);
				}
			});
		},
		function (expenses, habits , bills, done){
			var query = new Parse.Query("Deposits");
			console.log("4")
			query.find({
				success: function(result) {
					done(null, expenses, habits, bills, result);
				}
			});
		},
		function (expenses, habits, bills, deposits, done) {
			console.log("5")
			var creditBal = 0.0;
			var checkingBal = 0.0;
			var creditAccount;
			var apiCall = request.get('http://api.reimaginebanking.com/customers/'+customer+ '/accounts?key=' + key);
			apiCall.set('Content-Type', 'application/json');
			apiCall.end(function (err, response) {
				console.log(response);
				console.log("in response");
				console.log(response.text);
				var accounts = JSON.parse(response.text);
				console.log(accounts.length);
				for (var i = 0; i<accounts.length; i++){
					console.log("iiiii" + i);
					if (accounts[i].type == "Credit Card") {
						creditAccount = accounts[i];
						creditBal += accounts[i].balance;
					}
					else if ( accounts[i] == "Checking") {
						checkingBal += accounts[i].balance;
					}
				}
				done (err, expenses, habits, bills, deposits, checkingBal, creditBal, creditAccount);
			});
		},
		function (expenses, habits, bills, deposits, checkingBal, creditBal, account, done){
			console.log("6")
			var purchases = [];
			var apiCall = request.get('http://api.reimaginebanking.com/accounts/56241a14de4bf40b17112f78/purchases?key=1a18b43f3fb7cdb8a3a25fb703a5e848');
			apiCall.set('Content-Type', 'application/json');
			apiCall.end(function (err, response) {
				var purchaseArray = JSON.parse(response.text);
				var today = new Date();
				var minDate = new Date(today.getYear(), today.getMonth(), 1);
				for ( var i = 0; i<purchaseArray.length; i++){
					console.log("****" + i);
					var purchase = purchaseArray[i];
					var purchaseDate  = toDate(purchase.purchase_date);
					if (purchaseDate.getTime()>=minDate.getTime()){
						purchases.push(purchase);
					}
				}
				done(null, expenses, habits, bills, deposits, checkingBal, creditBal, account, purchases);
			});
		},
		function (expenses, habits, bills, deposits, checkingBal, creditBal, account, purchases, done) {
			console.log("7")
			var habitArray = [];
			var billArray = [];
			for (var i = 0; i<habits.length; i ++){
				var habit = habits[i];
				var merchant = habit.merchantID;
				var habitObj = {'total' : habit.amount,
								'used'  : 0.0,
								'title' : habit.title};
				for (var i = 0; i<purchases.length; i++){
					var purchase = purchases[i];
					if (purchase.merchant_id == merchant){
						habit.total-=purchase.amount;
						purchases.splice(i);
					}
				}
				habitArray.push(habit);
			}
			done(null, expenses, bills, deposits, checkingBal, creditBal, account, purchases, habitArray)
		},
		function (expenses, bills, deposits, checkingBal, creditBal, account, purchases, habitArray, done) {
			console.log("8")
			var otherBalance = 0.0
			for (var i = 0; i<purchases.length; i++){
				var purchase = purchases[i];
				otherBalance+=purchase.amount;
			}
			done (null, expenses, bills, deposits, checkingBal, creditBal, account, purchases, habitArray, otherBalance)
		},
		function (expenses, bills, deposits, checkingBal, creditBal, account, purchases, habitArray, otherBalance, done){
			console.log("9")
			var temp = { "habits": habitArray,
						 "bills" : bills,
						 "otherBalance": otherBalance
						};
			res.json(temp);

		}
	])
});

//parses a JSON date string from API into a js date
function toDate(jsonString) {
	//console.log(jsonString);
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
