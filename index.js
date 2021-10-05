const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const client = new Discord.Client();
const google = require('googleapis');
const ytpl = require('ytpl');
require('dotenv/config');

const youtube = new google.youtube_v3.Youtube({
  version: 'v3',
  auth: process.env.GOOGLE_KEY
});

const TOKEN = process.env.TOKEN_DISCORD;

const prefix = '#';

const servidores = {
  'server': {
    connection: null,
    dispatcher: null,
    queue: [],
    playing: false,
    currentPlaying: 0
  }
};

const ytdlOptions = {
  filter: 'audioonly'
};

const getApp = (guildId) => {
  const app = client.api.applications(client.user.id);
  if(guildId) {
    app.guilds(guildId);
  }
  return app;
}

client.on("ready", () => {
  console.log('Estou online!');
});

client.on("message", async (msg) => {

  if(!msg.guild) return;
  if(!msg.content.startsWith(prefix)) return;

  if(!msg.member.voice.channel) {
    msg.channel.send("Você precisa estar num canal de voz!");
    return;
  }

  if(msg.content === prefix + 'join') {
    try {
      servidores.server.connection = await msg.member.voice.channel.join();
    } catch (err) {
      console.log('Erro ao entrar num canal de voz!');
      console.log(err);
    }
  }

  if(msg.content === prefix + 'stop') {
    msg.member.voice.channel.leave();
    servidores.server.connection = null;
    servidores.server.dispatcher = null;
    servidores.server.queue = [];
    servidores.server.currentPlaying = 0;
    servidores.server.playing = false;
    return;
  }

  if(msg.content === prefix + 'skip') {
    servidores.server.playing = false;
    proximaMusica(msg);
    return;
  }
  
  if(msg.content === prefix + 'current') {
    msg.channel.send(`Lista atual: ${servidores.server.queue.length}`);
  }

  if(msg.content.startsWith(prefix + 'listpos')) {
    let param = msg.content.slice(9);

    if(param.length <= 0) {
      msg.channel.send('Eu preciso de uma posição para alterar a música atual!');
      return;
    };

    if(Number(param)) {
      if(servidores.server.queue.length >= Number(param) - 1) {
        servidores.server.playing = false;
        servidores.server.currentPlaying = Number(param) - 1;
        tocaMusicas(msg);
      } else {
        msg.channel.send(`Envie um número menor que o máximo da lista atual! (${servidores.server.queue.length})`);
      }
    } else {
      msg.channel.send("Envie um número válido como parâmetro!");
    }
  }

  if(msg.content.startsWith(prefix + 'play')) {
    let oQueTocar = msg.content.slice(6);

    if(oQueTocar.length <= 0) {
      msg.channel.send('Eu preciso de algo para tocar!');
      return;
    }

    if(!servidores.server.connection) {
      try {
        servidores.server.connection = await msg.member.voice.channel.join();
      } catch (err) {
        console.log('Erro ao entrar num canal de voz!');
        console.log(err);
      }
    }

    if(oQueTocar.includes('playlist')) {
      const result = await ytpl(oQueTocar, { limit: 9999 });
      for(i in result.items) {
        const current = result.items[i];
        const formatted = {
          url: current.shortUrl,
          title: current.title,
          thumb: current.thumbnails[0].url
        };
        servidores.server.queue.push(formatted);
      };
      tocaMusicas(msg);

      const playlistEmbed = new Discord.MessageEmbed()
        .setColor([64, 175, 255])
        .setAuthor('Playlist foi adicionada a lista atual!')
        .setTitle(result.title)
        .setThumbnail(result.thumbnails[0].url)
        .setURL(result.url)
        .setDescription(`${result.estimatedItemCount} músicas`);
        msg.channel.send(playlistEmbed);
      return
    }

    if (ytdl.validateURL(oQueTocar)) {
      const info = await ytdl.getInfo(oQueTocar);
      const formatInfo = {
        url: info.videoDetails.video_url,
        title: info.videoDetails.title,
        thumb: info.videoDetails.thumbnails[0].url
      };
      servidores.server.queue.push(formatInfo);
      tocaMusicas(msg);

      if(servidores.server.queue.length > 1) {
        const addEmbed = new Discord.MessageEmbed()
        .setColor([64, 175, 255])
        .setAuthor(`Música foi adicionada a lista (#${servidores.server.queue.length})`)
        .setTitle(formatInfo.title)
        .setThumbnail(formatInfo.thumb)
        .setURL(formatInfo.url);
        msg.channel.send(addEmbed);
      }
      
      } else {
      youtube.search.list({
        q: oQueTocar,
        part: 'snippet',
        fields: 'items(id(videoId),snippet(title,channelTitle,thumbnails))',
        type: 'video',
      }, (err, result) => {
        if(err) {
          console.log(err)
        } else {
          const resultList = result.data.items.map(item => ({
            title: item.snippet.title,
            channelName: item.snippet.channelTitle,
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            thumb: item.snippet.thumbnails.default.url,
          }));

          const embed = new Discord.MessageEmbed()
          .setColor([64, 175, 255])
          .setAuthor('Bot dos Moto')
          .setDescription('Escolha sua música de 1-5!');

          for (let i in resultList) {
            embed.addField(
              `${Number(i) + 1}: ${resultList[i].title}`,
              resultList[i].channelName
            );
          };

          msg.channel.send(embed)
          .then((embedMessage) => {
            const reactions = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣'];

            for(let i in reactions) {
              embedMessage.react(reactions[i]);
            };

            const filter = (reaction, user) => {
              return reactions.includes(reaction.emoji.name) && user.id === msg.author.id;
            }

            embedMessage.awaitReactions(filter, { max: 1, time: 20000, errors: ['time'] })
            .then((collected) => {
              const reaction = collected.first();
              const selectedOption = reactions.indexOf(reaction.emoji.name);

              servidores.server.queue.push(resultList[selectedOption]);
              tocaMusicas(msg);

              if(servidores.server.queue.length > 1) {
                const youAddEmbed = new Discord.MessageEmbed()
                .setColor([64, 175, 255])
                .setAuthor(`Música foi adicionada a lista (#${servidores.server.queue.length})`)
                .setTitle(resultList[selectedOption].title)
                .setThumbnail(resultList[selectedOption].thumb)
                .setURL(resultList[selectedOption].url);
                msg.channel.send(youAddEmbed);
              }
            }).catch((err) => {
              msg.reply('Você não escolheu uma opção válida');
              console.log(err);
            });
          });
        }
      });
    }
  }

  if(msg.content === prefix + 'pause') {
    servidores.server.dispatcher.pause();
  }

  if(msg.content === prefix + 'resume') {
    servidores.server.dispatcher.resume();
  }
});

const proximaMusica = (msg) => {
  if(servidores.server.queue.length > servidores.server.currentPlaying + 1) {
    servidores.server.currentPlaying = servidores.server.currentPlaying + 1;
    tocaMusicas(msg);
  } else {
    servidores.server.playing = false;
    servidores.server.currentPlaying = 0;
    servidores.server.dispatcher = null;
    servidores.server.queue = [];
  }
};

const tocaMusicas = (msg) => {
  if(!servidores.server.playing && servidores.server.queue.length > servidores.server.currentPlaying) {
    const current = servidores.server.queue[servidores.server.currentPlaying]
    const tocando = current?.url;
    servidores.server.playing = true;
    servidores.server.dispatcher = servidores.server.connection.play(ytdl(tocando, ytdlOptions));

    const musicEmbed = new Discord.MessageEmbed()
    .setColor([64, 175, 255])
    .setAuthor(`Tocando agora (#${servidores.server.currentPlaying + 1})`)
    .setTitle(current.title)
    .setThumbnail(current.thumb)
    .setURL(tocando);
    msg.channel.send(musicEmbed);

    servidores.server.dispatcher.on('finish', () => {
      servidores.server.playing = false;
      proximaMusica(msg);
    });
  }
};

client.login(TOKEN);