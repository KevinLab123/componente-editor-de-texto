const express = require('express');

const app = express();
const cors = require('cors');
app.use(cors());

//middlewares funciones ejecutadas antes de llegar a las rutas
app.use(express.json({ limit: '200mb' })); 
app.use(express.urlencoded({ extended: false, limit: '200mb' }));


//routes
app.use(require('./routes/router'));

app.listen(3000);
console.log('Server is running on port 3000');
