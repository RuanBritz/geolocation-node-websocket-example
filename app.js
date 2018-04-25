const https = require('https')
const express = require('express')
const bodyParser = require('body-parser')
const moment = require('moment')
const fs = require('fs')
const path = require("path");
const WebSocket = require('ws');

// == Variables
let users = [];

// == constants ==
const port = 3000;

// == Setup ==
// Https
const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}
// use express for server
var app = express();
// parse application/x-www-form-urlencoded 
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json 
app.use(bodyParser.json())


// == Requests ==
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
})

app.post('/logCoordinates', function (req, res) {
  let body = req.body;
  let lat = body.lat;
  let long = body.long;
  let ip = req.connection.remoteAddress;
  var now = moment();

  let user = {
    lat: lat,
    long: long,
    ip: ip
  };

  var index = users.indexOf(users.find(x => x.ip === ip));

  if(index > -1){
    users.splice(index, 1);
  }
  users.push(user);

  console.log(`${now.toLocaleString()} :   Lat:${lat} Long:${long}  - IP: ${ip}`);
  send(users)

  res.sendStatus(200);
})


// == Start server ==
const server = https.createServer(httpsOptions, app).listen(port, () => {
  console.log('server running at ' + port)
});

// use websockets
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws, req) {
  console.log('new websocket connection');

  ws.on('close', function () {
    console.log("client closed connection!");
  });

  ws.on('error', function (e) {
    console.log("error!: " + e);
  })
});

wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};

function send(data) {
  wss.broadcast(JSON.stringify(data));
}