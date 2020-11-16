import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";

export const validateRegister = (data: UsernamePasswordInput) => {
  if (!data.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Email not valid"
      }
    ];
  }
  if (data.username.length <= 2) {
    return [
      {
        field: "username",
        message: "length must be more than 2"
      }
    ];
  }
  if (data.username.includes("@")) {
    return [
      {
        field: "username",
        message: "username can not include an @ sign"
      }
    ];
  }
  if (data.password.length <= 2) {
    return [
      {
        field: "password",
        message: "length must be more than 2"
      }
    ];
  }
  return null;
};
