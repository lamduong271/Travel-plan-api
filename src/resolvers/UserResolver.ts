import {
  Query,
  Resolver,
  Mutation,
  Arg,
  Field,
  Ctx,
  ObjectType
} from "type-graphql";
import { MyContext } from "src/types";
import argon2 from "argon2";
import { User } from "../entities/User";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constant";
import { UsernamePasswordInput } from "./UsernamePasswordInput";
import { validateRegister } from "../untils/validateRegister";
import { sendEmail } from "../untils/sendEmail";
import { v4 } from "uuid"; // random string from uuid

// @InputType()
// class LoginInput {
//   @Field()
//   username: string;

//   @Field()
//   password: string;
// }

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "hi!";
  }

  @Query(() => User, { nullable: true })
  async loginMe(@Ctx() { req, em }: MyContext) {
    if (!req.session.userId) {
      return null;
    }
    console.log("req.session ", req.session)

    const loginUser = await em.findOne(User, { id: req.session.userId });
    return loginUser;
  }

  @Mutation(() => UserResponse)
  async registerUser(
    @Arg("data", () => UsernamePasswordInput) data: UsernamePasswordInput,
    @Ctx() { req, em }: MyContext
  ): Promise<UserResponse> {
    const errors = validateRegister(data);
    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(data.password);
    const newUser = em.create(User, {
      username: data.username,
      password: hashedPassword,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName
    });
    try {
      await em.persistAndFlush(newUser);
    } catch (err) {
      if (err.code === "23505") {
        return {
          errors: [
            {
              field: "username",
              message: "username already exist"
            }
          ]
        };
      }
    }

    //register user -> set a cookie on user and keep them logged in
    req.session.userId = newUser.id;
    return {
      user: newUser
    };
  }

  @Mutation(() => UserResponse)
  async login(
    // @Arg("data", () => LoginInput) data: LoginInput,
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { em, req }: MyContext
  ) {
    const loginUser = await em.findOne(
      User,
      usernameOrEmail.includes("@")
        ? { email: usernameOrEmail }
        : { username: usernameOrEmail }
    );
    if (!loginUser) {
      return {
        errors: [
          {
            field: "usernameOrEmail",
            message: "not exist"
          }
        ]
      };
    }
    const validPassword = await argon2.verify(loginUser.password, password);
    if (!validPassword) {
      return {
        errors: [
          {
            field: "password",
            message: "incorrect password"
          }
        ]
      };
    }
    req.session!.userId = loginUser.id;
    return {
      user: loginUser
    };
  }

  @Mutation(() => Boolean)
  logoutUser(@Ctx() { req, res }: MyContext) {
    return new Promise(result =>
      req.session.destroy(err => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          result(false);
          return;
        }
        result(true);
      })
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg("email") email: string,
    @Ctx() { em, redis }: MyContext
  ) {
    const findUserByEmail = await em.findOne(User, { email });
    if (!findUserByEmail) {
      return true;
    }
    const token = v4(); // random string
    await redis.set(
      FORGET_PASSWORD_PREFIX + token,
      findUserByEmail.id,
      "ex",
      1000 * 60 * 60 * 3
    ); // 3days
    await sendEmail(
      email,
      `<a href="http://localhost:3000/change-password/${token}">reset password</a>`
    );
    return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { req, em, redis }: MyContext
  ): Promise<UserResponse> {
    if (newPassword.length <= 2) {
      return {
        errors: [
          {
            field: "newPassword",
            message: "new password 's length must be more than 2"
          }
        ]
      };
    }
    const key = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(key); // got the user's id
    if (!userId) {
      return {
        errors: [
          {
            field: "token",
            message: "token expired"
          }
        ]
      };
    }

    const updatingUser =  await em.findOne(User, { id: parseInt(userId)})
    if (!updatingUser) {
      return {
        errors: [
          {
            field: "token",
            message: "user no longer exists"
          }
        ]
      };
    }

    updatingUser.password = await argon2.hash(newPassword);
    await em.persistAndFlush(updatingUser)
    await redis.del(key) // delete token
    // login user after changing password
    req.session.userId = updatingUser.id
    return { user: updatingUser}
  }


}
