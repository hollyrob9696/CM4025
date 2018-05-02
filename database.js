var mongojs = require("mongojs");
var db = mongojs('localhost:27017/myGame', ['users','progress']);

Database = {};

Database.isValidPassword = function(data,callBack){
    db.users.find({username:data.username,password:data.password}, function(err,res){
        if(res.length > 0)
            callBack(true);
        else
            callBack(false);
    })
};

//Test to see if username already exists]
Database.isUsernameTaken = function(data,callBack){
    db.users.find({username:data.username}, function(err,res){
        if(res.length > 0)
            callBack(true);
        else
            callBack(false);
    })
};

//Add user
Database.addUser = function(data,callBack){
    db.users.insert({username:data.username,password:data.password}, function(err){
            callBack();
    })
};
