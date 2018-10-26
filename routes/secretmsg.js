var express = require('express');
var router = express.Router();
var request = require('superagent');

router.get('/', function(req, res, next) {
    //PLEASE NOTE: I would usually put these into either environment variables or a private config
    var auth = (new Buffer('CLIENT ID' + ':' + 'CLIENT SECRET').toString('base64')); //Parse the keys into base64

    request
    .post('https://accounts.spotify.com/api/token') //Get an application token. 
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('Authorization','Basic ' + auth)
    .send({grant_type:'client_credentials'})
    .end((err, result)=>{
        if(err){
            console.log(err)
            return;
        }
        var parsed = JSON.parse(result.res.text);
        var message = req.query.msg.split('');
        var processed =[];
        var sent = false;
        message.forEach(letter => { //This would have been better fixed with the use of promises
            request
            .get('https://api.spotify.com/v1/search')
            .set('Authorization','Bearer '+parsed.access_token)
            .query({ 
                q: '"'+letter+'"',
                type:'track',
                limit:25
             })
            .end((err,result)=>{
                if(err){
                    return;
                }
                var parsed = result.body.tracks.items;
                var found = false; 
                parsed.forEach(i=>{
                    if(letter === i.album.name[0].toLowerCase() && !found){
                        found = true;
                        var parsedString = i.album.name;
                        i.album.artists.forEach(artist=>{
                            parsedString += '-' + artist.name;
                        });
                        processed.push(parsedString);            
                    }
                    if(processed.length === message.length && !sent){
                        sent = true; 
                        var temp = [];
                        //Sort into the order of the message 
                        message.forEach(letter=>{
                            processed.forEach(string=>{
                                if(letter.toLowerCase() === string[0].toLowerCase()){
                                   temp.push(string);     
                                }
                            })
                        });
                        res.send(temp);
                    }
                });
                
            });
        });
    });
});

module.exports = router;
