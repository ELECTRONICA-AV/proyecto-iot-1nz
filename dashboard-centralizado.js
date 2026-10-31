
const SUPABASE_URL =
  "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";

const CENTRALIZED_EMAIL =
  "www.leoandres9502202@gmail.com";


// ======================================================
// SUPABASE
// ======================================================

const supabaseClient =
  supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
  );


// ======================================================
// ELEMENTOS
// ======================================================

const loadingScreen =
  document.getElementById("loadingScreen");

const dashboard =
  document.getElementById("dashboard");

const openButton =
  document.getElementById("openButton");

const closeButton =
  document.getElementById("closeButton");

const logoutButton =
  document.getElementById("logoutButton");

const lastCommand =
  document.getElementById("lastCommand");

const lastCommunication =
  document.getElementById("lastCommunication");


// ======================================================
// VERIFICAR SESION
// ======================================================

async function verifySession() {

  try {

    const {
      data: { session },
      error
    } =
      await supabaseClient.auth.getSession();


    if (
      error ||
      !session ||
      !session.user
    ) {

      window.location.replace(
        "index-centralizado.html"
      );

      return;
    }


    const userEmail =
      session.user.email;


    if (
      !userEmail ||
      userEmail.toLowerCase() !==
        CENTRALIZED_EMAIL.toLowerCase()
    ) {

      console.warn(
        "Sesion no autorizada para Cierre Centralizado"
      );


      await supabaseClient.auth.signOut();


      window.location.replace(
        "index-centralizado.html"
      );

      return;
    }


    console.log(
      "Dashboard autorizado:",
      userEmail
    );


    loadingScreen.classList.add(
      "hidden"
    );

    dashboard.classList.remove(
      "hidden"
    );


  } catch (error) {

    console.error(
      "Error verificando sesion:",
      error
    );


    window.location.replace(
      "index-centralizado.html"
    );
  }
}


verifySession();


// ======================================================
// OBTENER SESION
// ======================================================

async function getSession() {

  const {
    data: { session },
    error
  } =
    await supabaseClient.auth.getSession();


  if (
    error ||
    !session
  ) {

    window.location.replace(
      "index-centralizado.html"
    );

    return null;
  }


  return session;
}


// ======================================================
// CENTRAL LOCK API
// ======================================================

async function centralLockApi(action) {

  const session =
    await getSession();


  if (!session) {

    throw new Error(
      "Sesion no disponible"
    );
  }


  const response =
    await fetch(
      `${SUPABASE_URL}/functions/v1/central-lock-api`,
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
    "central-lock-api:",
    action,
    result
  );


  if (
    !response.ok ||
    !result.success
  ) {

    throw new Error(
      result.error ||
      "No se pudo ejecutar el comando"
    );
  }


  return result;
}


// ======================================================
// ACTUALIZAR ESTADO
// ======================================================

function updateStatus(command) {

  lastCommand.textContent =
    command;


  lastCommunication.textContent =
    new Date().toLocaleString();
}


// ======================================================
// ABRIR
// ======================================================

openButton.addEventListener(
  "click",
  async function () {

    const confirmed =
      confirm(
        "¿Desea ABRIR el cierre centralizado?"
      );


    if (!confirmed) {
      return;
    }


    openButton.disabled = true;
    closeButton.disabled = true;


    const originalText =
      openButton.innerHTML;


    openButton.textContent =
      "ENVIANDO...";


    try {

      const result =
        await centralLockApi(
          "open"
        );


      console.log(
        "Apertura enviada:",
        result
      );


      updateStatus(
        "ABRIR"
      );


      alert(
        "Comando de apertura enviado correctamente."
      );


    } catch (error) {

      console.error(
        "Error abriendo:",
        error
      );


      alert(
        "No se pudo enviar el comando de apertura.\n\n" +
        error.message
      );


    } finally {

      openButton.innerHTML =
        originalText;

      openButton.disabled =
        false;

      closeButton.disabled =
        false;
    }
  }
);


// ======================================================
// CERRAR
// ======================================================

closeButton.addEventListener(
  "click",
  async function () {

    const confirmed =
      confirm(
        "¿Desea CERRAR el cierre centralizado?"
      );


    if (!confirmed) {
      return;
    }


    openButton.disabled = true;
    closeButton.disabled = true;


    const originalText =
      closeButton.innerHTML;


    closeButton.textContent =
      "ENVIANDO...";


    try {

      const result =
        await centralLockApi(
          "close"
        );


      console.log(
        "Cierre enviado:",
        result
      );


      updateStatus(
        "CERRAR"
      );


      alert(
        "Comando de cierre enviado correctamente."
      );


    } catch (error) {

      console.error(
        "Error cerrando:",
        error
      );


      alert(
        "No se pudo enviar el comando de cierre.\n\n" +
        error.message
      );


    } finally {

      closeButton.innerHTML =
        originalText;

      openButton.disabled =
        false;

      closeButton.disabled =
        false;
    }
  }
);


// ======================================================
// CERRAR SESION
// ======================================================

logoutButton.addEventListener(
  "click",
  async function () {

    try {

      await supabaseClient.auth.signOut();

    } catch (error) {

      console.error(
        "Error cerrando sesion:",
        error
      );
    }


    sessionStorage.removeItem(
      "vehicleCode"
    );


    window.location.replace(
      "index.html"
    );
  }
);
