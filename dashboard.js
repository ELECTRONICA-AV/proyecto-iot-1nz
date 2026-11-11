const SUPABASE_URL =
  "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";


const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ==========================================================
// ELEMENTOS
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
// ESTADO LOCAL
// ==========================================================

let engineOn = null;

// Confirmación manual solo para visualización.
// No modifica el estado usado para ejecutar comandos.
let manualEngineState = null;

let engineCommandRunning = false;

let immobilizerOn = null;
let immobilizerCommandRunning = false;

let connectionTestRunning = false;


// ==========================================================
// VERIFICAR SESION
// ==========================================================

async function verifySession() {

  const {
    data: { session },
    error
  } =
    await supabaseClient.auth.getSession();


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


  // La prueba de conexión V8/V9 no es automática.
  // Se realiza al pulsar VERIFICAR CONEXIÓN.

  setConnectionState(
    "unknown"
  );


  // Consultar estados al abrir el Dashboard.

  await refreshEngineState();

  await refreshImmobilizerState();
}


verifySession();


// ==========================================================
// CERRAR SESION
// ==========================================================

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


// ==========================================================
// OBTENER SESION
// ==========================================================

async function getSession() {

  const {
    data: { session },
    error
  } =
    await supabaseClient.auth.getSession();


  if (error || !session) {

    window.location.replace(
      "index-1nz.html"
    );

    return null;
  }


  return session;
}


// ==========================================================
// LLAMAR VEHICLE-API
// ==========================================================

