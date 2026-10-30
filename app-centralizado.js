javascript
const SUPABASE_URL = "https://ymgsxzpepmsdfkkvyyzg.supabase.co";
const SUPABASE_KEY = "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";

const VEHICLE_CODE = "CENTRALIZADO";
const VEHICLE_NAME = "Cierre Centralizado";
const VEHICLE_EMAIL = "www.leoandres9502202@gmail.com";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const password = document.getElementById("password").value;

  message.style.color = "#ff6b6b";
  message.textContent = "";

  loginButton.disabled = true;
  loginButton.textContent = "VERIFICANDO...";

  try {
    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: VEHICLE_EMAIL,
        password: password
      });

    if (error) {
      console.error("Error de autenticación:", error);
      message.textContent = "Contraseña incorrecta.";
      return;
    }

    console.log(
      "Acceso autorizado:",
      VEHICLE_NAME,
      data.user.id
    );

    sessionStorage.setItem(
      "vehicleCode",
      VEHICLE_CODE
    );

    message.style.color = "#55d98b";
    message.textContent =
      "Acceso autorizado. Abriendo panel...";

    setTimeout(function () {
      window.location.href =
        "dashboard-centralizado.html";
    }, 700);

  } catch (error) {
    console.error("Error inesperado:", error);

    message.style.color = "#ff6b6b";
    message.textContent =
      "No se pudo conectar con el servidor.";

  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "INGRESAR";
  }
});
```
