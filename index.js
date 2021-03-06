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

try {
    pool.getConnection(function(err, connection) {
        connection.query(process.env.selectAllMessage, function (error, results, fields) {
            if (error) console.log("error select count => " + error);
            var rows = JSON.parse(JSON.stringify(results));
            console.log(rows);
            nextId = rows[rows.length - 1].id;
            console.log("Dernier ID message => " + nextId);
        });
        connection.release();
    });
    
    client.on("ready", () => {
        var servers = client.guilds.array().map(g => g.name).join(",");
        GetMessageDay(false);
        ChangeGamePlayed();
        intervalGame = setInterval(() => {
            ChangeGamePlayed();
        }, 3600000);
        interval = setInterval(() => {
            GetMessageDay(true);
        },
            60000);
        console.log("-----------------------------------------------");
        console.log("[!] Connexion en cours ...\n[!] Veuillez patienter! \n	[!] Les évènements sont après ! :)\n	[!] Les préfix sont : " + prefix + "\n	[!] Mentions : " + mention + " \n [!] Nombre de membre: " + client.users.size + "\n [!] Nombre de serveurs: " + client.guilds.size + "\n ");
    });
    
    client.login(token);
    
} catch (error) {
    console.log("Erreur help => " +error);
}


client.on("message", message => {
    if (message.author.bot) return;
    var testPrefix = message.content.substring(0,1);
    var msgAuthor = message.author.id;
    if(testPrefix != prefix) 
    {
        // xp bonus ici
        if(db.has('xp').value())
        {
            
        }
        var exist = db.get('xp')
                        .find({ membreId: message.author.id})
                        .assign({xp : n => n + 1})
                        .write();



        return;
    }
    
    //message arguments control
    
    var args = message.content.substring(prefix.length).split(" ");
    
        
    // switch (args[0].toLowerCase()) {
        // case "help":
        //     try {
        //         console.log("case help");
        //         var commandeBot = "!help => afficher les commandes \n\n";
        //         if(message.member.roles.some(r=>["Admin", "Responsable Multigaming"].includes(r.name)) )
        //         {
        //             commandeBot += "!getmessage => affiche tous les messages automatiques enregistré avec leur id\n\n";
        //             commandeBot += "!toggledayloop <id> => active/désactive un message automatique\n\n";
        //             commandeBot += "!Dayloop <day> <heure:minute> <channel> <message>  => enregistre un <message> à répéter tous les <day> jours à <heure:minute> heure dans le <channel> \n\n";
        //         }
        //         commandeBot += "!monXP => affiche mon xp et mon lvl (en cours de dev ...)";
        //         var help_embed = new Discord.RichEmbed()
        //             .setColor('#D9F200')
        //             .addField("Commande du bot", "Voici les commandes du bot \n" + commandeBot)
        //             .setFooter("Toujours en développement, toutes les méthodes ne sont pas encore active");
        //         message.channel.send(help_embed);
        //     } catch (error) {
        //         console.log("Erreur help => " +error);
        //     }
        //     break;

        // //Enregistre un message à envoyer régulièrement sur un salon
        // case "dayloop":
        //     try {
        //         if(!message.member.roles.some(r=>["Admin", "Responsable Multigaming"].includes(r.name)) )
        //             return message.reply("Vous n'avez pas la permissions de faire ça!");
        //         console.log("case dayloop");
        //         var day = 0;
        //         var m = "";
        //         nextId = nextId +1;
        //         try {
        //             var day = Number(args[1]);
        //         }
        //         catch (e) {
        //             message.reply("Le nombre de jour n'est pas correct");
        //             console.log("Erreur dayloop nombre de jour || " + e);
        //             return;
        //         }
        //         for (var i = 4; i < args.length; i++) {
        //             if (m === "")
        //                 m += args[i];
        //             else
        //                 m += " " + args[i];
        //         }
        //         var channelId = client.channels.find("name", args[3]);
        //         if (!channelId) {
        //             message.channel.send("exception => le channel n'a pas été trouvé");
        //             console.log(`exception dayloop => channel ${args[3]} introuvable`);
        //             return;
        //         }
        //         var time = args[2].split(":");
        //         if(time.length != 2)
        //         {
        //             message.channel.send("merci de fournir l'heure sous forme 'hh:mm'");
        //             return;
        //         }
        //         else {
                    
        //                 InsertMessage(nextId,day,channelId.id,m,args[2]);
        //             var message_embed = new Discord.RichEmbed()
        //                 .setColor("#00F911")
        //                 .setTitle("Message enregistré")
        //                 .addField("message => ", m)
        //                 .setFooter(`Le message sera envoyé tous les ${args[1]} jours à ${args[2]} heure dans le salon ${args[3]}`);
        //             if(!interval)
        //             {
        //                 interval = setInterval(() => {
        //                     GetMessageDay();
        //                 },
        //                     86400000);
        //             }
        //             message.channel.send(message_embed);
        //             var channel = client.channels.get(channelId.id);
        //             var m_Embed = new Discord.RichEmbed()
        //                 .setColor("#FFFF00")
        //                 .addField("Annonce", `${m}`);
        //             channel.send(m_Embed);
        //         }
        //     } catch (error) {
        //         message.channel.send("Une erreur est survenue, \n Merci de bien vouloir laisser un message à @Traukor pour pouvoir régler ce problème.");
        //         console.log("Erreur dayloop => " + error);
        //     }
        //     break;

        // //Récupère les messages enregistré avec leur ID
        // case "getmessage":
        //     try{
        //         if(!message.member.roles.some(r=>["Admin", "Responsable Multigaming"].includes(r.name)) )
        //             return message.reply("Vous n'avez pas la permissions de faire ça!");
        //         console.log("case getmessage");
        //         pool.getConnection(function(err, connection) {
        //             connection.query(process.env.selectAllMessage, function (error, results, fields) {
        //                 if (error) console.log(error);
        //                 var rows = JSON.parse(JSON.stringify(results));
        //                 var m_embed = new Discord.RichEmbed()
        //                     .setColor("#FFFF00")
        //                     .setTitle(`[ACTIF] : [ID] : [TEXTE]`);
        //                 if (rows.length > 0) {
        //                     for(var element of rows) {
        //                         console.log(`le message "${element.message}" est envoyé tous les ${element.nbJour} jours dans le salon ${element.channel}`);
        //                         m_embed.addField("================", `${element.toggle == 1 ? "actif" : "inactif"} : ${element.id} : ${element.message}`);
        //                     }
        //                 }
        //                 else {
        //                     m_embed.addField("Aucun message enregistré", "La commande !Dayloop <day> <channel> <message> permet de le faire");
        //                 }
        //                 message.channel.send(m_embed);
        //             });
        //         });
                
        //     } catch (error) {
        //         console.log("Erreur getmessage => " + error);
        //     }
        //     break;

        // //Supprime un message récurent de la base
        // case "toggledayloop":
        //     try{
        //         if(!message.member.roles.some(r=>["Admin", "Responsable Multigaming"].includes(r.name)) )
        //             return message.reply("Vous n'avez pas la permissions de faire ça!");
        //         console.log("case toggledayloop");
        //         var idMessage = Number(args[1]);
        //         if (isNaN(idMessage)) {
        //             message.channel.send("L'id doit être valide");
        //         }
        //         else {
        //             pool.getConnection(function(err, connection) {
        //                 connection.query("Select * from message where message.id = " + idMessage, function(err,res,field){
        //                     if (err) console.log(err);
        //                     var rows = JSON.parse(JSON.stringify(res));
        //                     if(rows.length > 0)
        //                     {
        //                         console.log(rows);
        //                             console.log(rows[0].toggle);
        //                                 var query = process.env.updateToggle.replace("[TOGGLE]", rows[0].toggle == 0 ? 1 : 0).replace("[ID]",idMessage);
        //                                 connection.query(query, function (error, results, fields) {
        //                                     if (error) console.log(error);
        //                                     else 
        //                                     {
        //                                         message.channel.send(`Le message "${rows[0].message}" est desormais ${rows[0].toggle == 0 ? "actif" : "inactif"}`);
        //                                     }
        //                                 });
        //                     }
        //                     else
        //                         message.channel.send("l'id doit exister");
        //                 });
        //             });
        //         }
        //     } catch (error) {
        //         console.log("Erreur dayloop => " + error);
        //     }
        //     break;

        // default :
        //     if(args[0] != ""){
        //         console.log(`Envoie de commande erroné de ${message.author.username} => ${message}`);
        //         message.channel.send(`La commande !${args[0]} n'existe pas.`);
        //     }
        //     break;
    //}
    console.log("sortie switch");
});

