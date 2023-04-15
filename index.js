require('dotenv').config();
var express = require('express');
var app = express();
var bodyParser = require("body-parser");
const cors = require('cors');
const { MongoClient } = require('mongodb');
const dns = require('dns');
const urlparser = require('url');



//*****General config */
//Config MOngoDB conecction
const client = new MongoClient(process.env.MONGO_URI)//establece la conx con mongodb
const db = client.db("urlshortner")//crea la bd
const urls = db.collection("urls")//crea la collection o tabla llamada urls


//configuracion para conectarse usando Mongoose a la BD de mongodb, muestra en consola si se conecto!
/*
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('Connected to mongodb!'));

//muestra en consola datos en caso de no conectarse a mongodb
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Mongodb error connection:'));

let urls = new mongoose.Schema({
  name: String
});

let Url = mongoose.model("Url", urls);
*/



//***************MIDLEWARES******
app.use(cors());
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//referenciando la ruta default a la carpeta public
app.use('/public', express.static(`${process.cwd()}/public`));


//*****ROUTES***********/
//Ruta por defecto
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});

//Ruta inserta datos en bd "POST from form in index.html name="url" "
app.post('/api/shorturl', function (req, res) {
  console.log(req.body)
  const url = req.body.url //pasando los datos que me llegan mediante POST a $url para usarla abajo
  const dnslookup = dns.lookup(urlparser.parse(url).hostname, async (err, address) => {
    if (!address) {
      res.json({ error: "Invalid Url" })
    }
    else {
      const urlCount = await urls.countDocuments({})//aunmenta en 1 la variable urlCount
      //objetos con los datos a introducir
      const urlDoc = {
        url,
        short_url: urlCount
      }
      const result = await urls.insertOne(urlDoc)//insertando en la bd en collection urls lo introducido en $urlDoc
      console.log(result);
      res.json({ original_url: url, short_url: urlCount })

    }
  })
  // res.json({ greeting: 'hello API' });
});

//API que te redirige al dominio original segun dado un id en la url, los datos se obtendran de la BD.
app.get('/api/shorturl/:short_url', async(req, res)=>{
  const shorturl=req.params.short_url//captura el id
  const urlDoc=await urls.findOne({short_url: +shorturl})//busca en la base de datos
  res.redirect(urlDoc.url)//redirige a url encontrada segun id antes dado.
})

//*********config server
// listen for requests :)
var listener = app.listen(process.env.PORT || 3000, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
