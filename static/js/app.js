app = {
    game: null,
    width: 1500,
    height: 770,
    cursor: null,
    score: 0,
    competitors: {}
};

$(function(){
    $('.info-board').hide();
    $("#start").click(init);

    if(document.domain){
        app.online = true;

        app.socket = io.connect('http://'+ document.domain +':5000/race');
        app.socket.on('connect', function() {
            console.log('Connected to the server');
        });

        app.socket.on('data', function(msg) {
            console.log('Got data for ', msg);
            app.ground.addSegment(msg.pos * app.ground.SEGMENT_LENGTH, msg.height);
        });

        app.socket.on('broadcast_positions', function(msg) {
            show_competitors(msg);
        }); 

        app.socket.on('player_info', function(msg) {
            console.log('Player info', msg);
            app.sid = msg;
        });

        app.socket.on('track_info', function(msg) {
            console.log('Track info', msg);
            $('#info div:nth-child(1) p').text('Current track: ' + msg.name);
        });
    }  
});

function init() {
    $('.info-board').toggle("slide", { direction: "left" }, 700);
    $('.start-menu').hide();
    $('.overlay').overlay();
       
    app.game = new Phaser.Game(app.width, app.height, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update });
}

function preload() {
    app.game.load.image('moto', 'static/assets/moto.png');
    app.game.load.image('wheel', 'static/assets/wheel.png');
    app.game.load.physics('motophysics','static/assets/moto.json');
}

function create() {
    // adding P2 physics to the game
    app.game.world.setBounds(0, 0, 19200, 1000);
    app.game.physics.startSystem(Phaser.Physics.P2JS);
    app.game.physics.p2.restitution = 0.4;
    
    app.game.stage.backgroundColor = '#DDDDDD';
    
    // setting gravity
    app.game.physics.p2.gravity.y = 1500;
    app.game.physics.p2.friction = 15;
    
    app.arrows = app.game.input.keyboard.createCursorKeys();
    app.spaceKey = app.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    
    app.ground = new Ground(app.game);
    app.player = new Player(app.game);
    app.ground.updateSegments(); 
    app.game.camera.follow(app.player.car.body);

    app._competitors = app.game.add.group();
}

function update() {
    if (app.arrows.left.isDown) {
        app.player.accelerate_car(-4);
    }
    if (app.arrows.right.isDown) {
        app.player.accelerate_car(4);
    }
    if (app.spaceKey.isDown) {
        app.player.accelerate_car(0);
    }

    app.ground.updateSegments();

    $('#info div:nth-child(2)').text("Distance: "+app.score.toFixed(2)+" m");
    if(app.player.car.body.x>app.score) app.score = app.player.car.body.x;

    app.player.send_car_position();
}

function show_competitors(data) {
    if(!app.game || !app._competitors)return;
    for(var sid in data){
        if(sid != app.sid){
            var player_data = data[sid];
            if(!app.competitors[sid]){
                app.competitors[sid] = new Competitor(app._competitors);
            }
            app.competitors[sid].updatePosition(player_data);
        }
    }
}

function explosion() {
    //window.alert("you exlode");
}
