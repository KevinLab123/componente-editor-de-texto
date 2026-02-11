const express = require('express');

const app = express();
const cors = require('cors');
app.use(cors());

//middlewares funciones ejecutadas antes de llegar a las rutas
app.use(express.json());//para que el servidor pueda entender los datos en formato json
app.use(express.urlencoded({extended: false}));//para que el servidor pueda entender los datos enviados desde formularios


//routes
app.use(require('./routes/router'));

app.listen(3000);
console.log('Server is running on port 3000');