async function vehicleApi(action) {

  const session =
    await getSession();


  if (!session) {

    throw new Error(
      "Sesion no disponible"
    );
  }


  const response =
    await fetch(
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

    result =
      await response.json();

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


  // SIN VERIFICAR

  if (state === "unknown") {

    statusDot.classList.add(
      "unknown"
    );

    connectionText.textContent =
      "SIN VERIFICAR";

    return;
  }


  // VERIFICANDO

  if (state === "checking") {

    statusDot.classList.add(
      "checking"
    );

    connectionText.textContent =
      "VERIFICANDO...";

    return;
  }


  // CONECTADO

  if (state === "online") {

    statusDot.classList.add(
      "online"
    );

    connectionText.textContent =
      "CONECTADO";

    return;
  }


  // DESCONECTADO

  statusDot.classList.add(
    "offline"
  );

  connectionText.textContent =
    "SIN CONEXIÓN";
}


// ==========================================================
// PRUEBA REAL DE CONEXION ESP32
//
// Dashboard
//   ↓
// Servicio web
//   ↓
// V9 = 0
// V8 = 1
//   ↓
// ESP32
//   ↓
// V9 = 1
//   ↓
// Servicio web
//   ↓
// Dashboard
// ==========================================================

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

    setConnectionState(
      "checking"
    );


    try {

      const result =
        await vehicleApi(
          "connection-test"
        );


      console.log(
        "Prueba conexion ESP32:",
        result
      );


      // ESP32 RESPONDIO V9 = 1

      if (result.connected === true) {

        setConnectionState(
          "online"
        );

        updateLastCommunication();

        connectionButton.textContent =
          "VERIFICAR NUEVAMENTE";

      } else {

        // EL ESP32 NO RESPONDIO

        setConnectionState(
          "offline"
        );

        connectionButton.textContent =
          "REINTENTAR CONEXIÓN";
      }


    } catch (error) {

      console.error(
        "Error verificando conexion:",
        error
      );


      setConnectionState(
        "offline"
      );


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
// ==========================================================
// ESTADO VISUAL DEL MOTOR
// ==========================================================

function updateEngineVisual() {

  if (!engineStatus) {
    return;
  }

  engineStatus.classList.remove(
    "engine-on",
    "engine-off"
  );

  // --------------------------------------------------------
  // CONFIRMACION MANUAL
  // --------------------------------------------------------

  if (manualEngineState === true) {

    engineStatus.textContent =
      "ENCENDIDO (MANUAL)";

    engineStatus.classList.add(
      "engine-on"
    );

    return;
  }

  if (manualEngineState === false) {

    engineStatus.textContent =
      "APAGADO (MANUAL)";

    engineStatus.classList.add(
      "engine-off"
    );

    return;
  }

  // --------------------------------------------------------
  // ESTADO REPORTADO POR EL SISTEMA
  // --------------------------------------------------------

  if (engineOn === true) {

    engineStatus.textContent =
      "ENCENDIDO";

    engineStatus.classList.add(
      "engine-on"
    );

    return;
  }

  if (engineOn === false) {

    engineStatus.textContent =
      "APAGADO";

    engineStatus.classList.add(
      "engine-off"
    );

    return;
  }

  engineStatus.textContent =
    "DESCONOCIDO";
}


// ==========================================================
// CONTROL VISUAL DE BOTONES DEL MOTOR
// ==========================================================

function updateEngineButtons() {

  updateEngineVisual();

  // La confirmacion manual NO controla los botones.
  // Solo se utiliza el estado reportado por el sistema.

  if (engineCommandRunning) {

    startButton.disabled = true;
    stopButton.disabled = true;

    return;
  }

  if (engineOn === true) {

    startButton.disabled = true;
    stopButton.disabled = false;

    return;
  }

  if (engineOn === false) {

    startButton.disabled = false;
    stopButton.disabled = true;

    return;
  }

  startButton.disabled = true;
  stopButton.disabled = true;
}


// ==========================================================
// CONSULTAR ESTADO DEL MOTOR
// ==========================================================

async function refreshEngineState() {

  engineOn = null;

  updateEngineButtons();

  try {

    const result =
      await vehicleApi(
        "engine-status"
      );

    engineOn =
      result.engineOn === true;

    console.log(
      "Estado motor reportado:",
      engineOn
        ? "ENCENDIDO"
        : "APAGADO"
    );

    updateLastCommunication();

  } catch (error) {

    console.error(
      "Error consultando estado del motor:",
      error
    );

    engineOn = null;

  } finally {

    updateEngineButtons();
  }
}


// ==========================================================
// CONFIRMACION MANUAL DEL MOTOR
// ==========================================================

// El boton y la ventana deben existir en dashboard.html.
//
// IDs utilizados:
// manualEngineButton
// manualEngineModal
// manualEngineYes
// manualEngineNo
// manualEngineCancel

const manualEngineButton =
  document.getElementById(
    "manualEngineButton"
  );

const manualEngineModal =
  document.getElementById(
    "manualEngineModal"
  );

const manualEngineYes =
  document.getElementById(
    "manualEngineYes"
  );

const manualEngineNo =
  document.getElementById(
    "manualEngineNo"
  );

const manualEngineCancel =
  document.getElementById(
    "manualEngineCancel"
  );


function openManualEngineModal() {

  if (!manualEngineModal) {
    return;
  }

  manualEngineModal.classList.remove(
    "hidden"
  );

  manualEngineModal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeManualEngineModal() {

  if (!manualEngineModal) {
    return;
  }

  manualEngineModal.classList.add(
    "hidden"
  );

  manualEngineModal.setAttribute(
    "aria-hidden",
    "true"
  );
}


function confirmManualEngineState(state) {

  if (engineCommandRunning) {

    alert(
      "Espere a que termine el comando del motor."
    );

    return;
  }

  // SOLO cambia el estado visual.
  // NO envia comandos al ESP32.
  // NO modifica engineOn.

  manualEngineState = state;

  updateEngineVisual();

  closeManualEngineModal();

  console.log(
    "Confirmacion manual del motor:",
    state ? "ENCENDIDO" : "APAGADO"
  );
}


if (manualEngineButton) {

  manualEngineButton.addEventListener(
    "click",
    () => {

      if (engineCommandRunning) {

        alert(
          "Espere a que termine el comando del motor."
        );

        return;
      }

      openManualEngineModal();
    }
  );
}


if (manualEngineYes) {

  manualEngineYes.addEventListener(
    "click",
    () => {

      confirmManualEngineState(
        true
      );
    }
  );
}


if (manualEngineNo) {

  manualEngineNo.addEventListener(
    "click",
    () => {

      confirmManualEngineState(
        false
      );
    }
  );
}


if (manualEngineCancel) {

  manualEngineCancel.addEventListener(
    "click",
    closeManualEngineModal
  );
}


// Cerrar ventana con la tecla ESC.

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {

      closeManualEngineModal();
    }
  }
);


// ==========================================================
// CONTROL VISUAL DEL INMOVILIZADOR
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

  immobilizerButton.disabled = false;

  if (immobilizerOn === true) {

    immobilizerButton.textContent =
      "DESACTIVAR INMOVILIZADOR";

    return;
  }

  if (immobilizerOn === false) {

    immobilizerButton.textContent =
      "ACTIVAR INMOVILIZADOR";

    return;
  }

  immobilizerButton.textContent =
    "CONSULTAR INMOVILIZADOR";
}


// ==========================================================
// CONSULTAR INMOVILIZADOR
// ==========================================================

