# Discord music bot! 📻🕺

Atualmente a maioria dos bots de música que eu usava no Discord estão parando de funcionar por conta de diretrizes do Youtube e após essa situação, resolvi criar meu próprio bot já que gosto de ouvir música :).
Segui um breve tutorial do canal [Joaõ Pimenta](https://www.youtube.com/channel/UCwjYDpz6Vp5csN-DWm_fUhQ) no Youtube, já que eu nunca tinha trabalhado com nada relacionado a criação de bots! Então iniciei o projeto com ele e depois finalizei adicionando features por conta própria.

O bot não está nada "profissional" pois fiz para uso pessoal, mas caso queria usar, segue os comandos que estão disponíveis:
* play (parametro) - Esse comando toca música no seu canal de voz atual e como parametro, recebe um link do youtube ou algo que sirva de busca para encontar sua música desejada. Se o parametro não for um link, ele usará o mesmo para realizar a busca no youtube e lhe oferece 5 opções de música para serem tocadas. Após todas essas verificações, ele adiciona a música na lista atual. (Se o link do youtube for uma playlist, ele adiciona todas as musicas na lista);
* skip - Pula para a próxima música;
* current - Mostra quantas músicas tem na lista atual;
* stop - Limpa a lista atual, para de tocar música e sai do canal de voz;
* pause - Pausa a música atual;
* resume - Retorna a música atual;
* join - Entra no canal de voz atual;

## ⚙️ Instalação
```
# Abra um terminal e copie este repositório com o comando
$ git clone https://github.com/GBDev13/nodejs-discordmusicbot.git
```

```
# Acesse a pasta da aplicação
$ cd nodejs-discordmusicbot

# Crie um arquivo .env e coloque as variaveis
# de ambiente baseado no arquivo .env.example

# Instale as dependências
$ yarn

# Inicie a aplicação
$ yarn dev

```
