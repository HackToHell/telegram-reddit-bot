var Bot = require('node-telegram-bot');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:'); //don't even think of opening it #NSFW
var request = require("request")
var urlparse = require("url")
var subreddit = 'pics';  //cause damn

//Create DB'sqlite3

db.serialize(function() {
  db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='urls'", [], function(err, row) {
    //console.log(row)
    if (typeof row == 'undefined') {
      db.run('Create table urls ( url text , subreddit char(50))'); //If it's a new file
    }
  })
})
function handle_message(message){

}
function insert_data(x) {
  db.get("SELECT EXISTS(SELECT 1 from urls where url=?  )", x, function(err, row) {

    if (row['EXISTS(SELECT 1 from urls where url=?  )'] == 0) { //wtf row result type
      db.run('INSERT into urls(url,subreddit) values(?,?) ', x,subreddit);
      db.run('create table people (id integer not null, subreddit char(50))');
      //insert only if it doesn't exist
      //console.log('Success')

    } else {
      //console.log("nope"); //Data Already present
    }

  })
}

function change_subreddit(sub_reddit) {
  subreddit=sub_reddit;     //TODO history
  db.run('insert or replace into people(id,subreddit) values(?,?)',id,sub_reddit);
}

function get_data(url, page_no,j) {
  var next = '';
  request(url, function(error, response, body) {
    if (!error) {
      try{
      body = JSON.parse(body);
    }
    catch(err){
      console.log(url);
    }
      next = body['data']['after'];
      for (var i = 0; i < body['data']['children'].length; i++) {
        x = body['data']['children'][i]['data']['url'];
        insert_data(x);
      }
      //console.log(j+" j "+page_no)
      if (j <= page_no) {
        j++;
        data=urlparse.parse(url)
        console.log('Fetching' + (page_no-i) + 'Page');
        get_data("http://"+data.hostname+data.pathname+ '?count=' + (j * 25).toString() + '&after=' + next,page_no, j); //Recursive call to download the next page as specified


      }

    } else {
      console.log(error)
    }
  })
}
var bot = new Bot({
    token: '120692931:AAEZWwWszNBrhqdr-M2MF8KhhKEds_Pk2sM' //secret stuff
  })
  .on('message', function(message) {
    if( typeof message.text != 'undefined'){

    if (message.text.split(" ")[0] == 'refresh') {               //bot doesn't support / command yet or custom commands hence the statement
      console.log("Calling With param" + parseInt(message.text.split(" ")[1]));
      var url = "http://www.reddit.com/r/"+subreddit+".json";
      get_data(url, parseInt(message.text.split(" ")[1]),0);

    } else if(message.text.split(" ")[0] == 'change'){       //change the subreddit, global. Needs userwise stuff
      subreddit = message.text.split(" ")[1];
    }
  }

    db.get("SELECT url FROM urls where subreddit=?  ORDER BY RANDOM() LIMIT 1;",subreddit, function(err, row) {

      if(typeof row != 'undefined'){
      bot.sendMessage({
        chat_id: message.chat.id,
        text: row['url']
      });
    }else{
      get_data("http://www.reddit.com/r/"+subreddit+".json",2,0);  //needs to trigger the message #TODO
    }

    })
    console.log(message);
  })
  .start();
