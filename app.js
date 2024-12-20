const express = require ('express');
const bodyParser = require('body-parser');
const path = require('path');


/** Ping */
const exec = require("child_process").exec;
const execSync = require("child_process").execSync;

const fs = require("fs");

const hosts = ["server01-ip.japaneast.cloudapp.azure.com", "server02.southafricanorth.cloudapp.azure.com","server03.ukwest.cloudapp.azure.com", "127.0.0.1"];

const replyFromLocale = "Reply from";

const promises = [];
/**
 * Realiza una consulta de estado a todos los servidores listados
 * escribe su estado en el archivo Pinglog.txt
 */
hosts.forEach(host => {
    promises.push(new Promise((resolve, reject) => {
        exec(`ping -n 1 -w 1000 ${host}`, (err, stdout, stderr) => {
           
            let status = "offline";
            let output = stdout.toString();
            let replyFromIndex = output.indexOf(replyFromLocale);
            if (replyFromIndex > 0 && output.substring(replyFromIndex).toUpperCase().indexOf("BYTES") > 0) {
                status = "online"
            }
            resolve( new Date().toString() +"\n"+ host + " - " + status + "\n")
        })
    }))
})
Promise.all(promises).then((results) => {
    fs.appendFile("pinglog.txt", ("**********************************************************\n"), (err) => {
        if (err) { console.log(err); }
    })
    fs.appendFile("pinglog.txt", results.join("\n"), (err) => {
        if (err) { console.log(err); }
    })
    
    
});

/**
 * Realiza una consulta de estado a todos los host listados.  
 * @returns host online
 */
function getHost(){
    const hosts = ["localhost","server01-ip.japaneast.cloudapp.azure.com", "server02.southafricanorth.cloudapp.azure.com","server03.ukwest.cloudapp.azure.com"];
    //et a = null
    let i = 0
    let elHost
    for (i in hosts){
    
        let pingHost = hosts[i]
        try {
            
        var r = execSync(`ping -n 1 -w 1000 ${pingHost}`, (err, stdout, stderr) => {
            
            let status = "offline";
            let output = stdout.toString();
            let replyFromIndex = output.indexOf(replyFromLocale);
            if (replyFromIndex > 0 && output.substring(replyFromIndex).toUpperCase().indexOf("BYTES") > 0) {
                status = "online"  
            }
            resolve( pingHost + ", " + status);
            })

        if(r.toString().includes('Received = 1')){
            elHost = hosts[i];
        }
        } catch (error) {
            console.log(error);
        }
    }
    
    return elHost
}

//##                                            o(*￣▽￣*)ブ           Couch
const NodeCouchDb = require('node-couchdb');
const { resolve } = require('path');
const { render } = require('ejs');
/**
 * Realiza una llamada a la funcion getHost.
 * De esta manera se conoce que host esta disponible para levantar el servidor
 */
let couch = new NodeCouchDb({
    host: getHost(),
    port:'',

    auth:{
        user:'',
        password: ''
    }
});


console.log("♻Conexion a "+ couch._baseUrl)
const dbname = 'veterinaria'
const viewUrl = '_design/Datos-de-la-mascota/_view/PetData'

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(express.static('res'));

app.get('/',function(req,res){
    
    couch.get(dbname, viewUrl).then(
        function(data, headers, status){
            console.log(data.data.rows);
           
            res.render('index',{
                veterinaria:data.data.rows
            });
        },
        function(error){
            res.send(error);
            res.render('index');
        });
});

//  *   *   *   *   *   *   Nueva Tarjeta
app.post('/'+dbname+'/add', function(req,res){
    
    let PetID = req.body.id;
    let PetName =  req.body.PetName;
    let PetOwnerName= req.body.PetOwnerName;
    let Especie = req.body.Especie;
    let Raza= req.body.Raza;
    let Sexo = req.body.Sexo;
    let Birth = req.body.Birth;
    let OwnerPhone = req.body.OwnerPhone;
    let Direccion = req.body.Direccion;
    let Motivo = req.body.Motivo;
    let Detalles = req.body.Detalles;
    let Peso = req.body.Peso;
    let Temperatura = req.body.Temperatura;
    let hora_cita = req.body.hora_cita;
    let nextDate = req.body.nextDate;
    console.log(hora_cita + "\n" + nextDate)

    couch.get(dbname, PetID).then(
        function(data, headers, status){
            
            res.render('error',{
                veterinaria:data.data
            });
        }, function(error){
            couch.uniqid().then( function(){
                couch.insert(dbname, {
                    _id: PetID,
                    PetName:PetName,
                    PetOwnerName:PetOwnerName,
                    Especie:Especie,
                    Raza:Raza,
                    Sexo:Sexo,
                    Birth:Birth,
                    OwnerPhone: OwnerPhone,
                    Direccion: Direccion,
                    Citas:[
                        {
                        Fecha : hora_cita,
                        Motivo:Motivo,
                        Detalles:Detalles,
                        Peso:Peso,
                        Temperatura:Temperatura,
                        nextDate: nextDate
                    }
                    ]
        
                }).then(
                    function(data, headers, status){
                        res.redirect('/')
                        console.log(data.data)
                    },
                    function(error){
                        res.writeHead(500, { "Content-Type": "text/plain" }); 
                        res.end("Error\n"+error); 
                    
                    
                    }
                );
                
            });
        }
    );
    
    
})
//! *   *   *   *   *   *   Delete
app.post('/'+dbname+'/delete/:id', function(req, res){
    let id = req.params.id;
    let rev = req.body.rev;
    
        couch.del(dbname, id, rev).then(
            function(data, headers, status){
                
                res.redirect('/');
            },function(error){console.log(error)}
        )
    
});

