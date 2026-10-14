const SUPABASE_URL = "PEGA_AQUI_TU_API_URL";
const SUPABASE_KEY = "PEGA_AQUI_TU_PUBLISHABLE_KEY";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const loginForm = document.getElementById("loginForm");
const loginButton = document.getElementById("loginButton");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {

  event.preventDefault();

  const email = document
    .getElementById("email")
    .value
    .trim();

  const password = document
    .getElementById("password")
    .value;

  message.textContent = "";
  loginButton.disabled = true;
  loginButton.textContent = "VERIFICANDO...";

  try {

    const { data, error } =
      await supabaseClient.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {
      console.error(error);

      message.textContent =
        "Correo o contraseña incorrectos.";

      return;
    }

    console.log("Login correcto:", data.user.id);

    message.style.color = "#55d98b";
    message.textContent =
      "Acceso autorizado.";

    // Más adelante:
    // window.location.href = "dashboard.html";

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
