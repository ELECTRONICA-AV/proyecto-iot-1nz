
// ==========================================================
// DASHBOARD CETA - TOYOTA 1NZ-FE
// PARTE 1 DE 3
// CONFIGURACION, SESION Y COMUNICACION
// ==========================================================


// ==========================================================
// CONFIGURACION SUPABASE
// ==========================================================

const SUPABASE_URL =
  "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ==========================================================
// ELEMENTOS DEL DASHBOARD
// ==========================================================

const loadingScreen =
  document.getElementById("loadingScreen");

const dashboard =
  document.getElementById("dashboard");

const logoutButton =
  document.getElementById("logoutButton");

const startButton =
  document.getElementById("startButton");

const stopButton =
  document.getElementById("stopButton");

const immobilizerButton =
  document.getElementById("immobilizerButton");

const connectionButton =
  document.getElementById("connectionButton");

const connectionText =
  document.getElementById("connectionText");

const statusDot =
  document.getElementById("statusDot");

const engineStatus =
  document.getElementById("engineStatus");


// ==========================================================
// ELEMENTOS DE VERIFICACION MANUAL
// ==========================================================

const manualEngineButton =
  document.getElementById("manualEngineButton");

const manualEngineModal =
  document.getElementById("manualEngineModal");

const manualEngineYes =
  document.getElementById("manualEngineYes");

const manualEngineNo =
  document.getElementById("manualEngineNo");

// TERCERA OPCION: VEHICULO INMOVILIZADO

const manualEngineImmobilized =
  document.getElementById("manualEngineImmobilized");

const manualEngineCancel =
  document.getElementById("manualEngineCancel");

const manualEngineNote =
  document.getElementById("manualEngineNote");


// ==========================================================
// VARIABLES DE ESTADO
// ==========================================================

// Estado informado por el servidor.
// true  = encendido
// false = apagado
// null  = desconocido

let engineOn = null;

// Indica si se esta ejecutando una solicitud
// de encendido o apagado.

let engineCommandRunning = false;


// ==========================================================
// ESTADO CONFIRMADO MANUALMENTE
// ==========================================================

// null           = sin confirmacion manual
// "on"           = motor encendido
// "off"          = motor apagado
// "immobilized"  = vehiculo inmovilizado
//
// Esta variable se utiliza para corregir
// la indicacion y disponibilidad visual
// de los controles del Dashboard.
//
// NO cambia por si misma el estado del ESP32.

let manualEngineState = null;


// ==========================================================
// ESTADO DEL INMOVILIZADOR
// ==========================================================

// true  = activado
// false = desactivado
// null  = desconocido

let immobilizerOn = null;

let immobilizerCommandRunning = false;

let connectionTestRunning = false;


// ==========================================================
// FUNCIONES AUXILIARES DE ESTADO
// ==========================================================

// Devuelve el estado que debe mostrar
// el Dashboard.
//
// Se prioriza la confirmacion manual
// cuando existe.

function getDashboardEngineState() {

  if (manualEngineState === "on") {
    return "on";
  }

  if (manualEngineState === "off") {
    return "off";
  }

  if (manualEngineState === "immobilized") {
    return "immobilized";
  }

  // El bloqueo informado por el servidor
  // tiene prioridad sobre el estado del motor.

  if (immobilizerOn === true) {
    return "immobilized";
  }

  if (engineOn === true) {
    return "on";
  }

  if (engineOn === false) {
    return "off";
  }

  return "unknown";
}


// ==========================================================
// CONSULTAR SI EXISTE BLOQUEO
// ==========================================================

// El estado manual "off" no elimina
// un bloqueo informado por el servidor.

function isDashboardImmobilized() {

  return (
    manualEngineState === "immobilized" ||
    immobilizerOn === true
  );
}


// ==========================================================
// VERIFICAR SESION
// ==========================================================