//* *   *   *   *   *   Buscar por ID
app.post('/select', function(req,res){
   
    let id = req.body.PetIDBuscar;
    //console.log(id)
        
    couch.get(dbname, id).then(
        function(data, headers, status){
            console.log(data.data);
            res.render('select',{
                consulta:data.data
            });
            
        }, function(error){
            res.render('error',{ veterinaria:{id:error}});  
            console.log(error)
        }
    );
});


//? -------------------------------------- ------------ -------- 💿Update💿
app.post('/update', function(req, res){
    
    let hora_cita = req.body.hora_cita;
    let motivo = req.body.motivo;
    let detalles = req.body.detalles;
    let id =req.body.identificador;
    let rev = req.body.rev;
    let proxima_cita = req.body.proxima_cita;
    let temperatura = req.body.temperatura;
    let peso = req.body.peso;
    if(motivo.includes('otro')){
        
        motivo = req.body.otro_valor
    }    

    couch.get(dbname, id).then(
        
        function(data, headers, status){
           
            let viejosDatos = data.data //Requiero los datos anteriores para que no me los borre todos al hacer Update
            console.log("Asi vienen los datos viejos\n",viejosDatos)
           
            let STRINGviejosDatos = JSON.stringify(viejosDatos).replace(']','').replace(/}([^}]*)$/,'')
            /*                       ☝1️⃣                       ☝2️⃣            ☝3️⃣
            Necesito pasar a STRING los datos para darle mi formato al JSON
            1️⃣ Los datos anterioes me los trae como un objeto por tanto los paso a STRING
            2️⃣ Requiero insertar nuevos datos en el Array "Citas":[] por lo tanto remuevo el ulitmo cochete
            3️⃣ Requiero abrir todo el JSON para no crear un nuevo documento, por lo tanto remuevo la ultima llave }
            Justificacion:
                    Si no lo formate simplemente se creara un nuevo registro el cual no tendra los datos generales de la tarjeta, lo que hara complicado 
                    acceder a los nuevos registro si haco un Select especifico de las citas. 
            */

            
            /*Ahora necesito quitar el "" de _id y de _rev*/
           
            console.log("Quiete el '}'? \n", STRINGviejosDatos);

            let registro = STRINGviejosDatos+',{"Fecha": "'+hora_cita
                            + '" ,"Motivo": "' + motivo 
                            + '", ' + ' "Detalles": "' + detalles 
                            + '", "Peso": "' + peso 
                            +  '", "Temperatura": "' + temperatura  
                            + '","nextDate": "' + proxima_cita +'" }]}'

            let nuevoRegistro = JSON.parse(registro)
            
            //console.log("Sera un JSON>\n",nuevoRegistro)
             /*(╯°□°）╯︵ ┻━┻
                #TODO: debes enviar la peticion en formato JSON, dentro de una variable, por tanto debes por concatenacion 
                construir una varibale con todo el JSON que mandaras en el update
                */
            res.render('select',{ consulta:data.data});            

            /*Ahora el update*/
            couch.update(dbname, nuevoRegistro).then(
                function(data, headers, status){
                    
                    //? console.log(data) //Success
                    
                    res.render('select',{
                        consulta:data.data
                    });
                }, function(error){
                    res.send(error);
                    
                    console.log("(╯°□°）╯︵ ┻━┻ "+ error)
                }
            );
            /*FIN UPDATE*/
        }, function(error){
            
            console.log("(╯°□°）╯︵ ┻━┻ Error"+ error)
        }
    );
    
    
});


app.listen(3000, function(){
    console.log("Server iniciado en el puerto 3000");
});