async function refreshImmobilizerState() {

  immobilizerOn = null;

  updateImmobilizerButton();

  try {

    const result =
      await vehicleApi(
        "immobilizer-status"
      );

    immobilizerOn =
      result.immobilizerOn === true;

    console.log(
      "Estado inmovilizador:",
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
  }
}


// ==========================================================
// CONSULTAR BATERIA
// ==========================================================

document
  .getElementById("batteryButton")
  .addEventListener(
    "click",
    async () => {

      const button =
        document.getElementById(
          "batteryButton"
        );

      const batteryValue =
        document.getElementById(
          "batteryValue"
        );

      button.disabled = true;

      button.textContent =
        "CONSULTANDO...";

      try {

        const result =
          await vehicleApi(
            "battery"
          );

        const voltage =
          Number(
            result.battery
          );

        if (!Number.isFinite(voltage)) {

          throw new Error(
            "Valor de bateria invalido"
          );
        }

        batteryValue.textContent =
          voltage.toFixed(2);

        updateLastCommunication();

      } catch (error) {

        console.error(
          "Error consultando bateria:",
          error
        );

        batteryValue.textContent =
          "--";

        alert(
          "No se pudo obtener el voltaje de bateria.\n\n" +
          error.message
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "CONSULTAR";
      }
    }
  );


// ==========================================================
// CONSULTAR TEMPERATURA
// ==========================================================

document
  .getElementById("temperatureButton")
  .addEventListener(
    "click",
    async () => {

      const button =
        document.getElementById(
          "temperatureButton"
        );

      const temperatureValue =
        document.getElementById(
          "temperatureValue"
        );

      button.disabled = true;

      button.textContent =
        "CONSULTANDO...";

      try {

        const result =
          await vehicleApi(
            "temperature"
          );

        const temperature =
          Number(
            result.temperature
          );

        if (!Number.isFinite(temperature)) {

          throw new Error(
            "Valor de temperatura invalido"
          );
        }

        temperatureValue.textContent =
          temperature.toFixed(1);

        updateLastCommunication();

      } catch (error) {

        console.error(
          "Error consultando temperatura:",
          error
        );

        temperatureValue.textContent =
          "--";

        alert(
          "No se pudo obtener la temperatura.\n\n" +
          error.message
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "CONSULTAR";
      }
    }
  );


// ==========================================================
// CONSULTAR COMBUSTIBLE
// ==========================================================

document
  .getElementById("fuelButton")
  .addEventListener(
    "click",
    async () => {

      const button =
        document.getElementById(
          "fuelButton"
        );

      const fuelValue =
        document.getElementById(
          "fuelValue"
        );

      button.disabled = true;

      button.textContent =
        "CONSULTANDO...";

      try {

        const result =
          await vehicleApi(
            "fuel"
          );

        const fuel =
          Number(
            result.fuel
          );

        if (!Number.isFinite(fuel)) {

          throw new Error(
            "Valor de combustible invalido"
          );
        }

        fuelValue.textContent =
          Math.round(fuel);

        updateLastCommunication();

      } catch (error) {

        console.error(
          "Error consultando combustible:",
          error
        );

        fuelValue.textContent =
          "--";

        alert(
          "No se pudo obtener el nivel de combustible.\n\n" +
          error.message
        );

      } finally {

        button.disabled = false;

        button.textContent =
          "CONSULTAR";
      }
    }
  );
// ==========================================================
// ENCENDER MOTOR
// ==========================================================

startButton.addEventListener(
  "click",
  async () => {

    if (engineCommandRunning) {
      return;
    }

    if (engineOn === true) {

      alert(
        "El motor ya figura como encendido."
      );

      updateEngineButtons();

      return;
    }

    if (engineOn === null) {

      alert(
        "No se conoce el estado actual del motor."
      );

      await refreshEngineState();

      return;
    }

    const confirmed =
      confirm(
        "¿Desea solicitar el encendido del motor?\n\n" +
        "Verifique físicamente que el vehículo esté " +
        "en una condición segura para el arranque."
      );

    if (!confirmed) {
      return;
    }

    engineCommandRunning = true;

    updateEngineButtons();

    const originalText =
      startButton.textContent;

    startButton.textContent =
      "ENCENDIENDO...";

    try {

      const result =
        await vehicleApi(
          "start"
        );

      console.log(
        "Resultado de arranque:",
        result
      );

      // Conservamos el comportamiento existente:
      // el servicio web reporta la solicitud exitosa.
      //
      // Esto NO confirma físicamente que el motor
      // haya arrancado, porque IGF aún no está conectado.

      engineOn = true;

      // Se elimina cualquier confirmación manual anterior.
      // El usuario podrá volver a verificar el motor.

      manualEngineState = null;

      updateEngineVisual();

      updateLastCommunication();

      alert(
        "Solicitud de encendido completada.\n\n" +
        "El arranque físico del motor no está " +
        "confirmado mediante IGF.\n\n" +
        "Utilice VERIFICAR ESTADO DEL MOTOR " +
        "para registrar el estado observado."
      );

    } catch (error) {

      console.error(
        "Error solicitando arranque:",
        error
      );

      alert(
        "No se pudo completar la solicitud de encendido.\n\n" +
        error.message
      );

      engineOn = null;

      manualEngineState = null;

    } finally {

      startButton.textContent =
        originalText;

      engineCommandRunning = false;

      if (engineOn === null) {

        await refreshEngineState();

      } else {

        updateEngineButtons();
      }
    }
  }
);


// ==========================================================
// APAGAR MOTOR
// ==========================================================

stopButton.addEventListener(
  "click",
  async () => {

    if (engineCommandRunning) {
      return;
    }

    if (engineOn === false) {

      alert(
        "El motor ya figura como apagado."
      );

      updateEngineButtons();

      return;
    }

    if (engineOn === null) {

      alert(
        "No se conoce el estado actual del motor."
      );

      await refreshEngineState();

      return;
    }

    const confirmed =
      confirm(
        "¿Desea solicitar el apagado del motor?"
      );

    if (!confirmed) {
      return;
    }

    engineCommandRunning = true;

    updateEngineButtons();

    const originalText =
      stopButton.textContent;

    stopButton.textContent =
      "APAGANDO...";

    try {

      const result =
        await vehicleApi(
          "stop"
        );

      console.log(
        "Resultado de apagado:",
        result
      );

      // Se conserva el comportamiento original.
      // La respuesta del servicio no constituye
      // verificación física de motor detenido.

      engineOn = false;

      manualEngineState = null;

      updateEngineVisual();

      updateLastCommunication();

      alert(
        "Solicitud de apagado completada.\n\n" +
        "Verifique físicamente que el motor " +
        "se haya detenido."
      );

    } catch (error) {

      console.error(
        "Error solicitando apagado:",
        error
      );

      alert(
        "No se pudo completar la solicitud de apagado.\n\n" +
        error.message
      );

      engineOn = null;

      manualEngineState = null;

    } finally {

      stopButton.textContent =
        originalText;

      engineCommandRunning = false;

      if (engineOn === null) {

        await refreshEngineState();

      } else {

        updateEngineButtons();
      }
    }
  }
);


// ==========================================================
// INMOVILIZADOR
// ==========================================================

immobilizerButton.addEventListener(
  "click",
  async () => {

    if (immobilizerCommandRunning) {
      return;
    }

    // --------------------------------------------------------
    // CONSULTAR ESTADO SI ES DESCONOCIDO
    // --------------------------------------------------------

    if (immobilizerOn === null) {

      await refreshImmobilizerState();

      if (immobilizerOn === null) {

        alert(
          "No se pudo conocer el estado actual " +
          "del inmovilizador."
        );

        return;
      }
    }

    // --------------------------------------------------------
    // CONFIRMACION
    // --------------------------------------------------------

    const mensaje =
      immobilizerOn
        ? "¿Desea DESACTIVAR el inmovilizador?"
        : "¿Desea ACTIVAR el inmovilizador?\n\n" +
          "IMPORTANTE: confirme físicamente que " +
          "el motor esté completamente detenido.\n" +
          "No active el bloqueo con el motor en marcha.";

    const confirmed =
      confirm(
        mensaje
      );

    if (!confirmed) {
      return;
    }

    // --------------------------------------------------------
    // PROCESANDO
    // --------------------------------------------------------

    immobilizerCommandRunning = true;

    updateImmobilizerButton();

    try {

      const result =
        await vehicleApi(
          "immobilizer"
        );

      console.log(
        "Resultado inmovilizador:",
        result
      );

      immobilizerOn =
        result.immobilizerOn === true;

      updateLastCommunication();

      if (immobilizerOn) {

        alert(
          "Inmovilizador ACTIVADO.\n\n" +
          "El bloqueo debe impedir futuros " +
          "arranques, nunca detener un motor " +
          "que ya está funcionando."
        );

      } else {

        alert(
          "Inmovilizador DESACTIVADO."
        );
      }

    } catch (error) {

      console.error(
        "Error controlando inmovilizador:",
        error
      );

      alert(
        "No se pudo cambiar el estado " +
        "del inmovilizador.\n\n" +
        error.message
      );

      immobilizerOn = null;

    } finally {

      immobilizerCommandRunning = false;

      if (immobilizerOn === null) {

        await refreshImmobilizerState();

      } else {

        updateImmobilizerButton();
      }
    }
  }
);


// ==========================================================
// FIN DEL ARCHIVO dashboard.js
// ==========================================================
