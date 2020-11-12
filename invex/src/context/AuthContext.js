import React from "react";
import createDataContext from "./createDataContext";
import { auth } from "../api/firebase";

const emailRegEx = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/;

const authReducer = (state, action) => {
  switch (action.type) {
    case "set_error":
      return { ...state, error: action.payload, confirmationMessage: "" };
    case "clear_error_message":
      return { ...state, error: "" };
    case "confirm_email_sent":
      return { ...state, confirmationMessage: action.payload, error: "" };
    default:
      return state;
  }
};

const signin = (dispatch) => async ({ email, password, history}) => {
  if (email && password) {
    try {
      await auth.signInWithEmailAndPassword(email, password);
      history.push("/dashboard");
      dispatch({ type: "clear_error_message"});
    } catch (error) {
      let errorMessage = "";
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid Email";
          break;
        case "auth/user-disabled":
          errorMessage = "User is disabled.";
          break;
        case "auth/user-not-found":
          errorMessage = "This email is not registered";
          break;
        case "auth/wrong-password":
          errorMessage = "Wrong password";
          break;
        default:
          errorMessage = "There was an error while attempting to sign in.";
          break;
      }
      const errorComponent = <div className="text-danger">{errorMessage}</div>;
      dispatch({ type: "set_error", payload: errorComponent });
    }
  } else {
    const errorComponent = <div className="text-danger">Missing Values.</div>;
    dispatch({ type: "set_error", payload: errorComponent });
  }
};

const signup = (dispatch) => async ({
  email,
  password,
  passwordConfirmation,
}) => {
  let tempError = "";

  if (email && password && passwordConfirmation) {
    if (!emailRegEx.test(email)) {
      tempError += "Invalid email.\n";
    }
    if (!/\d/.test(password)) {
      tempError += "Password must include a number.\n";
    }
    if (!/[a-z]/.test(password)) {
      tempError += "Password must include a lower case letter.\n";
    }
    if (!/[A-Z]/.test(password)) {
      tempError += "Password must include an uppercase letter.\n";
    }
    if (password.length < 8) {
      tempError += "Password must contain 8 characters at least.\n";
    }
    if (!specialCharRegex.test(password)) {
      tempError += "Password must include an special character.\n";
    }
    if (password !== passwordConfirmation) {
      tempError += "Passwords are different.";
    }
  } else {
    tempError = "Missing values.";
  }

  if (tempError.length > 0) {
    if (tempError.charAt(tempError.length - 1) === "\n") {
      tempError = tempError.substring(0, tempError.length - 1);
    }

    const errorComponent = tempError.split("\n").map((e, index) => (
      <div key={index} className="text-danger">
        {e}
      </div>
    ));

    dispatch({ type: "set_error", payload: errorComponent });
  } else {
    try {
      const { user } = await auth.createUserWithEmailAndPassword(
        email,
        password
      );
      await user.sendEmailVerification();
    } catch (err) {
      let errorComponent;

      switch (err.code) {
        case "auth/email-already-in-use":
          errorComponent = (
            <div className="text-danger">This email already has an account</div>
          );
          break;
        case "auth/invalid-email":
          errorComponent = <div className="text-danger">Invalid email</div>;
          break;
        case "auth/operation-not-allowed":
          errorComponent = (
            <div className="text-danger">
              Email/password accounts are not enabled.
            </div>
          );
          break;
        case "auth/weak-password":
          errorComponent = (
            <div className="text-danger">Password is not strong</div>
          );
          break;
        default:
          errorComponent = <div className="text-danger">An error ocurred.</div>;
          break;
      }

      dispatch({ type: "set_error", payload: errorComponent });
    }
  }
};

const sendConfirmationEmail = (dispatch) => async () => {
  const user = auth.currentUser;
  if (user) {
    try {
      await user.sendEmailVerification();
      dispatch({ type: "confirm_email_sent", payload: "Email has been sent." });
    } catch (error) {
      dispatch({
        type: "set_error",
        payload: "Email could not be sent. Try again later.",
      });
    }
  } else {
    dispatch({ type: "set_error", payload: "User is not logged in" });
  }
};

const signout = (dispatch) => async () => {
  auth.signOut();
};

export const { Provider, Context } = createDataContext(
  authReducer,
  { signout, signup, signin, sendConfirmationEmail },
  { error: "", confirmationMessage: "" }
);