import express from 'express';
import fs, { read } from 'fs';

const app = express();
const readData = () => {
    const data = fs.readFileSync("./db.json");
    console.log(JSON.parse(data));
}
readData();

app.get("/", (req, res) => {
    res.send("¡Hola desde la API!!");
});

app.listen(3000, () => {
  console.log('API escuchando en el puerto 3000');
});