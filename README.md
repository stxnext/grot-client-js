# GROT game client JS

## Token

To play GROT you have to sign in with GitHub account on
[GROT game server](http://grot-server.games.stxnext.pl).
After sign in you will get token that you have to register in game client.

## Instalation

Clone GROT client repository
```
git clone https://github.com/stxnext/grot-client-js
cd grot-client-js
```

Install dependencies
```
npm install
```

Register your unique token in the client
```
node index.js register <your-unique-token>
```

## Play

### Play one move in loop (development mode)

```
node index.js play_devel
```

### Play full game against STX Bot

```
node index.js play_vs_bot
```

### Play full game against other players

Create your onw room
```
node index.js new_room <room-title> --max-players=10
```

Or find `<room_id>` on [/games](http://grot-server.games.stxnext.pl/games).

Join game
```
node index.js join <room_id>
```

Wait for game start (when room is full or after X minutes or manually).

Room owner can start game manually
```
node index.js start <room_id>
```

Check results [/games/room_id](http://grot-server.games.stxnext.pl/games/<room_id>).


## Sample response

Sample response from the server that describe current game state
(score, available moves, board state - points and arrows' direction).

```js
response = {
    "score": 0,  // obtained points
    "moves": 5,  // available moves
    "moved": [null, null],  // your last choice [x, y]
    "board": [
        [
            {
                "points": 1,
                "direction": "up",
                "x": 0,
                "y": 0,
            },
            {
                "points": 0,
                "direction": "down",
                "x": 1,
                "y": 0,
            }
        ],
        [
            {
                "points": 5,
                "direction": "right",
                "x": 0,
                "y": 1,
            },
            {
                "points": 0,
                "direction": "left",
                "x": 1,
                "y": 1,
            }
        ]
    ]
}
```
