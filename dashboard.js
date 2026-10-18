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


/*
--------------------------------------------------
VERIFICAR SESIÓN
--------------------------------------------------
*/

async function verifySession() {

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();


  if (error || !session) {

    window.location.replace("index.html");

    return;
  }


  loadingScreen.classList.add("hidden");

  dashboard.classList.remove("hidden");
}


verifySession();


/*
--------------------------------------------------
CERRAR SESIÓN
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
OBTENER SESIÓN
--------------------------------------------------
*/

async function getSession() {

  const {
    data: { session },
    error
  } = await supabaseClient.auth.getSession();


  if (error || !session) {

    window.location.replace(
      "index.html"
    );

    return null;
  }


  return session;
}


/*
--------------------------------------------------
LLAMAR VEHICLE-API
--------------------------------------------------

Todas las órdenes pasan por:

Dashboard
   ↓
Supabase
   ↓
vehicle-api
   ↓
Blynk
   ↓
ESP32

El token Blynk nunca está en GitHub.
--------------------------------------------------
*/

async function vehicleApi(action) {

  const session =
    await getSession();


  if (!session) {

    throw new Error(
      "Sesión no disponible"
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
      "Respuesta inválida del servidor"
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
ACTUALIZAR ÚLTIMA COMUNICACIÓN
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
BATERÍA
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
          "Error consultando batería:",
          error
        );


        batteryValue.textContent =
          "--";


        alert(
          "No se pudo obtener el voltaje de batería.\n\n" +
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
    () => {

      alert(
        "La lectura de temperatura se conectará al ESP32 más adelante."
      );
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
    () => {

      alert(
        "La lectura de combustible se conectará al ESP32 más adelante."
      );
    }
  );


/*
==================================================
ENCENDER MOTOR
==================================================

Por ahora:

GPIO26 = LED IGN
GPIO33 = LED START

NO hay conexión al vehículo.
==================================================
*/

document
  .getElementById("startButton")
  .addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "¿Desea solicitar el encendido del motor?"
        );


      if (!confirmed) {

        return;
      }


      const button =
        document.getElementById(
          "startButton"
        );


      button.disabled = true;

      const originalText =
        button.textContent;


      button.textContent =
        "ENVIANDO...";


      try {

        // ------------------------------------------
        // ENVIAR action=start
        // ------------------------------------------

        const result =
          await vehicleApi(
            "start"
          );


        console.log(
          "Solicitud de arranque:",
          result
        );


        updateLastCommunication();


        alert(
          "Solicitud de encendido enviada correctamente."
        );


      } catch (error) {

        console.error(
          "Error solicitando arranque:",
          error
        );


        alert(
          "No se pudo enviar la solicitud de encendido.\n\n" +
          error.message
        );


      } finally {

        button.disabled = false;

        button.textContent =
          originalText;
      }
    }
  );


/*
==================================================
APAGAR MOTOR
==================================================

Todavía deshabilitado a nivel lógico.
No enviamos ninguna orden al ESP32.
==================================================
*/

document
  .getElementById("stopButton")
  .addEventListener(
    "click",
    () => {

      const confirmed =
        confirm(
          "¿Desea solicitar el apagado del motor?"
        );


      if (confirmed) {

        alert(
          "El apagado remoto todavía no está habilitado."
        );
      }
    }
  );


/*
==================================================
INMOVILIZADOR
==================================================

Todavía deshabilitado a nivel lógico.
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
          "El inmovilizador todavía no está habilitado."
        );
      }
    }
  );
