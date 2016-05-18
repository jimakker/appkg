function setIframeContent(html) {
  iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(html);
}

function loadFromUrl(url, callback) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function() {
    if (this.status >= 200 && this.status < 400) {
      var uInt8Array = new Uint8Array(this.response);
      if(callback) return callback(null, uInt8Array);
      initDB(uInt8Array);
    } else {
      if(callback) return callback(this.message, null);
    }
  };
  request.onerror = function() {
    // There was a connection error of some sort
    if(callback) return callback("error", null);
  };
  request.send();
}


function exportDB(callback){
  var arraybuff = db.export();

  var password = window.prompt("Set encryption password. Leave empty if you don't want to encrypt it.");
  if(password) {
    var passwordConfirm = window.prompt('Confirm encryption password');
    if(passwordConfirm && passwordConfirm === password) {
      options = {
        data: arraybuff,
        passwords: [password],
        armor: false
      };
      openpgp.encrypt(options).then(function(ciphertext) {
        arraybuff = ciphertext.message.packets.write();
        _export();
      });
    } else {
      return alert("Passwords don't match");
    }
  } else {
    _export();
  }
  function _export(){
    if(callback) return callback(arraybuff);
    var blob = new Blob([arraybuff]);
    var url = window.URL.createObjectURL(blob);
    window.location = url;
    window.URL.revokeObjectURL(url);
  }
}
