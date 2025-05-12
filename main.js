"use strict";

const {MongoClient,ObjectId} = require('mongodb');
const puerto = 5000;
const express = require('express');
//const { DateTime,Interval } = require("luxon");
const app = express();
app.use(express.json());

//conectar a BD
const mongo_uri = "mongodb+srv://santiago894:P5wIGtXue8HvPvli@cluster0.6xkz1.mongodb.net/";
const mongo_cliente = new MongoClient(mongo_uri);

app.listen(puerto, ()=>{
      console.log(`Escuchando: http://localhost:${puerto}`);
})
app.get("/",(req, res ) =>{
      res.json("Bienvenido a la peticion Raiz")

})
app.get("/citas", async function (){
      res.json(await verCitas())
})
app.get("/especialistas", async function (){
      res.json(await verEspecialistas())
})
app.get("/pacientes", async function (){
      res.json(await verPacientes())
})
app.get("/sesiones/validar",async (req, res ) =>{
      res.send(await validarLogin(req.body));
})

//FUNCIONES 
//Validar Credenciales de login
async function validarLogin(objetoCredenciales){
      console.log(objetoCredenciales);
      
      await mongo_cliente.connect();
      let objetoRespuesta={"esAdmin":null,"logeado":null,"operacion":null}
      let documentoSesiones = mongo_cliente.db("hospital").collection("sesiones");
      if (objetoCredenciales.usuario.trim() === "" || objetoCredenciales.contraseña.trim() === "" ) {
            objetoRespuesta.logeado = false;
            objetoRespuesta.esAdmin = false;
            objetoRespuesta.operacion = "fallida"
      }else{
            let consulta = await documentoSesiones.findOne({
                  "usuario": objetoCredenciales.usuario,
                  "contraseña": objetoCredenciales.contraseña
            }) 
            if(consulta!==null){
                  objetoRespuesta.logeado = true;
                  objetoRespuesta.esAdmin = consulta.esAdmin;
            }else {
                  objetoRespuesta.logeado = false;
                  objetoRespuesta.esAdmin = false;
            }
            objetoRespuesta.operacion = "exitosa"
      }
      return objetoRespuesta;
} 

async function verCitas() {
      await mongo_cliente.connect();
      let documentoCitas = mongo_cliente.db("hospital").collection("citas");
      let todasLasCitas = await documentoCitas.find().toArray();
      return todasLasCitas;
}
async function verEspecialistas() {
      await mongo_cliente.connect();
      let documentoPacientes = mongo_cliente.db("hospital").collection("especialistas");
      let listaEspecialistas = await documentoPacientes.find().toArray();
      return listaEspecialistas;
}
async function verPacientes() {
      await mongo_cliente.connect();
      let documentoPacientes = mongo_cliente.db("hospital").collection("pacientes");
      let listaPacientes = await documentoPacientes.find().toArray();
      return listaPacientes;
}
module.exports = app;