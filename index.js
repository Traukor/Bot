const Discord = require('discord.js');
const low = require('lowdb');
var mysql = require('mysql');
var pool = mysql.createPool({
    host     : process.env.host,
    user     : process.env.user,
    password : process.env.pass,
    database : process.env.database
});

const FileSync = require('lowdb/adapters/FileSync');
const adapter = new FileSync('database.json');
const db = low(adapter);
const token = process.env.TOKEN;

db.defaults({ games: [] }).write();


var client = new Discord.Client();
var randNum = 0;
var prefix = "!";
var mention = "<@406944400418275333>";
var memberCount = client.users.size;
var serverCount = client.guilds.size;
var interval;
var intervalGame;
var nextId;

try {
    pool.getConnection(function(err, connection) {
        connection.query('Select count(*) as rowCount from message', function (error, results, fields) {
            if (error) console.log("error select count => " + error);
            nextId = (Number(results[0].rowCount));
            console.log("Dernier ID message => " + nextId);
        });
        connection.release();
    });
    client.on("ready", () => {
        var servers = client.guilds.array().map(g => g.name).join(",");
        ChangeGamePlayed();
        intervalGame = setInterval(() => {
            ChangeGamePlayed();
        }, 3600000);
        interval = setInterval(() => {
            GetMessageDay();
        },
            86400000);
        console.log("-----------------------------------------------");
        console.log("[!] Connexion en cours ...\n[!] Veuillez patienter! \n	[!] Les évènements sont après ! :)\n	[!] Les préfix sont : " + prefix + "\n	[!] Mentions : " + mention + " \n [!] Nombre de membre: " + memberCount + "\n [!] Nombre de serveurs: " + serverCount + "\n ");
    });
    
    client.login(token);
} catch (error) {
    console.log("Erreur help => " +error);
}


client.on("message", message => {
    if (message.author.bot) return;
    var testPrefix = message.content.substring(0,1);
    if(testPrefix != prefix) return;
    var msgAuthor = message.author.id;
    //message arguments control
    
    var args = message.content.substring(prefix.length).split(" ");
    
        
    switch (args[0].toLowerCase()) {
        case "help":
            try {
                console.log("case help");
                var commandeBot = "!help => afficher les commandes \n";
                commandeBot += "!getmessage => affiche tous les messages automatiques enregistré avec leur id\n";
                commandeBot += "!toggledayloop <id> => active/désactive un message automatique\n";
                commandeBot += "!Dayloop <day> <channel> <message> => enregistre un <message> à répéter tous les <day> jours dans le <channel>";
                var help_embed = new Discord.RichEmbed()
                    .setColor('#D9F200')
                    .addField("Commande du bot", "Voici les commandes du bot \n" + commandeBot)
                    .setFooter("Toujours en développement");
                message.channel.sendEmbed(help_embed);
            } catch (error) {
                console.log("Erreur help => " +error);
            }
            break;

        //Enregistre un message à envoyer régulièrement sur un salon
        case "dayloop":
            try {
                console.log("case dayloop");
                var day = 0;
                var m = "";
                nextId = nextId +1;
                try {
                    var day = Number(args[1]);
                }
                catch (e) {
                    message.reply("Le nombre de jour n'est pas correct");
                    console.log("Erreur dayloop nombre de jour || " + e);
                    break;
                }
                for (var i = 3; i < args.length; i++) {
                    if (m === "")
                        m += args[i];
                    else
                        m += " " + args[i];
                }
                var channelId = client.channels.find("name", args[2]);
                if (!channelId) {
                    message.channel.send("exception => le channel n'a pas été trouvé");
                    console.log(`exception dayloop => channel ${args[2]} introuvable`);
                }
                else {
                    
                        InsertMessage(nextId,day,channelId.id,m);
                    var message_embed = new Discord.RichEmbed()
                        .setColor("#00F911")
                        .setTitle("Message enregistré")
                        .addField("message => ", m)
                        .setFooter(`Le message sera envoyé tous les ${args[1]} jours à partir de maintenant dans le salon ${args[2]}`);
                    if(!interval)
                    {
                        interval = setInterval(() => {
                            GetMessageDay();
                        },
                            86400000);
                    }
                    message.channel.send(message_embed);
                    var channel = client.channels.get(channelId.id);
                    var m_Embed = new Discord.RichEmbed()
                        .setColor("#FFFF00")
                        .addField("Annonce", `${m}`);
                    channel.send(m_Embed);
                }
            } catch (error) {
                message.channel.send("Une erreur est survenue, \n Merci de bien vouloir laisser un message à @Traukor pour pouvoir régler ce problème.");
                console.log("Erreur dayloop => " + error);
            }
            break;

        //Récupère les messages enregistré avec leur ID
        case "getmessage":
            try{
                console.log("case getmessage");
                var messageObject = Object.values(db.get('messageDay').value());
                var m_embed = new Discord.RichEmbed()
                    .setColor("#FFFF00");
                if (messageObject.length > 0) {
                    m_embed.setTitle(`[ACTIF] : [ID] : [TEXTE]`);
                    for (var i = 0; i < messageObject.length; i++) {
                        m_embed.addField("================", `${messageObject[i].actif ? "actif" : "inactif"} : ${messageObject[i].id} : ${messageObject[i].message}`);
                    }
                }
                else {
                    m_embed.addField("Aucun message enregistré", "La commande !Dayloop <day> <channel> <message> permet de le faire");
                }
                message.channel.send(m_embed);
                
            } catch (error) {
                console.log("Erreur getmessage => " + error);
            }
            break;

        //Supprime un message récurent de la base
        case "toggledayloop":
            try{
                console.log("case toggledayloop");
                var idMessage = Number(args[1]);
                if (isNaN(idMessage)) {
                    message.channel.send("L'id doit être valide");
                }
                else {
                    var messageObject = Object.values(db.get('messageDay').find({ id: Number(args[1]) }).value());
                    var actif = !messageObject[5];
                    if (messageObject.length < 1) {
                        message.channel.send("l'id doit exister");
                    }
                    else {
                        db.get('messageDay').find({ id: Number(args[1]) }).assign({
                            actif: actif
                        }).write();
                        message.channel.send(`Le message "${messageObject[4]}" est desormais ${actif ? "actif" : "inactif"}`);
                    }
                }
                
            } catch (error) {
                console.log("Erreur dayloop => " + error);
            }
            break;

        default :
            if(args[0] != ""){
                console.log(`Envoie de commande erroné de ${message.author.username} => ${message}`);
                message.channel.send(`La commande !${args[0]} n'existe pas.`);
            }
            break;
    }
    console.log("sortie switch");
});

