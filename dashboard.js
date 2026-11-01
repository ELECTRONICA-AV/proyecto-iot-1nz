const SUPABASE_URL =
  "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";


const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


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


// ==========================================================
// ESTADO LOCAL DEL MOTOR
// ==========================================================

let engineOn = null;
let engineCommandRunning = false;


/*
--------------------------------------------------
VERIFICAR SESION
--------------------------------------------------
*/

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


  // --------------------------------------------------------
  // CONSULTAR ESTADO DEL MOTOR AL ABRIR EL DASHBOARD
  // --------------------------------------------------------

  await refreshEngineState();
}


verifySession();


/*
--------------------------------------------------
CERRAR SESION
--------------------------------------------------
*/

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


/*
--------------------------------------------------
OBTENER SESION
--------------------------------------------------
*/

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


/*
--------------------------------------------------
LLAMAR VEHICLE-API
--------------------------------------------------
*/

async function vehicleApi(action) {

  const session =
    await getSession();


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


/*
--------------------------------------------------
ACTUALIZAR ULTIMA COMUNICACION
--------------------------------------------------
*/

function updateLastCommunication() {

  const element =
    document.getElementById(
      "lastCommunication"
    );


  if (element) {

    element.textContent =
      new Date().toLocaleString();
  }
}


/*
==================================================
CONTROL VISUAL DEL ESTADO DEL MOTOR
==================================================
*/

function updateEngineButtons() {

  // Mientras se envia una orden,
  // ambos botones permanecen bloqueados.

  if (engineCommandRunning) {

    startButton.disabled = true;
    stopButton.disabled = true;

    return;
  }


  // --------------------------------------------------------
  // MOTOR ENCENDIDO
  // --------------------------------------------------------

  if (engineOn === true) {

    startButton.disabled = true;
    stopButton.disabled = false;

    return;
  }


  // --------------------------------------------------------
  // MOTOR APAGADO
  // --------------------------------------------------------

  if (engineOn === false) {

    startButton.disabled = false;
    stopButton.disabled = true;

    return;
  }


  // --------------------------------------------------------
  // ESTADO DESCONOCIDO
  //
  // Por seguridad no permitimos enviar comandos hasta
  // conocer V4.
  // --------------------------------------------------------

  startButton.disabled = true;
  stopButton.disabled = true;
}


/*
==================================================
CONSULTAR ESTADO DEL MOTOR
==================================================
*/

async function refreshEngineState() {

  // Mientras consultamos V4,
  // no permitimos comandos de motor.

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
      "Estado motor:",
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


/*
==================================================
BATERIA
==================================================
*/

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


        batteryValue.textContent =
          Number(
            result.battery
          ).toFixed(2);


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


/*
==================================================
TEMPERATURA
==================================================
*/

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


        if (
          !Number.isFinite(
            temperature
          )
        ) {

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


/*
==================================================
COMBUSTIBLE
==================================================
*/

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


/*
==================================================
ENCENDER MOTOR
==================================================
*/

startButton.addEventListener(
  "click",
  async () => {

    // --------------------------------------------------------
    // PROTECCION LOCAL
    // --------------------------------------------------------

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
        "¿Desea solicitar el encendido del motor?"
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


      // vehicle-api solo responde correctamente
      // despues de confirmar V4 = 1.

      engineOn = true;


      updateLastCommunication();


      alert(
        "Motor marcado como encendido."
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


      // Si hubo un error no asumimos el estado.
      // Volvemos a consultar V4.

      engineOn = null;


    } finally {

      startButton.textContent =
        originalText;

      engineCommandRunning = false;


      // Si el resultado fue incierto,
      // consultar nuevamente V4.

      if (engineOn === null) {

        await refreshEngineState();

      } else {

        updateEngineButtons();
      }
    }
  }
);


/*
==================================================
APAGAR MOTOR
==================================================
*/

stopButton.addEventListener(
  "click",
  async () => {

    // --------------------------------------------------------
    // PROTECCION LOCAL
    // --------------------------------------------------------

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


      // vehicle-api confirma V4 = 0
      // antes de responder correctamente.

      engineOn = false;


      updateLastCommunication();


      alert(
        "Motor marcado como apagado."
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


/*
==================================================
INMOVILIZADOR
==================================================
*/

document
  .getElementById("immobilizerButton")
  .addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "¿Desea activar el inmovilizador?"
        );


      if (confirmed) {

        alert(
          "El inmovilizador todavia no esta habilitado."
        );
      }
    }
  );
