const SUPABASE_URL = "https://ymgsxzpepmsdfkkvyyzg.supabase.co";

const SUPABASE_KEY = "sb_publishable_nYThOTaTkC_grNuhePyGHw_nyYYLypH";

// Cuenta de Supabase asociada a cada vehículo.
// El usuario NO tendrá que escribir este correo.
const VEHICLES = {
  "1NZ": {
    name: "Toyota 1NZ",
    email: "TU_CORREO_DE_SUPABASE"
  }
};

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const vehicleCode =
    document.getElementById("vehicle").value;

  const password =
    document.getElementById("password").value;

  const vehicle = VEHICLES[vehicleCode];

  message.style.color = "#ff6b6b";
  message.textContent = "";

  if (!vehicle) {
    message.textContent = "Vehículo no válido.";
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "VERIFICANDO...";

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: vehicle.email,
        password: password
      });

    if (error) {

      console.error("Error de autenticación:", error);

      message.textContent =
        "Contraseña incorrecta.";

      return;
    }

    console.log(
      "Acceso autorizado:",
      vehicle.name,
      data.user.id
    );

    // Guardamos solamente qué vehículo seleccionó.
    sessionStorage.setItem(
      "vehicleCode",
      vehicleCode
    );

    message.style.color = "#55d98b";
    message.textContent =
      "Acceso autorizado. Abriendo panel...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 700);

  } catch (error) {

    console.error(error);

    message.style.color = "#ff6b6b";
    message.textContent =
      "No se pudo conectar con el servidor.";

  } finally {

    loginButton.disabled = false;
    loginButton.textContent = "INGRESAR";

  }

});
