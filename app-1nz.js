const SUPABASE_URL =
  "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";


// ======================================================
// TOYOTA 1NZ-FE
// ======================================================

const VEHICLE_CODE =
  "1NZ";

const VEHICLE_NAME =
  "Toyota 1NZ-FE";


// Cuenta interna correspondiente al Toyota 1NZ-FE.
// No se muestra al usuario.
const VEHICLE_EMAIL =
  "zetaandrew45@gmail.com";


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

const loginForm =
  document.getElementById(
    "loginForm"
  );

const loginButton =
  document.getElementById(
    "loginButton"
  );

const passwordInput =
  document.getElementById(
    "password"
  );

const togglePassword =
  document.getElementById(
    "togglePassword"
  );

const backButton =
  document.getElementById(
    "backButton"
  );

const message =
  document.getElementById(
    "message"
  );


// ======================================================
// MOSTRAR / OCULTAR CONTRASEÑA
// ======================================================

togglePassword.addEventListener(
  "click",
  () => {

    const hidden =
      passwordInput.type ===
      "password";


    passwordInput.type =
      hidden
        ? "text"
        : "password";


    togglePassword.textContent =
      hidden
        ? "OCULTAR"
        : "VER";


    togglePassword.setAttribute(
      "aria-label",
      hidden
        ? "Ocultar contraseña"
        : "Mostrar contraseña"
    );


    passwordInput.focus();
  }
);


// ======================================================
// VOLVER A SELECCION
// ======================================================

backButton.addEventListener(
  "click",
  () => {

    window.location.href =
      "index.html";
  }
);


// ======================================================
// LOGIN
// ======================================================

loginForm.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();


    const password =
      passwordInput.value;


    // --------------------------------------------------
    // LIMPIAR MENSAJE
    // --------------------------------------------------

    message.classList.remove(
      "success",
      "error"
    );

    message.textContent =
      "";


    // --------------------------------------------------
    // VALIDACION BASICA
    // --------------------------------------------------

    if (!password) {

      message.classList.add(
        "error"
      );

      message.textContent =
        "Ingrese la contraseña.";

      passwordInput.focus();

      return;
    }


    // --------------------------------------------------
    // ESTADO DE CARGA
    // --------------------------------------------------

    loginButton.disabled =
      true;

    togglePassword.disabled =
      true;

    loginButton.innerHTML =
      `
        <span>VERIFICANDO ACCESO...</span>
        <span class="button-arrow">•••</span>
      `;


    try {

      // ------------------------------------------------
      // AUTENTICACION SUPABASE
      // ------------------------------------------------

      const {
        data,
        error
      } =
        await supabaseClient.auth
          .signInWithPassword({
            email:
              VEHICLE_EMAIL,

            password:
              password
          });


      // ------------------------------------------------
      // ACCESO RECHAZADO
      // ------------------------------------------------

      if (error) {

        console.error(
          "Error de autenticación:",
          error
        );


        message.classList.add(
          "error"
        );

        message.textContent =
          "Contraseña incorrecta.";


        passwordInput.select();

        return;
      }


      // ------------------------------------------------
      // ACCESO AUTORIZADO
      // ------------------------------------------------

      console.log(
        "Acceso autorizado:",
        VEHICLE_NAME,
        data.user.id
      );


      sessionStorage.setItem(
        "vehicleCode",
        VEHICLE_CODE
      );


      message.classList.add(
        "success"
      );


      message.textContent =
        "Acceso autorizado. Abriendo panel de control...";


      loginButton.innerHTML =
        `
          <span>ACCESO AUTORIZADO</span>
          <span class="button-arrow">✓</span>
        `;


      // ------------------------------------------------
      // ABRIR DASHBOARD
      // ------------------------------------------------

      setTimeout(
        () => {

          window.location.href =
            "dashboard.html";

        },
        650
      );


    } catch (error) {

      console.error(
        "Error de conexión:",
        error
      );


      message.classList.add(
        "error"
      );


      message.textContent =
        "No se pudo conectar con el servidor.";


    } finally {

      // Solo restauramos los controles si seguimos
      // en esta pagina.

      setTimeout(
        () => {

          if (
            window.location.pathname
              .includes(
                "index-1nz"
              )
          ) {

            loginButton.disabled =
              false;

            togglePassword.disabled =
              false;

            loginButton.innerHTML =
              `
                <span>INGRESAR AL SISTEMA</span>
                <span class="button-arrow">→</span>
              `;
          }

        },
        800
      );
    }
  }
);
