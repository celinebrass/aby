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
		function (accounts, billGroups, purchaseGroups, depositGroups, done) {
			for (var group in purchaseGroups){
				var purchases = purchaseGroups[group];

				var dates = [];
				var amounts = []
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
				if ((counter/distances.length).toPrecision(2)>0.7){
					console.log("FOUND MONTHLY SUBSCRIPTION");
					var total = 0.0;
					for (var i = 0; i<days.length; i++){
						total += days[i];
					}
					var avg = (total/days.length).toPrecision(2);
					var finalDay = Math.round(avg);
					var dollar = 0;
					for (var i = 0; i<amounts.length; i++){
						dollar += amounts[i];
					}
					var avgDol = (dollar/amounts.length).toPrecision(2);
					var Bill = Parse.Object.extend("Bill");
					var newBill = new Bill();
					var data = {
						day: finalDay,
						//TODO: get title of 
						title: group,
						amount: avgDol,
						repeat: "month"
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
					if ((counter/distances.length).toPrecision(2)>0.7){
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
						var avgDol = (dollar/amount.length).toPrecision(2);
						var Bill = Parse.Object.extend("Bill");
						var newBill = new Bill();
						var data = {
							day: max,
							//TODO: get title of 
							title: group,
							amount: avgDol,
							repeat: "month"
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
						console.log("lookgng for habit");
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
						console.log("*******" + monthMap.size);
						var average;
						for (month in monthMap){
							console.log("IN FOR LOOP WOOOOOOOOOO");
							console.log(month);
							var purchases = monthMap[month];
							var total = 0.0;
							for (purchase in purchases){
								total+=purchase.amount;
							}
							average = (total/monthMap.size);
							console.log("FOUND HABIT OBJECT");
						}
						var Habit = Parse.Object.extend("Habit");
						var Habit = new Habit();
						var data = {
							//TODO: get title of 
							title: group,
							amount: average
						}
						Habit.save(data, {
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
			done(null, accounts, billGroups, depositGroups);
		}, function (accounts, billGroups, depositGroups, done){
			console.log(billGroups.size + "********");
			for (var i = 0; i<billGroups.size; i++){
			//for (billGroup in billGroups){
				billGroup = billGroups[i];
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

					var average = (amt/(bills.length)).toPrecision(2);

					var Bill = Parse.Object.extend("Bill");
					var newBill = new Bill();
					var data = {
						day: day,
						title: billGroup,
						amount: average,
						repeat: "month"
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
			done(null, depositGroups);
		}, function (depositGroups, done){
			for (group in depositGroups){
				var deposits = depositGroups[group];

				//if (purchases.length < 12) {continue;}
				//else {
					var dates = [];
					deposits.map(function(deposit) {
						var date = toDate(deposit.transaction_date);
						dates.push(date.getTime());
					});
					dates.sort();
					for (var i = 0; i<dates.length; i++){
						var date = new Date(dates[i]);
						dates[i] = date;
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
				if ((counter/distances.length).toPrecision(2)>0.7){
					console.log("FOUND MONTHLY DEPOSIT");
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
					if ((counter/distances.length).toPrecision(2)>0.7){
						console.log("FOUND WEEKLY DEPOSIT");
						subscription = true;
					}

				}

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
