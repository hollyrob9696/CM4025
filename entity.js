var initPack = {player:[],bullet:[]};
var removePack = {player:[],bullet:[]};

Entity = function(param){
    var self = {
        x:0,
        y:0,
        spdX:0,
        spdY:0,
        id:"",
        map:'default'
    };
    if(param){
        if(param.x)
            self.x = param.x;
        if(param.y)
            self.y = param.y;
        if(param.map)
            self.map = param.map;
        if(param.id)
            self.id = param.id;
    }
    self.update = function(){
        self.updatePosition();
    };
    self.updatePosition = function(){
        self.x += self.spdX;
        self.y += self.spdY;
    };
    self.getDistance = function(pt){
        return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
    };
    return self;
};

Entity.getFrameData = function () {
    var pack = {
        initPack:{
            player:initPack.player,
            bullet:initPack.bullet
        },
        removePack:{
            player:removePack.player,
            bullet:removePack.bullet
        },
        updatePack:{
            player:Player.update(),
            bullet:Bullet.update()
        }
    };
    initPack.player = [];
    initPack.bullet = [];
    removePack.player = [];
    removePack.bullet = [];
    return pack;
};

Player = function(param){
    var self = Entity(param);
    self.number = "" + Math.floor(10 * Math.random());
    self.username = param.username;
    self.wins = param.wins;
    //Might be wrong ^^ maybe param.progress
    self.pressingRight = false;
    self.pressingLeft = false;
    self.pressingUp = false;
    self.pressingDown = false;
    self.pressingShoot = false;
    self.mouseAngle = 0;
    self.maxSpd = 10;
    self.hp = 100;
    self.hpMax = 100;
    self.shield = (Math.random() * 100);
    self.shieldMax = 100;
    self.score = 0;

    var super_update = self.update;
    self.update = function(){
        self.updateSpd();
        super_update();

        if(self.pressingShoot){
            self.shootBullet(self.mouseAngle);
        }
    };

    self.shootBullet = function(angle){
        Bullet({
            parent:self.id,
            angle:angle,
            x:self.x,
            y:self.y,
            map:self.map
        })
    };

    self.updateSpd = function(){
        if(self.pressingRight)
            self.spdX = (self.maxSpd - 5);
        else if(self.pressingLeft)
            self.spdX = -(self.maxSpd - 5);
        else
            self.spdX = 0;

        if(self.pressingUp)
            self.spdY = -(self.maxSpd - 5);
        else if(self.pressingDown)
            self.spdY = (self.maxSpd - 5);
        else
            self.spdY = 0;
    };

    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            number:self.number,
            hp:self.hp,
            hpMax:self.hpMax,
            shield:self.shield,
            shieldMax:self.shieldMax,
            score:self.score,
            map:self.map,
            wins:self.wins,
        }
    };

    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            hp:self.hp,
            shield:self.shield,
            score:self.score,
            map:self.map,
            wins:self.wins
        }
    };

    Player.list[self.id] = self;

    initPack.player.push(self.getInitPack());
    return self;
};
Player.list = {};
Player.onConnect = function(socket,username,progress){
   var map = 'default';
   var wins = 0;
    if(Math.random() < 0.2)
        map = 'second';
    var player = Player({
        username:username,
        id:socket.id,
        map:map,
        socket:socket,
        wins:wins
    });
    /*player.inventory.refreshRender();*/

    socket.on('keyPress',function(data){
        if(data.inputId === 'left')
            player.pressingLeft = data.state;
        else if(data.inputId === 'right')
            player.pressingRight = data.state;
        else if(data.inputId === 'up')
            player.pressingUp = data.state;
        else if(data.inputId === 'down')
            player.pressingDown = data.state;
        else if(data.inputId === 'shoot')
            player.pressingShoot = data.state;
        else if(data.inputId === 'mouseAngle')
            player.mouseAngle = data.state;
    });

    socket.on('changeMap',function(data){
        if(player.map === 'default')
            player.map = 'second';
        else if(player.map === 'second')
            player.map = 'third';
        else if(player.map === 'third')
            player.map = 'four';
        else player.map = 'default';

    });

    socket.on('superAttack', function(){
        for(var i = 0 ; i < 360; i++)
            player.shootBullet(i);
    })

    socket.on('smallAttack', function(){
        for(var i = 0 ; i < 180; i++)
            player.shootBullet(i);
    })

   /* socket.on('refreshHp', function () {
        player.hp === 100;
    })*/

    socket.on('sendMsgToServer', function(data){
        for(var i in SOCKET_LIST){
            SOCKET_LIST[i].emit('addToChat', player.username + ": " + data);
        }
    });

    socket.on('sendPrivToServer', function(data){
        var recipientSocket = null;
        for(var i in Player.list)
            if(Player.list[i].username === data.username)
                recipientSocket = SOCKET_LIST[i];
        if(recipientSocket === null){
            socket.emit('addToChat', 'Player not online');
        } else {
            recipientSocket.emit('addToChat', 'From ' + player.username + ': ' + data.message);
            socket.emit('addToChat', 'To ' + data.username + ': ' + data.message);
        }
    });

    socket.emit('init', {
        selfId:socket.id,
        player:Player.getAllInitPack(),
        bullet:Bullet.getAllInitPack()
    })
};

