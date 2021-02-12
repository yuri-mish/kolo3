//import defaultUser from "../utils/default-user";
import { API_HOST } from "./../constants";

const getAuth = async (user, pass) => {
  const auth = await fetch(API_HOST, {
    method: "POST",
    credentials: "include",
    //mode:'cors',
    body: JSON.stringify({
      query: `{auth (name:"${user}",pass:"${pass}") }`,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      console.log(response);
      return response.json();
    })
    .then((data) => {
      //      data.data.auth.branch = data.data.branch
      if (data.data.auth) data.data.auth.isOk = true;
      return data.data.auth || { isOk: false };
    })
    .catch((e) => console.log("Ooops", e));

  return auth;
};

export const logout = async (user, pass) => {
  return await fetch(API_HOST, {
    method: "POST",
    credentials: "include",
    //credentials: 'same-origin',
    body: JSON.stringify({
      query: `{logout
              }`,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return data.data.logout;
    });
};

export async function signIn(email, password) {
  try {
    var result = await getAuth(email, password);
    // Send request
    //console.log(result, email, password);

    return {
      isOk: result.isOk,
      message: result.isOk ? "" : "Помилка входу",
      data: {
        email: email,
        avatarUrl: "https://otk.in.ua/wp-content/uploads/2020/07/logo.svg",
      },
    };
  } catch {
    return {
      isOk: false,
      message: "Authentication failed",
    };
  }
}

// export async function getUser() {
//   try {
//     // Send request

//     return {
//       isOk: false,

//       //      isOk: true,
//       //      data: defaultUser
//     };
//   } catch {
//     return {
//       isOk: false,
//     };
//   }
// }

export async function createAccount(email, password) {
  try {
    // Send request
    console.log(email, password);

    return {
      isOk: true,
    };
  } catch {
    return {
      isOk: false,
      message: "Failed to create account",
    };
  }
}

export async function changePassword(email, recoveryCode) {
  try {
    // Send request
    console.log(email, recoveryCode);

    return {
      isOk: true,
    };
  } catch {
    return {
      isOk: false,
      message: "Failed to change password",
    };
  }
}

export async function resetPassword(email) {
  try {
    // Send request
    console.log(email);

    return {
      isOk: true,
    };
  } catch {
    return {
      isOk: false,
      message: "Failed to reset password",
    };
  }
}
