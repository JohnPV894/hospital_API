"use strict";

const {MongoClient,ObjectId} = require('mongodb');
const cors = require('cors');
const express = require('express');
const { log } = require('console');

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

//Opciones administrativo
app.get("/pacientes", async function (req, res ){
      res.json(await verColeccion("pacientes"))
})
app.post("/pacientes/crear", async function (req, res ){
      res.json(await crearPaciente(req.body))
})
app.delete("/pacientes/eliminar",async (req,res)=>{
      res.json(await eliminar_de_coleccion(req.body.id,"pacientes"))
})
app.post("/pacientes/informacionPaciente", async function (req, res ){
      res.json(await verHistorialPaciente(req.body))
})

app.get("/citas", async function (req, res ){
      res.json(await verColeccion("citas"))
})
app.post("/citas/crear", async function (req, res ){
      res.json(await crearCita(req.body))
})
app.delete("/citas/eliminar", async function (req,res) {
      res.json(await eliminar_de_coleccion(req.body.id,"citas"))
})
app.post("/citas/filtrar/rango", async function(req,res) {
      res.json(await filtrarRangosFechas(req.body))
})

//Administrador opciones
app.get("/especialistas", async function (req, res ){
      res.json(await verColeccion("especialistas"))
})
app.post("/especialistas/crear", async  (req, res )=>{
      res.json(await creaEspecialista(req.body))
})
app.delete("/especialistas/eliminar", async  (req, res )=>{
      //La funcion solo acepta string o objectId si le paso el json completo no funciona
      res.json(await eliminar_de_coleccion(req.body.id,"especialistas"))
})

//Sesiones
app.post("/sesiones/crear",async (req,res )=> {
      res.json(await crearSesion(req.body))
})
app.post("/sesiones/validar",async (req, res ) =>{
      console.log("validar");
      res.json(await validarLogin(req.body));
})

