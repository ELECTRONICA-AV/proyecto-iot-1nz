```javascript
const SUPABASE_URL =
  "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";


// ======================================================
// CONFIGURACIÓN
// ======================================================

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
// VERIFICAR SESIÓN
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


    // Además de comprobar que existe una sesión,
    // comprobamos que pertenece al usuario del
    // Cierre Centralizado.

    const userEmail =
      session.user.email;


    if (
      !userEmail ||
      userEmail.toLowerCase() !==
        CENTRALIZED_EMAIL.toLowerCase()
    ) {

      console.warn(
        "La sesión no pertenece al Cierre Centralizado."
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
      "Error verificando sesión:",
      error
    );


    window.location.replace(
      "index-centralizado.html"
    );
  }
}


verifySession();


// ======================================================
// ABRIR
// ======================================================

openButton.addEventListener(
  "click",
  function () {

    const confirmed =
      confirm(
        "¿Desea abrir el cierre centralizado?"
      );


    if (!confirmed) {
      return;
    }


    // Por ahora solamente simulamos.
    // Después aquí llamaremos central-lock-api.

    console.log(
      "SIMULACIÓN: ABRIR"
    );


    lastCommand.textContent =
      "ABRIR";


    lastCommunication.textContent =
      new Date().toLocaleString();


    alert(
      "Prueba correcta.\n\n" +
      "El comando ABRIR todavía no fue enviado a Blynk."
    );
  }
);


// ======================================================
// CERRAR
// ======================================================

closeButton.addEventListener(
  "click",
  function () {

    const confirmed =
      confirm(
        "¿Desea cerrar el cierre centralizado?"
      );


    if (!confirmed) {
      return;
    }


    // Por ahora solamente simulamos.
    // Después aquí llamaremos central-lock-api.

    console.log(
      "SIMULACIÓN: CERRAR"
    );


    lastCommand.textContent =
      "CERRAR";


    lastCommunication.textContent =
      new Date().toLocaleString();


    alert(
      "Prueba correcta.\n\n" +
      "El comando CERRAR todavía no fue enviado a Blynk."
    );
  }
);


// ======================================================
// CERRAR SESIÓN
// ======================================================

logoutButton.addEventListener(
  "click",
  async function () {

    try {

      await supabaseClient.auth.signOut();

    } catch (error) {

      console.error(
        "Error cerrando sesión:",
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
```
