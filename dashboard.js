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

    sessionStorage.removeItem("vehicleCode");

    window.location.replace("index.html");

  }
);

/*
--------------------------------------------------
BOTONES DE TELEMETRÍA

Por ahora NO hablan con Blynk.
--------------------------------------------------
*/

document
  .getElementById("batteryButton")
  .addEventListener("click", async () => {

    const button =
      document.getElementById("batteryButton");

    const batteryValue =
      document.getElementById("batteryValue");

    button.disabled = true;
    button.textContent = "CONSULTANDO...";

    try {

      // Obtener la sesión actual de Supabase
      const {
        data: { session },
        error: sessionError
      } = await supabaseClient.auth.getSession();

      if (sessionError || !session) {
        window.location.replace("index.html");
        return;
      }

      // Llamar a nuestra Edge Function
      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/vehicle-api`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            "Authorization":
              `Bearer ${session.access_token}`,

            "apikey": SUPABASE_KEY
          },

          body: JSON.stringify({
            action: "battery"
          })
        }
      );

      const result = await response.json();

      console.log(
        "Respuesta vehicle-api:",
        result
      );

      if (!response.ok || !result.success) {

        throw new Error(
          result.error ||
          "No se pudo consultar la batería"
        );

      }

      // Mostrar voltaje recibido de Blynk
      batteryValue.textContent =
        Number(result.battery).toFixed(2);

      // Actualizar última comunicación
      document
        .getElementById("lastCommunication")
        .textContent =
          new Date().toLocaleString();

    } catch (error) {

      console.error(
        "Error consultando batería:",
        error
      );

      batteryValue.textContent = "--";

      alert(
        "No se pudo obtener el voltaje de batería."
      );

    } finally {

      button.disabled = false;
      button.textContent = "CONSULTAR";

    }

  });


document
  .getElementById("temperatureButton")
  .addEventListener("click", () => {

    alert(
      "La lectura de temperatura se conectará al ESP32 en el siguiente paso."
    );

  });


document
  .getElementById("fuelButton")
  .addEventListener("click", () => {

    alert(
      "La lectura de combustible se conectará al ESP32 en el siguiente paso."
    );

  });

/*
--------------------------------------------------
COMANDOS CRÍTICOS

Todavía NO se envía ninguna orden real.
--------------------------------------------------
*/

document
  .getElementById("startButton")
  .addEventListener("click", () => {

    const confirmed = confirm(
      "¿Desea solicitar el encendido del motor?"
    );

    if (confirmed) {

      alert(
        "Prueba de interfaz: no se envió ninguna orden al vehículo."
      );

    }

  });


document
  .getElementById("stopButton")
  .addEventListener("click", () => {

    const confirmed = confirm(
      "¿Desea solicitar el apagado del motor?"
    );

    if (confirmed) {

      alert(
        "Prueba de interfaz: no se envió ninguna orden al vehículo."
      );

    }

  });


document
  .getElementById("immobilizerButton")
  .addEventListener("click", () => {

    const confirmed = confirm(
      "¿Desea activar el inmovilizador?"
    );

    if (confirmed) {

      alert(
        "Prueba de interfaz: no se envió ninguna orden al vehículo."
      );

    }

  });
