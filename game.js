'use strict';
const request = require('request-promise-native');

module.exports = {
  'play': play,
};

function play(gameUrl, debug, proxy) {
  const options = {
    'json': true,
    'forever': true,
    'proxy': proxy,
  };
  debug && console.log(`start playing ${gameUrl}`);
  return request(gameUrl, options)
    .then(response => {
        playTurn(response, gameUrl, debug, proxy)
    });
}

function playTurn(response, gameUrl, debug, proxy) {
  const move = getMove(response);
  const options = {
    'json': true,
    'forever': true,
    'body': move,
    'proxy': proxy,
  };
  if (debug) {
    console.log(JSON.stringify(response));
    console.log('\nsending request ', move);
  }
  return request.post(gameUrl, options)
    .then(response => {
      if (debug) {
        setTimeout(function () {
          playTurn(response, gameUrl, true, proxy);
        }, 3000);
      } else {
        playTurn(response, gameUrl, false, proxy);
      }
    })
}

/**
 * Get coordinates (start point) of next move.
 * @param data
 * @returns {{x: number, y: number}}
 */
function getMove(data) {
  return {
    'x': Math.floor(Math.random() * 5),
    'y': Math.floor(Math.random() * 5),
  }
}