Player.getAllInitPack = function () {
    var players = [];
    for(var i in Player.list)
        players.push(Player.list[i].getInitPack());
    return players;
};


Player.onDisconnect = function(socket){
    let player = Player.list[socket.id];
    if(!player)
        return;
    delete Player.list[socket.id];
    removePack.player.push(socket.id);
};
Player.update = function(){
    var pack = [];
    for(var i in Player.list){
        var player = Player.list[i];
        player.update();
        pack.push(player.getUpdatePack());
    }
    return pack;
};

Bullet = function(param){
    var self = Entity(param);
    self.id = Math.random();
    self.angle = param.angle;
    self.spdX = Math.cos(param.angle/180*Math.PI) * 10;
    self.spdY = Math.sin(param.angle/180*Math.PI) * 10;
    self.parent = param.parent;
    self.timer = 0;
    self.toRemove = false;
    var super_update = self.update;
    self.update = function(){
        if(self.timer++ > 100)
            self.toRemove = true;
        super_update();

        for(var i in Player.list){
            var p = Player.list[i];
            if(self.map === p.map && self.getDistance(p) < 32 && self.parent !== p.id) {
                var shooter = Player.list[self.parent];
                shooter.score += 1;
                if (shooter.score > 1000)
                    shooter.shield += 10;
                if (shooter.score > 2000)
                    shooter.shield += 20;
                if (p.shield > 0) {
                    p.shield -= 1;
                } else {
                    p.hp -= 1;
                }
                    if (p.hp <= 0) {
                        if (shooter) {
                            shooter.score += 2;
                            p.hp = p.hpMax;
                            p.score -= 1;
                            p.x = Math.random() * 500;
                            p.y = Math.random() * 500;
                            }
                    }
                    self.toRemove = true;
            }
        }
    };

    for(var i in Bullet.list){
        var x = 50;
        var y = 50;
            for (var i = 0; i < 1000; i++) {
                if (self.x == x && self.y == y) {
                    self.toRemove = true;
                }
            }
    }

    self.getInitPack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
            map:self.map
        }
    };

    self.getUpdatePack = function(){
        return{
            id:self.id,
            x:self.x,
            y:self.y,
        }
    };

    Bullet.list[self.id] = self;
    initPack.bullet.push(self.getInitPack());
    return self;
};
Bullet.list = {};

Bullet.update = function(){
    var pack = [];
    for(var i in Bullet.list) {
        var bullet = Bullet.list[i];
        bullet.update();
        if (bullet.toRemove){
            delete Bullet.list[i];
            removePack.bullet.push(bullet.id);
        }else
            pack.push(bullet.getUpdatePack());
    }
    return pack;
};

Bullet.getAllInitPack = function () {
    var bullets = [];
    for(var i in Bullet.list)
        bullets.push(Bullet.list[i].getInitPack());
    return bullets;
};
