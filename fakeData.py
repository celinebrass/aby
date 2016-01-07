import requests, json

apiKey = "1a18b43f3fb7cdb8a3a25fb703a5e848"
customerID = "56241a13de4bf40b1711227d"
accountID = "56241a14de4bf40b17112f78"
url = "http://api.reimaginebanking.com/customers/"+customerID+"/accounts?key="+apiKey

res = requests.get(url)
print res.json()
