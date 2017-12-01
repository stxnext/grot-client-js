#!/usr/bin/env node
'use strict';
const program = require('commander');
const fs = require('fs');
const game = require('./game');
const os = require('os');
const path = require('path');
const request = require('request-promise-native');

const SERVER = 'http://grot-server.games.stxnext.pl';
const TOKEN_FILE = path.join(os.homedir(), '.grot_token');
const TOKEN_LENGTH = 36;

program
  .option('--debug', 'debug flag')
  .option('--proxy <proxyUrl>', 'proxy url');

program
  .command('register <token>')
  .description('Register your unique token')
  .action(function(token) {
    try {
      validateToken(token);
      fs.writeFileSync(TOKEN_FILE, token, {'encoding': 'utf-8'});
    } catch (error) {
      console.error(`
        ${error.message}
        Sign in to ${SERVER} to get your token.
      `);
      process.exit(1);
    }
    console.log('Token have been saved.');
  });

program
  .command('new_room <title>')
  .description('Create new game room')
  // .option('--title <title>', 'Room title')
  .option('--board-size <boardSize>', 'GROT board size', 5)
  .option('--max-players <maxPlayers>', 'Maximum players in the room', 15)
  .option('--allow-multi <allowMulti>', 'Allow users to connect multiple time with the same token', false)
  .option('--auto-start [autoStart]', 'Automatically start game after X minutes', 5)
  .option('--auto-restart [autoRestart]', 'Automatically clear results after X minutes', 5)
  .action(function(title, command){
    newRoom(
      command.parent.proxy,
      command.maxPlayers,
      command.autoStart,
      command.autoRestart,
      false,
      title,
      command.boardSize,
      command.allowMulti
    )
      .then(roomId => console.log(`New game room_id is ${roomId}`))
  });

program
  .command('remove <roomId>')
  .description('Remove game room')
  .action(removeRoom);

program
  .command('start <roomId>')
  .description('Start game')
  .action(function (roomId) {
    const url = `${SERVER}/games/${roomId}`;
    const token = getToken();
    const payload = {'token': token};
    const options = {
      'json': true,
      'body': payload
    };
    request.post(url, options)
      .catch(error => {
        console.error(error.message);
        process.exit(1);
      });
  });

program
  .command('join <roomId>')
  .description('Join game room and wait for start')
  .option('--alias <userAlias>', 'Added to your name displayed on results page.')
  .action(function (roomId, command) {
    const token = getToken();
    const gameUrl = `${SERVER}/games/${roomId}/board?token=${token}`
      + (command.userAlias ? `&alias=${command.userAlias}` : '');
    console.log(`Check game results ${SERVER}/games/${roomId}`);
    game.play(gameUrl, command.parent.debug, command.parent.proxy)
      .then(() => showResults(roomId));
  });

program
  .command('results <roomId>')
  .description('Show game results')
  .action(function (roomId) {
    showResults(roomId);
  });

program
  .command('play_devel')
  .description('Play one move in loop (development mode)')
  .action(function (command) {
    const token = getToken();
    const gameUrl = `${SERVER}/games/000000000000000000000000/board?token=${token}`;
    game.play(gameUrl, true, command.parent.proxy);
  });

/**
 * @TODO: fix bug: 404 after creating a room
 */
program
  .command('play_vs_bot')
  .description('Play full game against STX Bot')
  .action(function (command) {
    const token = getToken();
    command.parent.debug && console.log('Creating new room');
    newRoom(command.parent.proxy, 2, 1, null, true)
      .then(roomId => {
        try {
          command.parent.debug && console.log(`Room ${roomId} created`);
          const gameUrl = `${SERVER}/games/${roomId}/board?token=${token}`;
          game.play(gameUrl, command.parent.debug, command.parent.proxy);
          showResults(roomId);
        } finally {
          removeRoom(roomId)
        }
      })
  });

program.parse(process.argv);
if (!program.args.length) program.help();

function getToken() {
  try {
    const token = fs.readFileSync(TOKEN_FILE, {'encoding': 'utf-8'});
    validateToken(token);
    return token;
  } catch (error) {
    console.error(`
      ${error.message}
      Sign in to ${SERVER} to get your token.
      Use 'node index.js register token' before using other commands.
    `);
    process.exit(1);
  }
}

function validateToken(token) {
  if (token.length !== TOKEN_LENGTH) {
    throw new Error(`Invalid token ${token}`);
  }
}

function newRoom(
  proxy,
  maxPlayers,
  autoStart,
  autoRestart,
  withBot,
  title,
  boardSize,
  allowMulti
) {
  const url = `${SERVER}/games`;
  const token = getToken();
  const payload = {
    'title': title || null,
    'board-size': boardSize || 5,
    'max-players': maxPlayers || 15,
    'auto-start': autoStart || 5,
    'auto-restart': typeof autoRestart !== 'undefined' ? autoRestart : 5,
    'allow-multi': allowMulti || false,
    'with-bot': withBot,
    'token': token
  };
  const options = {
    'json': true,
    'forever': true,
    'body': JSON.stringify(payload),
    'proxy': proxy,
  };
  return request.post(url, options)
    .then(body => JSON.parse(body).room_id)
    .catch(error => {
      console.error(`Failed to create new room. ${error.message}`);
      process.exit(1);
    });
}

function removeRoom(roomId) {
  const token = getToken();
  const url = `${SERVER}/games/${roomId}?token=${token}`;
  request.delete(url)
    .catch(error => {
      console.error(error.message);
      process.exit(1);
    })
}

function showResults(roomId) {
  const token = getToken();
  const url = `${SERVER}/games/${roomId}/results/?token=${token}`;
  const headers = {
    'Accept': 'application/json'
  };
  const options = {
    'headers': headers
  };

  request(url, options)
    .then(response => {
      const results = response.players.map(
        (player, index) => `${index + 1}. ${player.login} - ${player.score}`
      );
      console.log(results.join('\n'));
    })
}
