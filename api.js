import express from "express";
import fs, { read } from "fs";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

const readData = () => {
  try {
    const data = fs.readFileSync("./db.json");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error en la API, error: ", err);
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync("./db.json", JSON.stringify(data));
  } catch (err) {
    console.error("Error en la API, error: ", err);
  }
};

app.get("/", (req, res) => {
  res.send("¡Hola desde la API!!");
});

app.get("/content", (req, res) => {
  const data = readData();
  if (data) {
    res.json(data.content);
  } else {
    res.status(500).json({ error: "Error al leer los datos" });
  }
});

app.get("/content/:id", (req, res) => {
  const data = readData();
  const id = parseInt(req.params.id);
  const contentItem = data.content.find((item) => item.id === id);
  res.json(contentItem);
});

app.post("/content", (req, res) => {
  const data = readData();
  const body = req.body;
  const newContent = {
    id: data.content.length + 1,
    ...body,
  };
  data.content.push(newContent);
  writeData(data);
  res.json(newContent);
});

app.put("/content/:id", (req, res) => {
  const data = readData();
  const body = req.body;
  const id = parseInt(req.params.id);
  const contentIndex = data.content.findIndex((item) => item.id === id);
  data.content[contentIndex] = { ...data.content[contentIndex], ...body };
  writeData(data);
  res.json(data.content[contentIndex]);
});

app.delete("/content/:id", (req, res) => {
    const data = readData();
  const id = parseInt(req.params.id);
    const contentIndex = data.content.findIndex((item) => item.id === id);
    data.content.splice(contentIndex, 1);
    writeData(data);
    res.json({ message: "Contenido eliminado" });
});

app.listen(3000, () => {
  console.log("API escuchando en el puerto 3000");
});