async function verifySession() {

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {

    window.location.replace(
      "index-1nz.html"
    );

    return;
  }

  loadingScreen.classList.add(
    "hidden"
  );

  dashboard.classList.remove(
    "hidden"
  );

  // No ejecutar prueba automatica
  // de conexion con el ESP32.

  setConnectionState("unknown");

  // Consultar los estados iniciales.
  // Las funciones se incluyen
  // en las siguientes partes.

  await refreshEngineState();

  await refreshImmobilizerState();

  updateEngineButtons();

  updateImmobilizerButton();
}


// ==========================================================
// CERRAR SESION
// ==========================================================

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async () => {

      await supabaseClient.auth.signOut();

      sessionStorage.removeItem(
        "vehicleCode"
      );

      window.location.replace(
        "index.html"
      );
    }
  );

}


// ==========================================================
// OBTENER SESION
// ==========================================================

async function getSession() {

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();

  if (error || !session) {

    window.location.replace(
      "index-1nz.html"
    );

    return null;
  }

  return session;
}


// ==========================================================
// COMUNICACION CON VEHICLE-API
// ==========================================================

async function vehicleApi(action) {

  const session = await getSession();

  if (!session) {

    throw new Error(
      "Sesion no disponible"
    );
  }

  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/vehicle-api`,
    {
      method: "POST",

      headers: {

        "Content-Type":
          "application/json",

        "Authorization":
          `Bearer ${session.access_token}`,

        "apikey":
          SUPABASE_KEY
      },

      body: JSON.stringify({
        action: action
      })
    }
  );

  let result;

  try {

    result = await response.json();

  } catch (error) {

    throw new Error(
      "Respuesta invalida del servidor"
    );
  }

  console.log(
    "vehicle-api:",
    action,
    result
  );

  if (
    !response.ok ||
    !result.success
  ) {

    throw new Error(
      result.error ||
      "Error ejecutando la solicitud"
    );
  }

  return result;
}


// ==========================================================
// ULTIMA COMUNICACION
// ==========================================================

function updateLastCommunication() {

  const element =
    document.getElementById(
      "lastCommunication"
    );

  if (!element) {
    return;
  }

  element.textContent =
    new Date().toLocaleString(
      "es-BO",
      {
        dateStyle: "short",
        timeStyle: "medium"
      }
    );
}


// ==========================================================
// ESTADO VISUAL DE CONEXION
// ==========================================================

function setConnectionState(state) {

  if (
    !statusDot ||
    !connectionText
  ) {
    return;
  }

  statusDot.classList.remove(
    "unknown",
    "checking",
    "online",
    "offline"
  );

  if (state === "unknown") {

    statusDot.classList.add(
      "unknown"
    );

    connectionText.textContent =
      "SIN VERIFICAR";

    return;
  }

  if (state === "checking") {

    statusDot.classList.add(
      "checking"
    );

    connectionText.textContent =
      "VERIFICANDO...";

    return;
  }

  if (state === "online") {

    statusDot.classList.add(
      "online"
    );

    connectionText.textContent =
      "CONECTADO";

    return;
  }

  statusDot.classList.add(
    "offline"
  );

  connectionText.textContent =
    "SIN CONEXIÓN";
}


// ==========================================================
// VERIFICAR CONEXION CON ESP32
// ==========================================================

// Dashboard
//     |
//     v
// Supabase
//     |
//     v
// V9 = 0
// V8 = 1
//     |
//     v
// ESP32
//     |
//     v
// V9 = 1
//     |
//     v
// Dashboard

if (connectionButton) {

  connectionButton.addEventListener(
    "click",
    async () => {

      if (connectionTestRunning) {
        return;
      }

      connectionTestRunning = true;

      connectionButton.disabled = true;

      connectionButton.textContent =
        "VERIFICANDO...";

      setConnectionState("checking");

      try {

        const result = await vehicleApi(
          "connection-test"
        );

        console.log(
          "Prueba conexion ESP32:",
          result
        );

        if (result.connected === true) {

          setConnectionState("online");

          updateLastCommunication();

          connectionButton.textContent =
            "VERIFICAR NUEVAMENTE";

        } else {

          setConnectionState("offline");

          connectionButton.textContent =
            "REINTENTAR CONEXIÓN";
        }

      } catch (error) {

        console.error(
          "Error verificando conexion:",
          error
        );

        setConnectionState("offline");

        connectionButton.textContent =
          "REINTENTAR CONEXIÓN";

        alert(
          "No se pudo completar la prueba de conexión.\n\n" +
          error.message
        );

      } finally {

        connectionTestRunning = false;

        connectionButton.disabled = false;
      }
    }
  );

}


// ==========================================================
// FIN DE LA PARTE 1 DE 3
// ==========================================================

// CONTINUAR PEGANDO LA PARTE 2
// JUSTO DEBAJO DE ESTA LINEA.

// ==========================================================
// DASHBOARD CETA - TOYOTA 1NZ-FE
// PARTE 2 DE 3
// ESTADOS DEL MOTOR Y VERIFICACION MANUAL
// ==========================================================


// ==========================================================
// ESTADO VISUAL DEL MOTOR
// ==========================================================

function updateEngineVisual() {

  if (!engineStatus) {
    return;
  }

  engineStatus.classList.remove(
    "engine-on",
    "engine-off",
    "engine-immobilized"
  );

  const state = getDashboardEngineState();

  if (state === "immobilized") {

    engineStatus.textContent =
      "INMOVILIZADO" +
      (
        manualEngineState === "immobilized"
          ? " (MANUAL)"
          : ""
      );

    engineStatus.classList.add(
      "engine-immobilized"
    );

    return;
  }

  if (state === "on") {

    engineStatus.textContent =
      manualEngineState === "on"
        ? "ENCENDIDO (MANUAL)"
        : "ENCENDIDO";

    engineStatus.classList.add(
      "engine-on"
    );

    return;
  }

  if (state === "off") {

    engineStatus.textContent =
      manualEngineState === "off"
        ? "APAGADO (MANUAL)"
        : "APAGADO";

    engineStatus.classList.add(
      "engine-off"
    );

    return;
  }

  engineStatus.textContent =
    "DESCONOCIDO";
}


// ==========================================================
// DISPONIBILIDAD DE LOS CONTROLES DEL MOTOR
// ==========================================================

function updateEngineButtons() {

  updateEngineVisual();

  if (!startButton || !stopButton) {
    return;
  }

  // No permitir solicitudes simultaneas.

  if (
    engineCommandRunning ||
    immobilizerCommandRunning
  ) {

    startButton.disabled = true;
    stopButton.disabled = true;

    return;
  }

  // La inmovilizacion bloquea el arranque.
  // El estado manual nunca desactiva
  // un bloqueo informado por el servidor.

  if (isDashboardImmobilized()) {

    startButton.disabled = true;
    stopButton.disabled = true;

    return;
  }

  const state = getDashboardEngineState();

  if (state === "on") {

    startButton.disabled = true;

    // Una confirmacion manual permite mostrar
    // la opcion APAGAR, pero no garantiza
    // que el servidor acepte la solicitud.

    stopButton.disabled = false;

    return;
  }

  if (state === "off") {

    // No habilitar arranque solo porque
    // alguien selecciono APAGADO.
    // Se requiere que el servidor informe
    // motor apagado e inmovilizador desactivado.

    startButton.disabled = !(
      engineOn === false &&
      immobilizerOn === false
    );

    stopButton.disabled = true;

    return;
  }

  // Estado desconocido.

  startButton.disabled = true;
  stopButton.disabled = true;
}


// ==========================================================
// CONSULTAR ESTADO DEL MOTOR
// ==========================================================

async function refreshEngineState() {

  // Se mantiene la confirmacion manual.
  // No se borra cuando falla una consulta.

  engineOn = null;

  updateEngineButtons();

  try {

    const result = await vehicleApi(
      "engine-status"
    );

    if (
      typeof result.engineOn !== "boolean"
    ) {

      throw new Error(
        "Estado del motor no disponible"
      );
    }

    engineOn = result.engineOn;

    console.log(
      "Estado del motor informado:",
      engineOn ? "ENCENDIDO" : "APAGADO"
    );

    updateLastCommunication();

  } catch (error) {

    console.error(
      "Error consultando motor:",
      error
    );

    engineOn = null;

  } finally {

    updateEngineButtons();
  }
}


// ==========================================================
// ABRIR VENTANA DE VERIFICACION MANUAL
// ==========================================================

function openManualEngineModal() {

  if (!manualEngineModal) {

    alert(
      "No se encontro la ventana de " +
      "verificacion en dashboard.html"
    );

    return;
  }

  manualEngineModal.hidden = false;

  manualEngineModal.setAttribute(
    "aria-hidden",
    "false"
  );

  if (manualEngineYes) {
    manualEngineYes.focus();
  }
}


// ==========================================================
// CERRAR VENTANA DE VERIFICACION MANUAL
// ==========================================================

function closeManualEngineModal() {

  if (!manualEngineModal) {
    return;
  }

  manualEngineModal.hidden = true;

  manualEngineModal.setAttribute(
    "aria-hidden",
    "true"
  );

  if (manualEngineButton) {
    manualEngineButton.focus();
  }
}


// ==========================================================
// NOTA DE CONFIRMACION MANUAL
// ==========================================================

function updateManualEngineNotice() {

  if (!manualEngineNote) {
    return;
  }

  if (manualEngineState === null) {

    manualEngineNote.textContent = "";

    manualEngineNote.hidden = true;

    return;
  }

  let description = "";

  if (manualEngineState === "on") {

    description =
      "Motor ENCENDIDO, confirmado manualmente.";

  } else if (manualEngineState === "off") {

    description =
      "Motor APAGADO, confirmado manualmente.";

  } else if (
    manualEngineState === "immobilized"
  ) {

    description =
      "Vehículo INMOVILIZADO, " +
      "confirmado manualmente.";
  }

  manualEngineNote.textContent =
    description +
    " Esta confirmación corrige el estado " +
    "mostrado en el Dashboard, pero no " +
    "modifica el estado físico del vehículo.";

  manualEngineNote.hidden = false;
}


// ==========================================================
// REGISTRAR ESTADO MANUAL
// ==========================================================

function confirmManualEngineState(state) {

  if (
    engineCommandRunning ||
    immobilizerCommandRunning
  ) {

    alert(
      "Espere a que finalice el comando actual."
    );

    return;
  }

  const validStates = [
    "on",
    "off",
    "immobilized"
  ];

  if (!validStates.includes(state)) {
    return;
  }

  // No se envia ninguna orden al ESP32.
  // Se actualiza la indicacion del Dashboard.

  manualEngineState = state;

  updateManualEngineNotice();

  updateEngineButtons();

  updateImmobilizerButton();

  closeManualEngineModal();

  console.log(
    "Estado confirmado manualmente:",
    state
  );
}


// ==========================================================
// ABRIR VENTANA DESDE EL BOTON PRINCIPAL
// ==========================================================

if (manualEngineButton) {

  manualEngineButton.addEventListener(
    "click",
    () => {

      if (
        engineCommandRunning ||
        immobilizerCommandRunning
      ) {

        alert(
          "Espere a que termine el comando actual."
        );

        return;
      }

      openManualEngineModal();
    }
  );

}


// ==========================================================
// OPCION 1: MOTOR ENCENDIDO
// ==========================================================

if (manualEngineYes) {

  manualEngineYes.addEventListener(
    "click",
    () => {

      confirmManualEngineState("on");
    }
  );

}


// ==========================================================
// OPCION 2: MOTOR APAGADO
// ==========================================================

if (manualEngineNo) {

  manualEngineNo.addEventListener(
    "click",
    () => {

      confirmManualEngineState("off");
    }
  );

}


// ==========================================================
// OPCION 3: VEHICULO INMOVILIZADO
// ==========================================================

if (manualEngineImmobilized) {

  manualEngineImmobilized.addEventListener(
    "click",
    () => {

      confirmManualEngineState(
        "immobilized"
      );
    }
  );

}


// ==========================================================
// BOTON CANCELAR
// ==========================================================

if (manualEngineCancel) {

  manualEngineCancel.addEventListener(
    "click",
    () => {

      closeManualEngineModal();
    }
  );

}


// ==========================================================
// CERRAR CON LA TECLA ESCAPE
// ==========================================================

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      manualEngineModal &&
      !manualEngineModal.hidden
    ) {

      closeManualEngineModal();
    }
  }
);


// ==========================================================
// CERRAR AL PULSAR FUERA DE LA VENTANA
// ==========================================================

if (manualEngineModal) {

  manualEngineModal.addEventListener(
    "click",
    (event) => {

      if (
        event.target === manualEngineModal
      ) {

        closeManualEngineModal();
      }
    }
  );

}


// ==========================================================
// ESTADO VISUAL DEL INMOVILIZADOR
// ==========================================================

function updateImmobilizerButton() {

  if (!immobilizerButton) {
    return;
  }

  if (immobilizerCommandRunning) {

    immobilizerButton.disabled = true;

    immobilizerButton.textContent =
      "PROCESANDO...";

    return;
  }

  // Una confirmacion manual de inmovilizacion
  // no cambia por si sola el estado remoto.
  // Se mantiene visible la informacion manual.

  if (
    manualEngineState === "immobilized"
  ) {

    immobilizerButton.disabled =
      immobilizerOn !== true;

    immobilizerButton.textContent =
      immobilizerOn === true
        ? "DESACTIVAR INMOVILIZADOR"
        : "INMOVILIZADO (MANUAL)";

    return;
  }

  if (immobilizerOn === true) {

    immobilizerButton.disabled = false;

    immobilizerButton.textContent =
      "DESACTIVAR INMOVILIZADOR";

    return;
  }

  if (immobilizerOn === false) {

    immobilizerButton.disabled = false;

    immobilizerButton.textContent =
      "ACTIVAR INMOVILIZADOR";

    return;
  }

  immobilizerButton.disabled = false;

  immobilizerButton.textContent =
    "CONSULTAR INMOVILIZADOR";
}


// ==========================================================
// CONSULTAR ESTADO DEL INMOVILIZADOR
// ==========================================================

async function refreshImmobilizerState() {

  immobilizerOn = null;

  updateImmobilizerButton();

  try {

    const result = await vehicleApi(
      "immobilizer-status"
    );

    if (
      typeof result.immobilizerOn !== "boolean"
    ) {

      throw new Error(
        "Estado del inmovilizador no disponible"
      );
    }

    immobilizerOn = result.immobilizerOn;

    console.log(
      "Inmovilizador informado:",
      immobilizerOn
        ? "ACTIVADO"
        : "DESACTIVADO"
    );

    updateLastCommunication();

  } catch (error) {

    console.error(
      "Error consultando inmovilizador:",
      error
    );

    immobilizerOn = null;

  } finally {

    updateImmobilizerButton();

    updateEngineButtons();
  }
}


// ==========================================================
// FIN DE LA PARTE 2 DE 3
// ==========================================================

// CONTINUAR PEGANDO LA PARTE 3
// JUSTO DEBAJO DE ESTA LINEA.

// ==========================================================
// DASHBOARD CETA - TOYOTA 1NZ-FE
// PARTE 3 DE 3
// SENSORES, COMANDOS E INICIALIZACION
// ==========================================================


// ==========================================================
// CONSULTAR BATERIA
// ==========================================================

const batteryButton =
  document.getElementById("batteryButton");

const batteryValue =
  document.getElementById("batteryValue");

if (batteryButton && batteryValue) {

  batteryButton.addEventListener(
    "click",
    async () => {

      batteryButton.disabled = true;
      batteryButton.textContent = "CONSULTANDO...";

      try {

        const result = await vehicleApi("battery");

        if (
          result.battery === null ||
          result.battery === undefined ||
          result.battery === ""
        ) {
          throw new Error(
            "No se recibio voltaje"
          );
        }

        const voltage = Number(result.battery);

        if (!Number.isFinite(voltage)) {
          throw new Error(
            "Voltaje invalido"
          );
        }

        batteryValue.textContent =
          voltage.toFixed(2);

        updateLastCommunication();

      } catch (error) {

        console.error("Error bateria:", error);

        batteryValue.textContent = "--";

        alert(
          "Error consultando bateria:\n\n" +
          error.message
        );

      } finally {

        batteryButton.disabled = false;
        batteryButton.textContent = "CONSULTAR";
      }
    }
  );
}


// ==========================================================
// CONSULTAR TEMPERATURA
// ==========================================================

const temperatureButton =
  document.getElementById("temperatureButton");

const temperatureValue =
  document.getElementById("temperatureValue");

if (temperatureButton && temperatureValue) {

  temperatureButton.addEventListener(
    "click",
    async () => {

      temperatureButton.disabled = true;
      temperatureButton.textContent = "CONSULTANDO...";

      try {

        const result = await vehicleApi(
          "temperature"
        );

        if (
          result.temperature === null ||
          result.temperature === undefined ||
          result.temperature === ""
        ) {
          throw new Error(
            "No se recibio temperatura"
          );
        }

        const temperature =
          Number(result.temperature);

        if (!Number.isFinite(temperature)) {
          throw new Error(
            "Temperatura invalida"
          );
        }

        temperatureValue.textContent =
          temperature.toFixed(1);

        updateLastCommunication();

      } catch (error) {

        console.error(
          "Error temperatura:",
          error
        );

        temperatureValue.textContent = "--";

        alert(
          "Error consultando temperatura:\n\n" +
          error.message
        );

      } finally {

        temperatureButton.disabled = false;
        temperatureButton.textContent = "CONSULTAR";
      }
    }
  );
}


// ==========================================================
// CONSULTAR COMBUSTIBLE
// ==========================================================

const fuelButton =
  document.getElementById("fuelButton");

const fuelValue =
  document.getElementById("fuelValue");

if (fuelButton && fuelValue) {

  fuelButton.addEventListener(
    "click",
    async () => {

      fuelButton.disabled = true;
      fuelButton.textContent = "CONSULTANDO...";

      try {

        const result = await vehicleApi("fuel");

        if (
          result.fuel === null ||
          result.fuel === undefined ||
          result.fuel === ""
        ) {
          throw new Error(
            "No se recibio combustible"
          );
        }

        const fuel = Number(result.fuel);

        if (!Number.isFinite(fuel)) {
          throw new Error(
            "Nivel de combustible invalido"
          );
        }

        fuelValue.textContent =
          Math.round(fuel);

        updateLastCommunication();

      } catch (error) {

        console.error(
          "Error combustible:",
          error
        );

        fuelValue.textContent = "--";

        alert(
          "Error consultando combustible:\n\n" +
          error.message
        );

      } finally {

        fuelButton.disabled = false;
        fuelButton.textContent = "CONSULTAR";
      }
    }
  );
}


// ==========================================================
// ENCENDER MOTOR
// ==========================================================

if (startButton) {

  startButton.addEventListener(
    "click",
    async () => {

      if (
        engineCommandRunning ||
        immobilizerCommandRunning
      ) {
        return;
      }

      // Nunca usar una confirmacion manual
      // como autorizacion suficiente de arranque.
      //
      // El servidor debe informar motor apagado
      // e inmovilizador desactivado.
      //
      // Ademas, el controlador debe verificar
      // sus propias condiciones de seguridad.

      if (isDashboardImmobilized()) {

        alert(
          "El Dashboard indica que el vehiculo " +
          "esta inmovilizado.\n\n" +
          "No se enviara una solicitud de arranque."
        );

        return;
      }

      if (
        engineOn !== false ||
        immobilizerOn !== false
      ) {

        alert(
          "No se puede solicitar el encendido.\n\n" +
          "El servidor debe confirmar motor apagado " +
          "e inmovilizador desactivado."
        );

        await refreshEngineState();
        await refreshImmobilizerState();

        return;
      }

      // Si el usuario confirmo que el motor
      // esta encendido, no repetir el arranque.

      if (manualEngineState === "on") {

        alert(
          "El motor fue marcado como ENCENDIDO " +
          "manualmente.\n\n" +
          "No se enviara otro arranque."
        );

        return;
      }

      const confirmed = confirm(
        "¿Desea solicitar el encendido del motor?\n\n" +
        "Compruebe que:\n" +
        "- El vehiculo este detenido.\n" +
        "- La transmision este en P o N.\n" +
        "- El motor este apagado.\n" +
        "- No haya personas cerca de partes moviles.\n\n" +
        "El controlador debe verificar sus " +
        "protecciones antes de ejecutar la orden."
      );

      if (!confirmed) {
        return;
      }

      engineCommandRunning = true;
      updateEngineButtons();

      const originalText = startButton.textContent;

      startButton.textContent = "ENCENDIENDO...";

      try {

        const result = await vehicleApi("start");

        console.log(
          "Respuesta de arranque:",
          result
        );

        updateLastCommunication();

        // No asumir que el motor arranco
        // solo porque el servidor respondio.
        //
        // Tampoco borrar automaticamente
        // el estado manual.

        await refreshEngineState();

        alert(
          "Solicitud de encendido procesada.\n\n" +
          "Compruebe el estado del motor.\n" +
          "Si el Dashboard no refleja lo ocurrido, " +
          "utilice VERIFICAR ESTADO DEL MOTOR."
        );

      } catch (error) {

        console.error(
          "Error de arranque:",
          error
        );

        // Un error de comunicacion no confirma
        // que el comando haya sido rechazado
        // ni que el motor permanezca apagado.

        engineOn = null;

        alert(
          "No se pudo confirmar el resultado " +
          "de la solicitud de encendido.\n\n" +
          error.message +
          "\n\nCompruebe el vehiculo antes de " +
          "intentar nuevamente."
        );

      } finally {

        startButton.textContent = originalText;

        engineCommandRunning = false;

        updateEngineButtons();
      }
    }
  );
}


// ==========================================================
// APAGAR MOTOR
// ==========================================================

if (stopButton) {

  stopButton.addEventListener(
    "click",
    async () => {

      if (
        engineCommandRunning ||
        immobilizerCommandRunning
      ) {
        return;
      }

      if (isDashboardImmobilized()) {

        alert(
          "El Dashboard indica que el vehiculo " +
          "esta inmovilizado.\n\n" +
          "Verifique su estado antes de " +
          "enviar comandos."
        );

        return;
      }

      // Se permite solicitar apagado cuando
      // el estado mostrado es ENCENDIDO,
      // incluso si fue confirmado manualmente.
      //
      // El servidor y el controlador siguen
      // siendo responsables de validar
      // la ejecucion del comando.

      if (
        getDashboardEngineState() !== "on"
      ) {

        alert(
          "El Dashboard no indica " +
          "motor encendido."
        );

        return;
      }

      const confirmed = confirm(
        "¿Desea solicitar el apagado del motor?\n\n" +
        "Compruebe que el vehiculo este detenido " +
        "y que la operacion sea segura."
      );

      if (!confirmed) {
        return;
      }

      engineCommandRunning = true;
      updateEngineButtons();

      const originalText = stopButton.textContent;

      stopButton.textContent = "APAGANDO...";

      try {

        const result = await vehicleApi("stop");

        console.log(
          "Respuesta de apagado:",
          result
        );

        updateLastCommunication();

        await refreshEngineState();

        alert(
          "Solicitud de apagado procesada.\n\n" +
          "Verifique fisicamente que el motor " +
          "se haya detenido.\n\n" +
          "Si el Dashboard no refleja el estado, " +
          "utilice la verificacion manual."
        );

      } catch (error) {

        console.error(
          "Error de apagado:",
          error
        );

        engineOn = null;

        alert(
          "No se pudo confirmar el resultado " +
          "de la solicitud de apagado.\n\n" +
          error.message +
          "\n\nCompruebe el vehiculo."
        );

      } finally {

        stopButton.textContent = originalText;

        engineCommandRunning = false;

        updateEngineButtons();
      }
    }
  );
}


// ==========================================================
// CONTROL DEL INMOVILIZADOR
// ==========================================================

if (immobilizerButton) {

  immobilizerButton.addEventListener(
    "click",
    async () => {

      if (
        immobilizerCommandRunning ||
        engineCommandRunning
      ) {
        return;
      }

      // Consultar el estado del inmovilizador
      // si el servidor no lo ha informado.

      if (immobilizerOn === null) {

        await refreshImmobilizerState();

        if (immobilizerOn === null) {

          alert(
            "No se pudo determinar el estado " +
            "actual del inmovilizador."
          );

          return;
        }
      }

      const activating =
        immobilizerOn === false;

      if (activating) {

        // No activar el inmovilizador si
        // existe confirmacion manual
        // de motor encendido.

        if (manualEngineState === "on") {

          alert(
            "El motor fue confirmado como " +
            "ENCENDIDO manualmente.\n\n" +
            "No se solicitara la activacion " +
            "del inmovilizador."
          );

          return;
        }

        // Consultar el estado informado
        // antes de solicitar la activacion.

        await refreshEngineState();

        if (engineOn !== false) {

          alert(
            "No se puede solicitar la activacion " +
            "del inmovilizador.\n\n" +
            "El servidor no confirma que " +
            "el motor este apagado."
          );

          return;
        }

      }

      const message = activating
        ? (
          "¿Desea ACTIVAR el inmovilizador?\n\n" +
          "El sistema debe impedir futuros " +
          "arranques y no detener un motor " +
          "en funcionamiento.\n\n" +
          "Compruebe que el vehiculo " +
          "este completamente detenido."
        )
        : (
          "¿Desea DESACTIVAR el inmovilizador?"
        );

      if (!confirm(message)) {
        return;
      }

      immobilizerCommandRunning = true;

      updateImmobilizerButton();
      updateEngineButtons();

      try {

        const result = await vehicleApi(
          "immobilizer"
        );

        console.log(
          "Respuesta del inmovilizador:",
          result
        );

        updateLastCommunication();

        await refreshImmobilizerState();

        // No borrar una confirmacion manual
        // automaticamente.

        if (immobilizerOn === true) {

          alert(
            "El sistema informa que el " +
            "inmovilizador esta ACTIVADO.\n\n" +
            "Compruebe su estado fisico."
          );

        } else if (immobilizerOn === false) {

          alert(
            "El sistema informa que el " +
            "inmovilizador esta DESACTIVADO."
          );

        } else {

          alert(
            "La solicitud fue procesada, pero " +
            "no se pudo confirmar el estado " +
            "posterior del inmovilizador."
          );
        }

      } catch (error) {

        console.error(
          "Error del inmovilizador:",
          error
        );

        immobilizerOn = null;

        alert(
          "No se pudo confirmar el resultado " +
          "de la solicitud del inmovilizador.\n\n" +
          error.message
        );

      } finally {

        immobilizerCommandRunning = false;

        updateImmobilizerButton();
        updateEngineButtons();
      }
    }
  );
}


// ==========================================================
// INICIALIZACION VISUAL
// ==========================================================

// Al cargar la pagina no se conserva
// una confirmacion manual anterior.

manualEngineState = null;

updateManualEngineNotice();
updateEngineButtons();
updateImmobilizerButton();


// ==========================================================
// INICIAR VERIFICACION DE SESION
// ==========================================================

verifySession();


// ==========================================================
// FIN DEL ARCHIVO dashboard.js
// ==========================================================
