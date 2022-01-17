const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const session = require('express-session')({
	secret: process.env.SESSION_SECRET || 'secret',
	resave: true,
	saveUninitialized: true,
	maxAge: new Date(253402300000000)
});

const Game = require('./Game.js');

app.use(session);
app.use(require('express').json({strict: false}));
app.use(require('express').urlencoded({ extended: false }));

const sharedsession = require("express-socket.io-session");
io.use(sharedsession(session));

let filesDir = __dirname + "/pages/";

// + ------------------------
// # Pages
// + ------------------------

app.get('/', (req, res) => {
	res.sendFile(filesDir + 'index.html');
});
app.get('/chessGame', (req, res) => {
	res.redirect('/');
});
app.get('/chessGame/:id', (req, res) => {
	let id = req.params.id;
	if(!id) return res.redirect('/');
	if(!Game.games.find(game => game.id === id)) return res.redirect('/');

    res.sendFile(filesDir + 'board.html');
});
app.get('/customizeGame', (req, res) => {
	return res.sendFile(filesDir + 'customizeGame.html');
});
app.get('/createGame', async (req, res) => {
	let id;
	while(!id || findGame(id)) id = String(Math.floor(Math.random() * 10**7));

	let startFEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	baseTime = 15*60;
	add = 10;

	if(req.query && req.query.startFEN && typeof(req.query.startFEN) === 'string') startFEN = req.query.startFEN;
	if(req.query && req.query.time && typeof(req.query.time) === 'string') {
		let time = req.query.time.split('+');
		if(time.length === 2) {

			baseTime = (parseInt(time[0]) || 15) * 60;
			add = parseInt(time[1]) || 10;
		}
	}

	await new Game(id, io, startFEN, baseTime, add);

	return res.redirect('/chessGame/' + id);
});

// + ------------------------
// # Socket.io
// + ------------------------

function findGame(id) {
	return Game.games.find(game => game.id === id);
}

io.on('connection', socket => {
	socket.on('connectToGame', data => {
		if(socket.gameId || socket.watchingId) return;

		if(!data.gameId || !data.joinSide) return;

		let game = findGame(data.gameId);

		if(!game) return;
		socket.join(data.gameId);

		if(data.joinSide === 'viewer') return game.addSocketAsViewer(socket);
		game.addSocketAsPlayer(socket, data.joinSide);

		if(game.players.length >= 2 && !game.ended && !game.started) return game.start();
	});
	socket.on('move', move => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		let m = game.move(socket, move);

		if(m) game.sendInfosToPlayers();
	});
	socket.on('offerDraw', () => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		game.offerDraw(socket);
	});
	socket.on('getHistory', () => {
		let id = socket.gameId || socket.watchingId;

		if(!id) return;

		let game = findGame(id);
		if(!game) return;

		socket.emit('history', game.game.histo);
	});
	socket.on('resign', () => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		game.resign(socket);
	});
	socket.on('drawAccept', () => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		game.acceptDraw(socket);
	});
	socket.on('drawDecline', () => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		game.declineDraw(socket);
	});
	socket.on('undo', move => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		game.undo();
	});
    socket.on('disconnect', () => {
		if(!socket.gameId) return;

		let game = findGame(socket.gameId);
		if(!game) return;

		game.handleLeave(socket);
    });
});

// + ------------------------
// # Hosting
// + ------------------------

app.use(require('express').static(__dirname + "/../public"));

app.use((req, res, next) => {
	res.status(404).send('404 Not Found');
});

const port = process.env.PORT || 80;
http.listen(port, function() {
	console.log(`Server running on port: ${port}`)
});