function GetMessageDay(incrementCurrentDay) {
    try {
        pool.getConnection(function(err, connection) {
            updateXp(connection);
            connection.query(process.env.selectAllMessage, function (error, results, fields) {
                if (error) console.log(error);
                var rows = JSON.parse(JSON.stringify(results));
                for(var element of rows) {
                    if(element.toggle == 1)
                    {
                        var dateNow = new Date();
                        var currentHour = dateNow.getHours() + 2;
                        currentHour = (currentHour < 10 ? "0" : "") + currentHour;
                        var currentMin = dateNow.getMinutes();
                        currentMin = (currentMin < 10 ? "0" : "") + currentMin;
                        if(element.heure == currentHour + ":" + currentMin)
                        {
                            if(element.nbJour == element.currentDay)
                            {
                                console.log(`le message "${element.message}" est envoyé tous les ${element.nbJour} jours dans le salon ${element.channel} à ${element.heure} heure`);
                                var mess = new Discord.RichEmbed().setColor("#FFFF00").addField("Annonce",element.message);
                                var channel = client.channels.get(element.channel);
                                channel.send(mess);
                                var query = process.env.updateCurrentDay.replace("[NEWCURRENTDAY]",0).replace("[ID]",element.id);
                                connection.query(query, function(err,res,field) {
                                    if(err) console.log(err);
                                });
                            }
                            else if(incrementCurrentDay)
                            {
                                // ajouter 1 à la valeur currentDay
                                var query = process.env.updateCurrentDay.replace("[NEWCURRENTDAY]",element.currentDay + 1).replace("[ID]",element.id);
                                connection.query(query, function(err,res,field) {
                                    if(err) console.log(err);
                                });
                            }
                        }
                    }
                }
            });
            connection.release();
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

function InsertMessage(id,nbJour,channel,message,heure)
{
    message = message.replace('\\','\\\\');
    var insert = process.env.insertMessage;
    insert = insert.replace('[ID]',id)
                    .replace('[NBJOUR]',nbJour)
                    .replace('[CHANNEL]',channel)
                    .replace('[MESSAGE]',message)
                    .replace('[TOGGLE]',1)
                    .replace('[CURRENTDAY]',0)
                    .replace('[HEURE]',heure);
    console.log(insert);
    pool.getConnection(function(err, connection) {
        connection.query(insert, function (error, results, fields) {
            if (error) console.log("erreur insert => " + error);
        });
        connection.release();
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
        connection.release();
    });
}

function updateXp(connection)
{

    connection.query('UPDATE xp SET xp.xp = ' + 'test' + 'WHERE xp.membreId = ' + 'test');
    return;
}