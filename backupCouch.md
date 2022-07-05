# Vista Citas
## backup del ciclo que medio sirve por cUrl
```
function(doc){
  for(var i in doc.Citas){
    emit(doc._id,{Citas:[doc.Citas[i]] })
  }
}
```