function GetMessageDay() {
    try {
        connection.connect();
        var query = process.env.selectAllMessage;
        connection.query(query, function (error, results, fields) {
            if (error) console.log(error);
            results.array.forEach(element => {
                console.log(`le message ${element.message} est envoyé tous les ${element.nbJour} dans le salon ${element.channel}`);
                // ajouter 1 à la valeur currentDay
            });
        });
        
    } catch (error) {
        console.log("erreur GetMessageDay => " + error);
    }
}

function ChangeGamePlayed()
{
    try{

        var messageObject = Object.values(db.get('games').value());
        var randomNumber = Math.floor(Math.random() * Math.floor(messageObject.length));
        var currentGame = messageObject[randomNumber];
        console.log("Jeux en cours => " + currentGame["titre"])
        client.user.setPresence({ game: { name: currentGame["titre"], type: 0 } });
    }
    catch(error)
    {
        console.log("erreur ChangeGamePlayed => " + error)
    }
}

function InsertMessage(id,nbJour,channel,message)
{
    var insert = process.env.insertMessage;
    insert = insert.replace('[ID]',id).replace('[NBJOUR]',nbJour).replace('[CHANNEL]',channel).replace('[MESSAGE]',message).replace('[TOGGLE]',1).replace('[CURRENTDAY]',0);
    console.log(insert);
    pool.getConnection(function(err, connection) {
        connection.query(insert, function (error, results, fields) {
            if (error) console.log("erreur insert => " + error);
        });
    });
}

function GetNextId()
{
    pool.getConnection(function(err, connection) {
        connection.query('Select count(*) as rowCount from message', function (error, results, fields) {
            if (error) console.log("error select count => " + error);
            nextId = (Number(results[0].rowCount) + 1);
            console.log((Number(results[0].rowCount) + 1));
            console.log("after rowcount nextId => " + nextId);
        });
    });
}