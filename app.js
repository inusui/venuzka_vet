const express = require ('express');
const bodyParser = require('body-parser');
const path = require('path');

/*Confirm*/

//Couch
const NodeCouchDb = require('node-couchdb');
const couch = new NodeCouchDb({
    auth:{
        user:'admin',
        password: 'admin'
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

app.post('/'+dbname+'/add', function(req,res){
    
    let PetID = req.body.id;
    let PetName =  req.body.PetName;
    let PetOwnerName= req.body.PetOwnerName;
    let Raza= req.body.Raza;
    let Sexo = req.body.Sexo;
    let Birth = req.body.Birth;
    let OwnerPhone = req.body.OwnerPhone;
    //res.send(name,autor,isbn);
    couch.uniqid().then(function(){
        //let id = ids[0];
        couch.insert(dbname, {
            _id: PetID,
            PetName:PetName,
            PetOwnerName:PetOwnerName,
            Raza:Raza,
            Sexo:Sexo,
            Birth:Birth,
            OwnerPhone: OwnerPhone

        }).then(
            function(data, headers, status){
                res.redirect('/')
            },
            function(error){
                res.send(error)
            }
        );
    });
})

app.post('/'+dbname+'/delete/:id', function(req, res){
    let id = req.params.id;
    let rev = req.body.rev;
    
        couch.del(dbname, id, rev).then(
            function(data, headers, status){
                
                res.redirect('/');
            },function(error){console.log(error)}
        )
    
    
});

//Select by id
app.post('/select', function(req,res){
   
    let id = req.body.PetIDBuscar;
    //console.log(id)
    couch.get(dbname, id).then(
        function(data, headers, status){
            
            res.render('select',{
                consulta:data.data
            });
        }, function(error){
            res.send(error);
            res.render('select');
            console.log("(╯°□°）╯︵ ┻━┻ Error"+ error)
        }
    );
});
//Update
app.post('/update', function(req, res){
    //let id
    let hora_cita = req.body.hora_cita;
    let motivo = req.body.motivo;
    let detalles = req.body.detalles;
    console.log("Los detalles son Importantes y mas si son muchas lineas\n" + detalles)
    let id =req.body.identificador;
    let rev = req.body.rev;
    if(motivo.includes('otro')){
        console.log("^_____^")
        motivo = req.body.otro_valor
    }
    //motivo = {motivo:detalles,fecha:hora_cita}
    

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

            let registro = STRINGviejosDatos+',{"hora": "'+hora_cita+'" ,"razon": "' + motivo + '", ' +  ' "detalles": "' + detalles + '" }]}'
            let estoyTilteado = JSON.parse(registro)
            console.log(
                "Sera un JSON>\n",estoyTilteado
                /*(╯°□°）╯︵ ┻━┻
                    (╯°□°）╯︵ ┻━┻
                        (╯°□°）╯︵ ┻━┻
                            (╯°□°）╯︵ ┻━┻
                                (╯°□°）╯︵ ┻━┻
                                    (╯°□°）╯︵ ┻━┻
                #TODO: debes enviar la peticion en formato JSON, dentro de una variable, por tanto debes por concatenacion 
                construir una varibale con todo el JSON que mandaras en el update
                （︶^︶）*/
            )
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
            res.send(error);
            res.render('select');
            console.log("(╯°□°）╯︵ ┻━┻ Error"+ error)
        }
    );

    console.log(id," rev ", rev," Motivo: ", motivo,"\n" )
    
    
});


app.listen(3000, function(){
    console.log("Server iniciado en el puerto 3000");
    
});