import requests, json, datetime, random

apiKey = "1a18b43f3fb7cdb8a3a25fb703a5e848"
customerID = "56241a13de4bf40b1711227d"
accountID = "56241a14de4bf40b17112f78"

#Merchant IDs
starbucksID = "56241a13de4bf40b1711235c" #done
cvsID = "56241a13de4bf40b17112339"
buffaloWildWingsID = "56241a13de4bf40b17112357" #done
chipotleID = "56477c35d954610d00de1a85" #done
hiltonID = "568ea1b33921211200ef1eb1" #done
walmartID = "56241a13de4bf40b1711269c" #done
netflixID = "568ea2c83921211200ef1eb2" #done
date = datetime.date(2015, 6, 1)
# dayIncrement = datetime.timedelta(days=4)

# url = "http://api.reimaginebanking.com/accounts/"+accountID+"/purchases?key="+apiKey
url = "http://5bef55d0.ngrok.io/users/expense"

while date.month != 1:
    body = {
      "date": str(date),
      "amount": str(random.randint(10,25)),
      "title": "Dummy data"
    }
    res = requests.post(url, data = json.dumps(body), headers = {"content-type": "application/json"})
    print res.text

    dayIncrement = datetime.timedelta(days= (random.randint(0,10)))
    date = date + dayIncrement
    # if (count % 4 == 0):
    #     date = date.replace(day = date.day + 1)
    # else:
    #     date = date.replace(day = date.day + 3)
    #     count+=1

# res = requests.get(url)
# print res.json()

# print date
# print date.replace(month = date.month + 1)
