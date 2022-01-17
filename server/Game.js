const ChessGame = require('./../tChess/ChessGame.js');

class Game {
    constructor(id, io, gameStartFEN, startTime = 30, addedTime = 10) {
        this.io = io;
        this.id = id;
        this.startFEN = gameStartFEN;

        this.startTime = startTime;
        this.addedTime = addedTime;

        this.timers = { w: this.startTime, b: this.startTime };

        this.moveBegining = 0;
        this.endTimeout;

        this.started = false;
        this.ended = false;
        this.winner = null;

        this.draw = { w: 0, b: 0 };

        this.game = new ChessGame(this.startFEN);

        this.players = [];
        this.viewers = [];

        Game.games.push(this);
    }
    sendInfosToPlayers() {
        if(this.ended) return;

        let moves = this.legalMoves();

        if(this.ended) return;

        let side = this.game.activeSide;

        let noTurn = this.players.find(p => p.side === (side === 'w' ? 'b' : 'w'));
        noTurn.emit('no-turn');

        this.moveBegining = Date.now();

        this.io.in(this.id).emit('time', { mode: 'stop', side: noTurn.side, time: this.timers[noTurn.side], start: this.moveBegining });

        let turn = this.players.find(p => p.side === this.game.activeSide);
        turn.emit('turn', moves);

        this.io.in(this.id).emit('time', { mode: 'start', side: turn.side, time: this.timers[turn.side], start: this.moveBegining });

        this.endTimeout = setTimeout((function() {
            this.endGame(side === 'w' ? 'b' : 'w', 't');
        }).bind(this), this.timers[side] * 1000);
    }
    legalMoves() {
        if(this.ended) return;

        this.legal = this.game.getLegalMoves();

        if(!this.legal.length) {
            let checkmated = this.game.isCheckmate(this.game.activeSide);
            if(checkmated) return this.endGame(this.game.activeSide === 'w' ? 'b' : 'w', 'c');
            else return this.endGame('none', 's')
        }

        return this.legal;
    }
    move(socket, move) {
        if(this.ended) return;

        if(socket.side !== this.game.activeSide) return false;
        if(!move.from || !move.to) return false;

        let m = this.legal.filter(mo => mo.from === move.from && mo.to === move.to);
        if(move.promotion) m = m.find(mo => mo.promotion === move.promotion);
        else m = m[0];

        let time = this.computeTimeLeft();

        this.timers[this.game.activeSide] = time;

        clearTimeout(this.endTimeout);

        this.game.makeMove(m, true);

        this.io.in(this.id).emit('fen', this.game.currentFEN().split(' ')[0]);
        this.io.in(this.id).emit('move', m);
        this.io.in(this.id).emit('history', this.game.histo.slice(this.game.histo.length - 1));

        this.stopOffer(socket.side === 'w' ? 'b' : 'w');

        return true;
    }
    undo() {
        this.game.undo();
        this.io.in(this.id).emit('undo', { FEN: this.game.currentFEN().split(' ')[0] });
        this.io.in(this.id).emit('undoHistory');

        clearTimeout(this.endTimeout);

        //"2bqkbnr/r2p2pp/pp3p2/2p1P3/8/2NBQ3/PPP2PPP/R1B2RK1"

        this.sendInfosToPlayers();
    }
    get activeSide() {
        return this.game.activeSide;
    }
    computeTimeLeft(add = true) {
        let spentTime = (Date.now() - this.moveBegining) / 1000;
        spentTime = Math.floor(spentTime);

        if(add) spentTime -= this.addedTime;

        return this.timers[this.game.activeSide] - spentTime;
    }
    start() {
        this.started = true;
        this.ended = false;
        return this.sendInfosToPlayers();
    }
    addSocketAsPlayer(socket, side = 'w') {
        if(this.players.length >= 2) return this.addSocketAsViewer(socket);
        if(!side) return;

        let sameSidePlayer;
        if(this.players.length) sameSidePlayer = this.players.find(player => player.side === side);

        if(sameSidePlayer) side = (side === 'w' ? 'b' : 'w');

        socket.gameId = this.id;
        socket.side = side;
        this.players.push(socket);

        socket.emit('joined', { id: this.id, side: side, fen: this.game.currentFEN() });
    }
    addSocketAsViewer(socket) {
        this.viewers.push(socket);

        socket.emit('joined', { id: this.id, side: 'v', fen: this.game.currentFEN() });

        let side = this.game.activeSide;

        socket.watchingId = this.id;

        let wLeft = this.timers.w;
        let bLeft = this.timers.b;

        socket.emit('time', { mode: (this.started && side === 'w' ? 'start' : 'stop'), side: 'w', time: wLeft, start: this.moveBegining });
        socket.emit('time', { mode: (this.started && side === 'b' ? 'start' : 'stop'), side: 'b', time: bLeft, start: this.moveBegining });
    }
    handleLeave(socket) {
        switch(socket.side) {
            case 'w':
                this.endGame('b', 'd');
                break;
            case 'b':
                this.endGame('w', 'd');
                break;
            case 'v':
                this.viewers.splice(this.viewers.indexOf(socket), 1);
                break;
        }
    }
    resign(socket) {
        if(!this.started || this.ended) return;

        switch(socket.side) {
            case 'w':
                this.endGame('b', 'r');
                break;
            case 'b':
                this.endGame('w', 'r');
                break;
        }
    }
    offerDraw(socket) {
        if(!this.started || this.ended) return;

        if(socket.side !== 'w' && socket.side !== 'b') return;

        let other = socket.side === 'w' ? 'b' : 'w';
        let otherDraw = this.draw[other];

        let started = Date.now();

        if(otherDraw + 30000 >= started) return this.endGame('none', 'a');

        this.draw[socket.side] = started;

        this.players.find(s => s.side === other).emit('drawOffer', started);
    }
    declineDraw(socket) {
        if(!this.started || this.ended) return;

        if(socket.side !== 'w' && socket.side !== 'b') return;

        let other = socket.side === 'w' ? 'b' : 'w';

        this.stopOffer(other);
    }
    acceptDraw(socket) {
        if(!this.started || this.ended) return;

        if(socket.side !== 'w' && socket.side !== 'b') return;

        let other = socket.side === 'w' ? 'b' : 'w';

        let otherDraw = this.draw[other];

        if(otherDraw + 30000 >= Date.now()) return this.endGame('none', 'a');

        this.stopOffer(other);
    }
    stopOffer(side) {
        this.draw[side] = 0;

        this.io.in(this.id).emit('stopOffer');
    }
    endGame(winner, reason) {
        this.started = false;
        if(this.players.length < 2) return this.players = [];
        if(this.ended) return;
        this.ended = true;
        this.winner = winner;

        let wTime = this.timers.w;
        let bTime = this.timers.b;

        this.stopOffer('w');
        this.stopOffer('b');

        if(this.game.activeSide === 'w') {
            wTime = this.computeTimeLeft(false);
            this.timers.w = wTime;
        }
        else {
            bTime = this.computeTimeLeft(false);
            this.timers.b = bTime;
        }

        this.io.in(this.id).emit('time', { mode: 'stop', side: 'w', time: wTime });
        this.io.in(this.id).emit('time', { mode: 'stop', side: 'b', time: bTime });

        return this.io.in(this.id).emit('ended', { winner: winner, reason: reason });
    }
}
Game.games = [];

module.exports = Game;
