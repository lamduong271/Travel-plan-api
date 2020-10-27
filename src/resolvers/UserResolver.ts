import { Query, Resolver, Mutation, Arg, InputType, Field, Ctx, ObjectType } from "type-graphql"
import { MyContext } from "src/types"
import argon2 from 'argon2'
import { User } from "../entities/User"

@InputType()
class UsernamePasswordInput {
  @Field({nullable: true, defaultValue: ''})
  firstName?: string

  @Field({nullable: true,  defaultValue: ''})
  lastName?: string

  @Field()
  username: string

  @Field()
  password: string
}

@InputType()
class LoginInput {
  @Field()
  username: string

  @Field()
  password: string
}

@ObjectType()
class FieldError {
  @Field()
  field: string

  @Field()
  message: string
}

@ObjectType()
class UserResponse {
  @Field(()=> [FieldError], { nullable: true })
  error?: FieldError[]

  @Field(() => User, { nullable: true })
  user?: User
}

@Resolver()
export class UserResolver {
  @Query(() => String)
  hello() {
    return "hi!"
  }

  @Mutation(() => User)
  async registerUser(
    @Arg('data', () => UsernamePasswordInput ) data: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ) {
    const hashedPassword = await argon2.hash(data.password)
    const newUser = em.create(User, {
      username: data.username,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
    })
    await em.persistAndFlush(newUser)
    return newUser
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('data', () => LoginInput ) data: LoginInput,
    @Ctx() { em }: MyContext
  ) {
    const loginUser = await em.findOne(User, { username: data.username })
    if (!loginUser) {
      return {
        errors: [{
          field: 'username',
          message: 'not exist'
        }]
      }
    }
    const validPassword = await argon2.verify(loginUser.password, data.password)
    if (!validPassword) {
      return {
        errors: {
          field: "password",
          message: "incorrect password"
        }
      }
    }

    return {
      user: loginUser
    }
  }
}
