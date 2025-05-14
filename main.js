"use strict";

const {MongoClient,ObjectId} = require('mongodb');
const cors = require('cors');
const express = require('express');

const puerto = 5000;
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};
app.use(cors(corsOptions));
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
app.get("/citas", async function (req, res ){
      res.json(await verCitas())
})
app.get("/especialistas", async function (req, res ){
      res.json(await verEspecialistas())
})
app.get("/pacientes", async function (req, res ){
      res.json(await verPacientes())
})
//Sesiones
app.post("/sesiones/validar",async (req, res ) =>{
      console.log("validar");
      
      res.json(await validarLogin(req.body));
})
//Administrativos opciones
app.post("/especialistas/crear", async  (req, res )=>{
      res.json(await creaEspecialista(req.body))
})
app.delete("/especialistas/eliminar", async  (req, res )=>{
      res.json(await eliminarEspecialista(req.body))
})

/* FUNCIONES */
//[administradores]
//Crear Especialidadez
//@params "nombre" "rama" "dni" "telefono"
async function creaEspecialista(objetoDatos) {
      
      await mongo_cliente.connect();
      let objetoRespuesta = {"operacionEstado":null,"id":null};
      let documentoEspecialistas = mongo_cliente.db("hospital").collection("especialistas");
      if(   objetoDatos.nombre.trim() != "" &&
            objetoDatos.rama.trim() != "" && 
            objetoDatos.dni.trim() != "" &&
            objetoDatos.telefono.trim() != "" 
      )
      {
            let resultadoCreacionEspecialista = await documentoEspecialistas.insertOne(objetoDatos)
            objetoRespuesta = {"operacionEstado":resultadoCreacionEspecialista.acknowledged,"id":false};
            objetoRespuesta.operacionEstado?objetoRespuesta.id=resultadoCreacionEspecialista.insertedId:objetoRespuesta.id=false;
      }
      else{
            objetoRespuesta = {"operacionEstado":false,"id":false}; 
      }
      return objetoRespuesta;
}
//Eliminar Especialista
//@params ObjetoId(6845....)
async function eliminarEspecialista(ObjetoId) {

      await mongo_cliente.connect();
      let objetoRespuesta = {"operacionEstado":null,"mensaje":null}
      let documentoEspecialistas = mongo_cliente.db("hospital").collection("especialistas");
      let eliminado =documentoEspecialistas.deleteOne({
            "_id":ObjetoId
      });
      if ((await eliminado).acknowledged) {
            objetoRespuesta = {"operacionEstado":true,"mensaje":"Encontrado y eliminado"}
      }else{
            objetoRespuesta = {"operacionEstado":false,"mensaje":"No se pudo encontrar"}
      }
      return objetoRespuesta;
}
//[sesiones]
//Validar Credenciales de login
async function crearSesion(objetoCredenciales) {
            await mongo_cliente.connect();
      let objetoRespuesta={"id":null,"operacion":null}
      let documentoSesiones = mongo_cliente.db("hospital").collection("sesiones");
      if (objetoCredenciales.usuario.trim() === "" ||
          objetoCredenciales.contraseña.trim() === "" ||
          objetoCredenciales.correo.trim()=== ""
      ) {
            objetoRespuesta={"id":false,"operacion":false,"mensaje":"faltan datos"}
      }else{
            let creacion = documentoSesiones.insertOne({
                  usuario:objetoCredenciales.usuario,
                  contraseña:objetoCredenciales.usuario,
                  correo:objetoCredenciales.correo,
                  esAdmin:false
            });
            (await creacion).acknowledged?objetoRespuesta={"id": creacion.insertedId,"operacion":true,"mensaje":"creado"}:
            objetoRespuesta={"id": false,"operacion":true,"mensaje":"no creado"};
      }
}
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
//[pacientes]
async function crearPaciente(datosPaciente) {
      await mongo_cliente.connect();
      let objetoRespuesta = {"operacionEstado":null,"id":null};
      let documentoPacientes = mongo_cliente.db("hospital").collection("pacientes");
      if(   datosPaciente.nombre.trim() != "" &&
            datosPaciente.dni.trim() != "" &&
            datosPaciente.fechaNacimiento.trim() != ""
      ){
            let resultadoCreacionPaciente = await documentoPacientes.insertOne(datosPaciente)
            objetoRespuesta = {"operacionEstado":resultadoCreacionPaciente.acknowledged,"id":false};
            objetoRespuesta.operacionEstado?objetoRespuesta.id=resultadoCreacionEspecialista.insertedId:objetoRespuesta.id=false;

      }else{
            objetoRespuesta = {"operacionEstado":false,"id":false};     
      }
      return objetoRespuesta;
}
//Ver historial de un paciente
//@params "id paciente"
async function verHistorialPaciente(idPaciente) {
      await mongo_cliente.connect();
      let id_formatoBson = new ObjectId(idPaciente);
      let documentoPacientes = mongo_cliente.db("hospital").collection("pacientes");
      let documentoCitas = mongo_cliente.db("hospital").collection("citas");
      let paciente = await documentoPacientes.findOne({"_id":id_formatoBson});
      paciente._id = paciente._id.toString();
      let citasDelPaciente = await documentoCitas.find({"pacienteID":id_formatoBson}).toArray();
      return {"datosPaciente":paciente,"citasPaciente":citasDelPaciente};
}
//Ver Colecciones
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