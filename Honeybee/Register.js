//Require the handshake
var handshake = require('./Handshake.js');

//AES module
var AES = require('../Utils/AES.js');


//Export main function
module.exports = function(socket, eventHandler, storage, serverPublicKey,
  callback) {
  //Start handshake
  handshake(socket, serverPublicKey, function(sessionKey) {
    //Once handshake is successful, listen for another message from registering
    socket.once('message', function(message) {
      if(Error.findError(message.error)) {
        //Error has occured
        console.log('Error: ' + Error.findError(message.error));
        return;
      }
      //Get encryption information
      var payload = message.payload;
      var iv = message.iv;
      var tag = message.tag;
      //Try to decrypt
      var decrypted;
      try {
        decrypted = AES.decrypt(sessionKey, tag, iv, message);
      } catch {
        console.log('Error: SECURITY_DECRYPTION_FAILURE');
        return;
      }
      var privateKey = decrypted.privateKey;
      storage.setItem('key', privateKey);
      storage.setItem('id', message.id)
      callback(privateKey, message.id);
    });
    //Prepare register message
    var jsonmsg = {
      register: 'register'
    };
    //Declare encrypted variable
    var encrypted;
    //Try to encrypt
    try {
      encrypted = AES.encrypt(sessionKey, iv, JSON.stringify(jsonmsg));
    } catch {
      console.log('Error: SECURITY_ENCRYPTION_FAILURE');
      return;
    }
    //Send registration message
    socket.send({type: 'register', payload: encrypted[0], tag: encrypted[1], iv: encrypted[2]});
  });
}