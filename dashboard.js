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
    () => {

      alert(
        "La lectura de temperatura se conectara al ESP32 mas adelante."
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
*/

document
  .getElementById("stopButton")
  .addEventListener(
    "click",
    async () => {

      const confirmed =
        confirm(
          "¿Desea solicitar el apagado del motor?"
        );


      if (!confirmed) {
        return;
      }


      const button =
        document.getElementById(
          "stopButton"
        );


      button.disabled = true;

      const originalText =
        button.textContent;


      button.textContent =
        "APAGANDO...";


      try {

        const result =
          await vehicleApi(
            "stop"
          );


        console.log(
          "Solicitud de apagado:",
          result
        );


        updateLastCommunication();


        alert(
          "Solicitud de apagado enviada correctamente."
        );


      } catch (error) {

        console.error(
          "Error solicitando apagado:",
          error
        );


        alert(
          "No se pudo enviar la solicitud de apagado.\n\n" +
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
