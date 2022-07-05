const express = require ('express');
const bodyParser = require('body-parser');
const path = require('path');

/*Ping to Servers*/
var Ping = require('ping-wrapper');


// load configuration from file 'config-default-' + process.platform
// Only linux is supported at the moment
Ping.configure();


var ping = new Ping('20.78.56.34');
let c = 0
ping.on('ping', function(data){
	console.log('Ping %s: time: %d ms', data.host, data.time,c);
    c = c + 1
    if (c == 3) {
       
        setTimeout(function() {ping.stop();
        console.log("😀Ping Detenido")}, 1000);
        //ping.stop();
    }
});

ping.on('fail', function(data){
	console.log('Fail', data);
});



//Couch
const NodeCouchDb = require('node-couchdb');
const { nextTick } = require('process');
const couch = new NodeCouchDb({
    host: 'server01-ip.japaneast.cloudapp.azure.com',
    port:'5984',

    auth:{
        user:'admin',
        password: 'mypwd'
    }
});



const dbname = 'veterinaria'
const viewUrl = '_design/Datos-de-la-mascota/_view/PetData'



const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));


/*Importaciones
app.use('/images', express.static(__dirname + '/res/images'));
app.use('/css', express.static(__dirname + '/res/css'))
*/
app.use(express.static('res'));

app.get('/',function(req,res){
    //res.render('index');
    //res.sendFile(path.join(__dirname+'/index.html'))
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
                //let id = ids[0];
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
            res.render('error',{ veterinaria:{_id:error}});  
            console.log(error)
        }
    );
});


//Update
app.post('/update', function(req, res){
    
    let hora_cita = req.body.hora_cita;
    let motivo = req.body.motivo;
    let detalles = req.body.detalles;
    let id =req.body.identificador;
    let rev = req.body.rev;
    let proxima_cita = req.body.proxima_cita;
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

            let registro = STRINGviejosDatos+',{"Fecha": "'+hora_cita+'" ,"Motivo": "' + motivo + '", ' +  ' "Detalles": "' + detalles + '","nextDate": "' + proxima_cita +'" }]}'
            let estoyTilteado = JSON.parse(registro)
            
            console.log("Sera un JSON>\n",estoyTilteado)
             /*(╯°□°）╯︵ ┻━┻
                #TODO: debes enviar la peticion en formato JSON, dentro de una variable, por tanto debes por concatenacion 
                construir una varibale con todo el JSON que mandaras en el update
                */
            res.render('select',{ consulta:data.data});            

            /*Ahora el update*/
            couch.update(dbname, estoyTilteado).then(
                function(data, headers, status){
                    console.log(data)
                    
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