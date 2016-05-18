var dbFileElm = document.getElementById('dbfile');
var iframe = document.getElementById('appframe');
var filename = document.getElementById('filename');
var fileid = document.getElementById('fileid');
var filecontent = document.getElementById('filecontent');
var filemenu = document.getElementById('filemenu-files');

iframe.src="presets/welcome.html"

function initDB(Uints){
  try {
    var db = window.db = new SQL.Database(Uints);
    var res = db.exec("SELECT * FROM file");
    startApp(db);
  } catch(e) {
    var password = prompt('password');
    var message = '';
    try {
      message = openpgp.message.read(Uints)
    } catch (e) {
      console.log(e);
      return alert('invalid file');
    }
    options = {
      message: message,
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

dbFileElm.onchange = function() {
  var f = dbFileElm.files[0];
  var r = new FileReader();
  r.onload = function() {
    var Uints = new Uint8Array(r.result);
    initDB(Uints);
  }
  r.readAsArrayBuffer(f);
}

filecontent.onkeyup = function() {
  files[filename.value].content = filecontent.value;
  setIframeContent(files['index.html'].content);
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
  setIframeContent(files['index.html'].content);
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

if(window.location.hash){
  loadFromUrl(window.location.hash.substr(1), function(err, dbArray){
    if(err){
      console.log(err);
      alert("Error loading appkg from url");
    } else {
      initDB(dbArray);
    }
  })
}