/* FUNCIONES */
//[especialista]
//Crear Especialidadez
//@params "nombre" "rama" "dni" "fechaNacimiento"
async function creaEspecialista(objetoDatos) {
      
      await mongo_cliente.connect();
      let objetoRespuesta = {"operacionEstado":null,"id":null};
      let documentoEspecialistas = mongo_cliente.db("hospital").collection("especialistas");
      if(   objetoDatos.nombre.trim() != "" &&
            objetoDatos.rama.trim() != "" && 
            objetoDatos.dni.trim() != "" &&
            objetoDatos.rama.trim() != "",
            objetoDatos.fechaNacimiento != null 
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
      return 
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
            objetoRespuesta.operacionEstado?objetoRespuesta.id=resultadoCreacionPaciente.insertedId:objetoRespuesta.id=false;

      }else{
            objetoRespuesta = {"operacionEstado":false,"id":false};     
      }
      return objetoRespuesta;
}
//[citas]
//crear cita y asignarla
//@params "id_paciente:objetoID(123)" "fecha" "asistio" "id_especialista:objetoID(123)"
async function crearCita(datosCita) {
      await mongo_cliente.connect();
      let objetoRespuesta = {id:null,estadoOperacion:null,mensaje:null};
      let documentoCitas = mongo_cliente.db("hospital").collection("citas");
      //Validaciones de datos
      let sonStringValidos = typeof datosCita.pacienteID === "string" && typeof datosCita.especialistaID === "string" && typeof datosCita.fecha === "string" &&
                              datosCita.pacienteID.trim()!=="" && datosCita.pacienteID.trim()!=="" && datosCita.fecha.trim()!== "" ;
      let ID_validos = ObjectId.isValid(datosCita.pacienteID) &&  ObjectId.isValid(datosCita.especialistaID);

      if (sonStringValidos && ID_validos) {
            const documentoFormateado = {
                pacienteID: new ObjectId(datosCita.pacienteID),
                especialistaID: new ObjectId(datosCita.especialistaID),
                fecha: new Date(datosCita.fecha),
                asistio: datosCita.asistio
            };

            let resultadoCreacionCita = await documentoCitas.insertOne(documentoFormateado);
            resultadoCreacionCita.acknowledged?
            objetoRespuesta = {id:resultadoCreacionCita.insertedId,estadoOperacion:true,mensaje:"Cita asignada correctamente"}:
            objetoRespuesta = {id:false,estadoOperacion:true,mensaje:"Fallo al crear cita"};
      }else{
            objetoRespuesta = {id:false,estadoOperacion:false,mensaje:"Faltan datos/Datos invalidos"};
      }
      return objetoRespuesta;
}
//Filtrar rango de fechas
//@params fechainicial, fechaFinal, filtroAsistencia
async function filtrarRangosFechas(objetoFiltro) {
      console.log(objetoFiltro);
      
      await mongo_cliente.connect();
      let documentoCitas = mongo_cliente.db("hospital").collection("citas");

      let fechaInicio = new Date (objetoFiltro.fechaInicio);
      let fechaFinal = new Date (objetoFiltro.fechaFinal);
      let consulta;
      fechaFinal.setDate(fechaFinal.getDate() + 1);

      if (objetoFiltro.filtroAsistencia !== null) {//$gte (mayor o igual) $lte (menor o igual)
            consulta = await documentoCitas.find({
                  asistio:objetoFiltro.filtroAsistencia,
                  fecha:{$gte: fechaInicio,$lte: fechaFinal}
            }).toArray();      
      }else {
            consulta =await documentoCitas.find({
                  fecha: {$gte: fechaInicio,$lte: fechaFinal}
            }).toArray();
      }
      if (consulta!==null) {
            return {mensaje:"Peticion aceptada por el servidor", respuesta: consulta}
      }else{
            return {mensaje:"Peticion rechazada por el servidor", respuesta: consulta}
      }
}
//Filtrar Por Fecha (Mostrar todas las citas de un dia/semana/mes)
//@params filtroForm, fecha,
async function filtrarFecha(objetoFiltro) {
      await mongo_cliente.connect();
      let documentoCitas = mongo_cliente.db("hospital").collection("citas");
      let objetoRespuesta={ mensaje :null, resultado :null};
      let filtro;

      if( fechaValida(objetoFiltro.fecha) === false){
            return { mensaje:"Operacion Cancelada, Fecha invalida", resultado:null};
      }

      if (objetoFiltro.filtroForm === "dia") {
            let diaFin = new Date(objetoFiltro.fecha);
            diaFin.setDate(diaFin.getDate()+1);
            filtro = { $gte:objetoFiltro.fecha, $lte:diaFin};
            
      }else if(objetoFiltro.filtroForm === "semana"){
            let semanaFin = new Date(objetoFiltro.fecha);
            semanaFin.setDate(semanaFin.getDate() + 7);
            filtro = { $gte:objetoFiltro.fecha, $lte:semanaFin}

      }else if (objetoFiltro.filtroForm === "mes"){
            let mesFin = new Date(objetoFiltro.fecha);
            mesFin.setDate(mesFin.getDate()+30)
            filtro = { $gte:objetoFiltro.fecha, $lte:mesFin}
      }else{
            return {mensaje:"Filtro Invalido",resultado:null}
      }
      let consulta = documentoCitas.find({
            fecha:filtro
      });

      objetoRespuesta={
            mensaje:consulta.acknowledged?"Correcta":"incorrecta",respuesta: consulta
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
async function verColeccion(coleccionNombre) {
      await mongo_cliente.connect();
      let documentoCitas = mongo_cliente.db("hospital").collection(coleccionNombre);
      let coleccion = await documentoCitas.find().toArray();
      return coleccion;
}
//Eliminar Objeto de la coleccion 
async function eliminar_de_coleccion(ObjetoId,coleccion) {

      await mongo_cliente.connect();
      let objetoRespuesta = {"operacionEstado":null,"mensaje":null}
      if (typeof ObjetoId === "string") {
            if(ObjectId.isValid(ObjetoId)){
                  ObjetoId = new ObjectId(ObjetoId)
            }else{
                return {"operacionEstado":false,"mensaje":"Id Invalido, No se pudo encontrar"}  
            };
      } 
      let documentoEspecialistas = mongo_cliente.db("hospital").collection(coleccion);
      
      let eliminado = documentoEspecialistas.deleteOne({
            "_id":ObjetoId
      });
      //
      if ((await eliminado).acknowledged && (await eliminado).deletedCount) {
      //Eliminamos las citas relacionadas con quien acabamos de eliminar
            let citasEliminadas;
            let coleccionCitas = mongo_cliente.db("hospital").collection("citas");
            
            //Definimos si buscamos una propiedad u otra para eliminar Segun de que coleccion estemos eliminando
            if (coleccion==="especialistas") {

                  citasEliminadas = await coleccionCitas.deleteMany({
                        "especialistaID":ObjetoId
                  });

            }else if (coleccion==="pacientes"){

                  citasEliminadas = await coleccionCitas.deleteMany({
                        "pacienteID":ObjetoId
                  });
            }
              
            objetoRespuesta = {"operacionEstado":true,"mensaje":"Encontrado y eliminado"}
      }else{
            objetoRespuesta = {"operacionEstado":false,"mensaje":"No se pudo encontrar"}
      }
      return objetoRespuesta;
}

function fechaValida(fecha) {
  return fecha instanceof Date && isNaN(fecha)===false;
}
//@params Fecha inicial, Fecha Final, FiltroAsistieron
//async function filtrarRangosFechas(objetoFiltro) {
//      let otroDia =new Date (2025,4,8);
//      let hoy = new Date()
//      console.log(hoy> otroDia);
//
//      
//}


//✅ 1. Cómo comprobar si una variable es de tipo fecha (Date)
const fecha = new Date();
console.log(fecha instanceof Date); // true

//✅ 2. Cuando creas una fecha con un valor incorrecto (por ejemplo, "2025-02-30"), JavaScript crea un objeto Date, pero su valor será inválido (Invalid Date):
const fechaInvalida = new Date("2025-02-30");

console.log(isNaN(fechaInvalida)); // true → ¡no es válida!
console.log(fechaInvalida.toString()); // "Invalid Date"


module.exports = app;