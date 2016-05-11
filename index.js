var dbFileElm = document.getElementById('dbfile');
var iframe = document.getElementById('appframe');
var filename = document.getElementById('filename');
var fileid = document.getElementById('fileid');
var filecontent = document.getElementById('filecontent');
var filemenu = document.getElementById('filemenu-files');

iframe.src="presets/welcome.html"

dbFileElm.onchange = function() {
  var f = dbFileElm.files[0];
  var r = new FileReader();
  r.onload = function() {
    var Uints = new Uint8Array(r.result);
      try {
        var db = window.db = new SQL.Database(Uints);
        var res = db.exec("SELECT * FROM file");
        startApp(db);
      } catch(e) {
        var password = prompt('password');
        options = {
          message: openpgp.message.read(Uints),
          password: password,
          format: 'binary'
        };
        openpgp.decrypt(options).then(function(plaintext) {
          try {
            var db = window.db = new SQL.Database(plaintext.data);
            var res = db.exec("SELECT * FROM file");
            startApp(db);
          } catch(e) {
            alert("Can't open appkg :(");
          }
        }).catch(function(e) {
          if(e.message === "Error decrypting message: Invalid enum value.") {
            alert('Wrong password!');
          }
        });
      }
  }
  r.readAsArrayBuffer(f);
}

filecontent.onkeyup = function() {
  files[filename.value].content = filecontent.value;
  iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(files['index.html'].content);
}

function startApp(db) {
  unloadFile();
  var res = db.exec("SELECT * FROM file");
  var files = window.files = {};
  res[0].values.map(function(v,k){
    var file = {
      id: v[0],
      filename: v[1],
      content: v[2],
      createdAt: v[3],
      updatedAt: v[4]
    }
    files[file.filename] = file;
  });
  iframe.src = 'data:text/html;charset=utf-8,' + encodeURI(files['index.html'].content);
  renderFileMenu();
}

function newApp(){
  var db = window.db = new SQL.Database();
  db.run("CREATE TABLE file (id INTEGER PRIMARY KEY, filename TEXT, content TEXT, createdAt TEXT, updatedAt TEXT);");
  db.run("INSERT INTO file (filename, content) VALUES(?, ?)", [
    'index.html',
    presets['index.html'].content
  ]);
  db.run("INSERT INTO file (filename, content) VALUES(?, ?)", [
    'index.js',
    presets['index.js'].content
  ]);
  db.run("INSERT INTO file (filename, content) VALUES(?, ?)", [
    'styles.css',
    presets['styles.css'].content
  ]);
  startApp(db);
}

function saveFile(){
  window.db.run("UPDATE file SET filename = ?, content = ? WHERE id = ?", [
    filename.value,
    filecontent.value,
    fileid.value
  ]);
  files[filename.value].content = filecontent.value;
}

function exportDB(){
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
    var blob = new Blob([arraybuff]);
    var url = window.URL.createObjectURL(blob);
    window.location = url;
    window.URL.revokeObjectURL(url);
  }
}

function renderFileMenu(){
  var output = [];
  for (var file in files) {
    var li = '<li  style="cursor:pointer;" onclick="loadFile(\'' + file + '\')">' + file + '</li>';
    output.push(li);
  }
  filemenu.innerHTML = output.join('');
}

function loadFile(file){
  filename.value = files[file].filename;
  filecontent.value = files[file].content;
  fileid.value = files[file].id;
  filecontent.disabled = false;
}

function unloadFile(){
  filename.value = '';
  filecontent.value = '';
  fileid.value = '';
  filecontent.disabled = true;
}
