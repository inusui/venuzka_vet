const http = require('http');
const requestListener = function(req, res){
    res.writeHead(200);
    res.end("hola")
}
const server = http.createServer(requestListener);
server.listen(8000);

const nano = require('nano')("http://admin:admin@localhost:5984");

function cosultar(NameDB, registro){
    nano.db.use(NameDB).get(registro).then((body) => {
		console.log(body);
	});
}
function insert(NameDB, registro){
    nano.use(NameDB).insert(registro, (err, body)=>{
        
        if(err) { 
            //response.writeHead(500, { "Content-Type": "text/plain" }); 
            //response.end("Inserting book failed. " + err + "\n"); 
            console.log("Inserting book failed. " + err + "\n"); 
        } else { 
            //response.writeHead(200, { "Content-Type": "text/plain" }); 
            console.log("Libro insertado");
        } 
        
    });
}
insert('libreria', {  _id:"a1",  Tittle:"What",    Autor:"JK",   Type:"Pasta Dura - 2002", ISBN:846515886455438  });

cosultar('libreria', "a1")