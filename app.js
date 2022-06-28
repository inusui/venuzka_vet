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

app.use(express.static('res'));

/*Importaciones
app.use('/images', express.static(__dirname + '/res/images'));
app.use('/css', express.static(__dirname + '/res/css'))
*/

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
   
    couch.get(dbname, id).then(
        function(data, headers, status){
            
            res.render('select',{
                consulta:data.data
            });
        }, function(error){
            res.send(error);
            res.render('select');
        }
    );
});


app.listen(3000, function(){
    console.log("Server iniciado en el puerto 3000");
    
});