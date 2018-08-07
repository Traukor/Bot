const Discord = require('discord.js');
const low = require('lowdb');
var mysql = require('mysql');
var pool = mysql.createPool({
    host     : process.env.host,
    user     : process.env.user,
    password : process.env.pass,
    database : process.env.database,
    migrate: "safe"
});

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('database.json');
const db = low(adapter);
const token = process.env.TOKEN;

db.defaults({ games: [], xp: [] }).write();


var client = new Discord.Client();
var randNum = 0;
var prefix = "!";
var mention = "<@406944400418275333>";
var interval;
var intervalGame;
var nextId;

