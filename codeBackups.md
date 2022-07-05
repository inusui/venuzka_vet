# el de pinguear a la lista de bases de datos

```
couch.listDatabases().then(function(dbs){
  console.log(dbs)
}
)/*.catch(e => {
    if(e.syscall){
        console.log('a')
    }else{
        console.log("Valla problema\n" + e)
    }

}
    )*/
```