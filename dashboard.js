// ==========================================================
// CONFIGURACION SUPABASE
// ==========================================================

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
// ELEMENTOS DE CONFIRMACION MANUAL
// ==========================================================

const manualEngineButton =
  document.getElementById("manualEngineButton");

const manualEngineModal =
  document.getElementById("manualEngineModal");

const manualEngineYes =
  document.getElementById("manualEngineYes");

const manualEngineNo =
  document.getElementById("manualEngineNo");

const manualEngineCancel =
  document.getElementById("manualEngineCancel");

const manualEngineNote =
  document.getElementById("manualEngineNote");


// ==========================================================
// VARIABLES DE ESTADO
// ==========================================================

// Estado informado por el sistema.
// No representa necesariamente confirmacion fisica IGF.

let engineOn = null;

let engineCommandRunning = false;

// Confirmacion manual.
// null  = sin confirmacion
// true  = motor observado encendido
// false = motor observado apagado
//
// Solo afecta la visualizacion.

let manualEngineState = null;

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

  // No realizar prueba de conexion automatica.

  setConnectionState(
    "unknown"
  );

  // Consultar los estados iniciales.

  await refreshEngineState();

  await refreshImmobilizerState();
}


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
// COMUNICACION CON VEHICLE-API
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
// VERIFICAR CONEXION REAL CON ESP32
//
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

      if (result.connected === true) {

        setConnectionState(
          "online"
        );

        updateLastCommunication();

        connectionButton.textContent =
          "VERIFICAR NUEVAMENTE";

      } else {

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
// INICIAR VERIFICACION DE SESION
// ==========================================================

verifySession();
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

  // Estado confirmado manualmente.
  // Solo modifica la indicacion visual.

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

  // Estado informado por el sistema.

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
// CONTROL DE BOTONES DEL MOTOR
// ==========================================================

function updateEngineButtons() {

  updateEngineVisual();

  if (!startButton || !stopButton) {
    return;
  }

  // Mientras se procesa un comando,
  // ambos botones permanecen bloqueados.

  if (engineCommandRunning) {

    startButton.disabled = true;
    stopButton.disabled = true;

    return;
  }

  // El estado manual NO autoriza comandos.

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

  // Estado desconocido.

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

    // Solo aceptar valores booleanos validos.

    if (typeof result.engineOn !== "boolean") {

      throw new Error(
        "Estado del motor no disponible"
      );
    }

    engineOn = result.engineOn;

    console.log(
      "Estado del motor:",
      engineOn
        ? "ENCENDIDO"
        : "APAGADO"
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
// VENTANA DE CONFIRMACION MANUAL
// CORRECCION DEL ATRIBUTO hidden
// ==========================================================

function openManualEngineModal() {

  if (!manualEngineModal) {

    alert(
      "No se encontro manualEngineModal " +
      "en dashboard.html"
    );

    return;
  }

  // CORRECCION:
  // hidden es un atributo HTML,
  // no una clase CSS.

  manualEngineModal.hidden = false;

  manualEngineModal.setAttribute(
    "aria-hidden",
    "false"
  );
}


function closeManualEngineModal() {

  if (!manualEngineModal) {
    return;
  }

  manualEngineModal.hidden = true;

  manualEngineModal.setAttribute(
    "aria-hidden",
    "true"
  );
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

  const estado =
    manualEngineState
      ? "ENCENDIDO"
      : "APAGADO";

  manualEngineNote.textContent =
    "Motor " + estado +
    " — confirmado manualmente. " +
    "No verificado mediante IGF. " +
    "Esta indicación no cambia los permisos " +
    "de control del motor.";

  manualEngineNote.hidden = false;
}


// ==========================================================
// REGISTRAR ESTADO MANUAL
// ==========================================================

function confirmManualEngineState(state) {

  if (engineCommandRunning) {

    alert(
      "Espere a que termine el comando del motor."
    );

    return;
  }

  // Solo modifica la visualizacion.
  // No envia comandos al ESP32.
  // No modifica engineOn.

  manualEngineState = state;

  updateEngineVisual();

  updateManualEngineNotice();

  closeManualEngineModal();

  console.log(
    "Confirmacion manual:",
    state ? "ENCENDIDO" : "APAGADO"
  );
}


// ==========================================================
// BOTON VERIFICAR ESTADO DEL MOTOR
// ==========================================================

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


// ==========================================================
// BOTON SI, ESTA ENCENDIDO
// ==========================================================

if (manualEngineYes) {

  manualEngineYes.addEventListener(
    "click",
    () => {

      confirmManualEngineState(true);
    }
  );

}


// ==========================================================
// BOTON NO, ESTA APAGADO
// ==========================================================

if (manualEngineNo) {

  manualEngineNo.addEventListener(
    "click",
    () => {

      confirmManualEngineState(false);
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
// CERRAR VENTANA CON ESCAPE
// ==========================================================

document.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Escape") {

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

      if (event.target === manualEngineModal) {

        closeManualEngineModal();
      }
    }
  );

}


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

    const result =
      await vehicleApi(
        "immobilizer-status"
      );

    if (
      typeof result.immobilizerOn !== "boolean"
    ) {

      throw new Error(
        "Estado del inmovilizador no disponible"
      );
    }

    immobilizerOn =
      result.immobilizerOn;

    console.log(
      "Inmovilizador:",
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

const batteryButton =
  document.getElementById(
    "batteryButton"
  );

const batteryValue =
  document.getElementById(
    "batteryValue"
  );

if (batteryButton && batteryValue) {

  batteryButton.addEventListener(
    "click",
    async () => {

      batteryButton.disabled = true;

      batteryButton.textContent =
        "CONSULTANDO...";

      try {

        const result =
          await vehicleApi(
            "battery"
          );

        if (
          result.battery === null ||
          result.battery === undefined ||
          result.battery === ""
        ) {

          throw new Error(
            "No se recibio voltaje"
          );
        }

        const voltage =
          Number(result.battery);

        if (!Number.isFinite(voltage)) {

          throw new Error(
            "Voltaje invalido"
          );
        }

        batteryValue.textContent =
          voltage.toFixed(2);

        updateLastCommunication();

      } catch (error) {

        console.error(
          "Error bateria:",
          error
        );

        batteryValue.textContent =
          "--";

        alert(
          "Error consultando bateria:\n\n" +
          error.message
        );

      } finally {

        batteryButton.disabled = false;

        batteryButton.textContent =
          "CONSULTAR";
      }
    }
  );
}


// ==========================================================
// CONSULTAR TEMPERATURA
// ==========================================================

const temperatureButton =
  document.getElementById(
    "temperatureButton"
  );

const temperatureValue =
  document.getElementById(
    "temperatureValue"
  );

if (temperatureButton && temperatureValue) {

  temperatureButton.addEventListener(
    "click",
    async () => {

      temperatureButton.disabled = true;

      temperatureButton.textContent =
        "CONSULTANDO...";

      try {

        const result =
          await vehicleApi(
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

        if (
          !Number.isFinite(temperature)
        ) {

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

        temperatureValue.textContent =
          "--";

        alert(
          "Error consultando temperatura:\n\n" +
          error.message
        );

      } finally {

        temperatureButton.disabled = false;

        temperatureButton.textContent =
          "CONSULTAR";
      }
    }
  );
}


// ==========================================================
// CONSULTAR COMBUSTIBLE
// ==========================================================

const fuelButton =
  document.getElementById(
    "fuelButton"
  );

const fuelValue =
  document.getElementById(
    "fuelValue"
  );

if (fuelButton && fuelValue) {

  fuelButton.addEventListener(
    "click",
    async () => {

      fuelButton.disabled = true;

      fuelButton.textContent =
        "CONSULTANDO...";

      try {

        const result =
          await vehicleApi(
            "fuel"
          );

        if (
          result.fuel === null ||
          result.fuel === undefined ||
          result.fuel === ""
        ) {

          throw new Error(
            "No se recibio combustible"
          );
        }

        const fuel =
          Number(result.fuel);

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

        fuelValue.textContent =
          "--";

        alert(
          "Error consultando combustible:\n\n" +
          error.message
        );

      } finally {

        fuelButton.disabled = false;

        fuelButton.textContent =
          "CONSULTAR";
      }
    }
  );
}


// ==========================================================
// FIN DE LA PARTE 2
// ==========================================================
// ==========================================================
// ENCENDER MOTOR
// ==========================================================

if (startButton) {

  startButton.addEventListener(
    "click",
    async () => {

      if (engineCommandRunning) {
        return;
      }

      // Evitar enviar un comando si el estado
      // informado por el sistema es desconocido.

      if (engineOn === null) {

        alert(
          "No se conoce el estado del motor.\n\n" +
          "Se consultará nuevamente al servidor."
        );

        await refreshEngineState();

        return;
      }

      if (engineOn === true) {

        alert(
          "El sistema ya informa que el motor está encendido."
        );

        return;
      }

      // IMPORTANTE:
      // La confirmacion manual no autoriza el arranque.
      // Los enclavamientos de seguridad deben
      // comprobarse en el ESP32 o controlador físico.

      const confirmed = confirm(
        "¿Desea solicitar el encendido del motor?\n\n" +
        "Antes de continuar, compruebe que:\n" +
        "- El vehículo esté inmovilizado.\n" +
        "- La transmisión esté en P o N.\n" +
        "- No haya personas cerca de partes móviles.\n" +
        "- El motor no esté funcionando.\n\n" +
        "Esta confirmación no sustituye los " +
        "enclavamientos físicos de seguridad."
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

        const result = await vehicleApi(
          "start"
        );

        console.log(
          "Respuesta de arranque:",
          result
        );

        // La respuesta exitosa confirma que el
        // servicio aceptó la solicitud, pero
        // NO verifica físicamente el arranque.
        //
        // Consultamos el estado informado por
        // el servidor después del comando.

        manualEngineState = null;

        updateManualEngineNotice();

        await refreshEngineState();

        alert(
          "Solicitud de encendido procesada.\n\n" +
          "El arranque físico no está confirmado " +
          "mediante IGF.\n\n" +
          "Puede utilizar VERIFICAR ESTADO DEL MOTOR " +
          "para registrar lo observado físicamente."
        );

      } catch (error) {

        console.error(
          "Error de arranque:",
          error
        );

        manualEngineState = null;

        updateManualEngineNotice();

        engineOn = null;

        alert(
          "No se pudo completar la solicitud " +
          "de encendido.\n\n" +
          error.message
        );

      } finally {

        startButton.textContent =
          originalText;

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

      if (engineCommandRunning) {
        return;
      }

      if (engineOn === null) {

        alert(
          "No se conoce el estado del motor.\n\n" +
          "Se consultará nuevamente al servidor."
        );

        await refreshEngineState();

        return;
      }

      if (engineOn === false) {

        alert(
          "El sistema ya informa que el motor está apagado."
        );

        return;
      }

      const confirmed = confirm(
        "¿Desea solicitar el apagado del motor?\n\n" +
        "Compruebe que el vehículo esté detenido " +
        "y que la operación sea segura."
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

        const result = await vehicleApi(
          "stop"
        );

        console.log(
          "Respuesta de apagado:",
          result
        );

        manualEngineState = null;

        updateManualEngineNotice();

        await refreshEngineState();

        alert(
          "Solicitud de apagado procesada.\n\n" +
          "Verifique físicamente que el motor " +
          "se haya detenido."
        );

      } catch (error) {

        console.error(
          "Error de apagado:",
          error
        );

        manualEngineState = null;

        updateManualEngineNotice();

        engineOn = null;

        alert(
          "No se pudo completar la solicitud " +
          "de apagado.\n\n" +
          error.message
        );

      } finally {

        stopButton.textContent =
          originalText;

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

      if (immobilizerCommandRunning) {
        return;
      }

      // Consultar si se desconoce el estado.

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

      // Si se va a activar el inmovilizador,
      // consultar el estado del motor.

      if (activating) {

        await refreshEngineState();

        // No autorizar desde la interfaz si
        // el sistema no informa motor apagado.
        //
        // Esto es una comprobacion adicional,
        // NO sustituye la proteccion física.

        if (engineOn !== false) {

          alert(
            "No se puede solicitar la activación " +
            "del inmovilizador.\n\n" +
            "El sistema no confirma que el motor " +
            "esté apagado.\n\n" +
            "La confirmación manual no sustituye " +
            "una señal física de seguridad."
          );

          return;
        }
      }

      const message = activating
        ? (
            "¿Desea ACTIVAR el inmovilizador?\n\n" +
            "IMPORTANTE:\n" +
            "El inmovilizador debe impedir " +
            "futuros arranques y nunca detener " +
            "un motor en funcionamiento.\n\n" +
            "Confirme que el vehículo esté " +
            "completamente detenido."
          )
        : (
            "¿Desea DESACTIVAR el inmovilizador?"
          );

      if (!confirm(message)) {
        return;
      }

      immobilizerCommandRunning = true;

      updateImmobilizerButton();

      try {

        const result = await vehicleApi(
          "immobilizer"
        );

        console.log(
          "Respuesta del inmovilizador:",
          result
        );

        // Consultar el estado reportado después
        // de enviar el comando.

        await refreshImmobilizerState();

        if (immobilizerOn === true) {

          alert(
            "El sistema informa que el " +
            "inmovilizador está ACTIVADO.\n\n" +
            "Compruebe su estado físico."
          );

        } else if (immobilizerOn === false) {

          alert(
            "El sistema informa que el " +
            "inmovilizador está DESACTIVADO."
          );

        } else {

          alert(
            "La solicitud fue procesada, pero " +
            "no se pudo verificar el estado " +
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
          "No se pudo completar la solicitud " +
          "del inmovilizador.\n\n" +
          error.message
        );

      } finally {

        immobilizerCommandRunning = false;

        updateImmobilizerButton();
      }
    }
  );
}


// ==========================================================
// INICIALIZACION VISUAL
// ==========================================================

// Al cargar la página, no existe una
// confirmacion manual anterior.

manualEngineState = null;

updateManualEngineNotice();

updateEngineButtons();

updateImmobilizerButton();


// ==========================================================
// FIN DEL ARCHIVO dashboard.js
// ==========================================================
