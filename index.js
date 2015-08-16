var Bot = require('node-telegram-bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db'); //don't even think of opening it #NSFW
var request = require("request")
var urlparse = require("url")


//Create DB'sqlite3

db.serialize(function() {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='urls'", [], function(err, row) {
    //console.log(row)
    if (typeof row == 'undefined') {
      db.run('Create table urls ( url text , subreddit char(50))'); //If it's a new file
      db.run('create table people (id integer primary key not null, subreddit char(50))');
    }
  })
});

function handle_message(message){
  var subr;
  if( typeof message.text != 'undefined'){
    db.get('select subreddit from people where id=?',message.chat.id,function result(err,row){
      if(typeof row == 'undefined') {
        console.log(row)
        change_subreddit('pics',message,send_message);
        console.log('Selecting default !!!!ERROR!!!! subredit for user'+message.chat.id);
      }
      else{
        subr = row['subreddit'];
        console.log('Selected subredit for user '+message.chat.id+' '+subr);
        if (message.text.split(" ")[0] == 'refresh') {               //bot doesn't support / command yet or custom commands hence the statement
          console.log("Calling With param" + parseInt(message.text.split(" ")[1]));
          var url = "http://www.reddit.com/r/"+row['subreddit']+".json";
          get_data(url, parseInt(message.text.split(" ")[1]),0,subr);
          send_message(subr,message);

        } else if(message.text.split(" ")[0] == 'change'){       //change the subreddit, global. Needs userwise stuff
          subr=message.text.split(" ")[1];
          change_subreddit(subr,message,send_message);
          console.log('Changed subreddit');
        }
        else{
          send_message(subr,message);
        }

        }

      });
    }
  }

function send_message(subr,message){

          db.get("SELECT url FROM urls where subreddit=?  ORDER BY RANDOM() LIMIT 1;",subr, function(err, row) {
            if(typeof row != 'undefined'){
            bot.sendMessage({
              chat_id: message.chat.id,
              text: row['url']
            });
          }else{
            get_data("http://www.reddit.com/r/"+subr+".json",2,0,subr);  //needs to trigger the message #TODO
            console.log('No data for this subreddit, queue fetch'+subr);
          }

          })
}

function insert_data(x,sbr) {
  db.get("SELECT EXISTS(SELECT 1 from urls where url=?  )", x, function(err, row) {

    if (row['EXISTS(SELECT 1 from urls where url=?  )'] == 0) { //wtf row result type
      db.run('INSERT into urls(url,subreddit) values(?,?) ', x,sbr);

      //insert only if it doesn't exist
      console.log('Inserted into' +sbr)

    } else {
      //console.log("nope"); //Data Already present
    }

  })
}

function change_subreddit(sub_reddit,message,callback) {
     //TODO history
  db.run('insert or replace into people(id,subreddit) values(?,?)',message.chat.id,sub_reddit);
  callback(sub_reddit,message);
}

function get_data(url, page_no,j,subr) {
  var next = '';
  request(url, function(error, response, body) {
    if (!error) {
      try{
      body = JSON.parse(body);
    }
    catch(err){
      console.log(url);
    } try{
      next = body['data']['after'];
      for (var i = 0; i < body['data']['children'].length; i++) {
        x = body['data']['children'][i]['data']['url'];
        insert_data(x,subr);
      }
      console.log(j+" j "+page_no)
      if (j <= page_no) {
        j++;
        data=urlparse.parse(url)
        console.log('Fetching' + url + ' '+j);
        get_data("http://"+data.hostname+data.pathname+ '?count=' + (j * 25).toString() + '&after=' + next,page_no, j,subr); //Recursive call to download the next page as specified
      }
      else{
        //callback();
      }
    }catch(err){
      console.log(err);
    }

    } else {
      console.log(error)
    }
  })
}
var bot = new Bot({
    token: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' //secret stuff
  })
  .on('message', function(message) {
    handle_message(message);
    console.log(message);
  })
  .start();
