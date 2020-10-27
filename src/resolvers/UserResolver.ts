import { Query, Resolver, Mutation, Arg, InputType, Field, Ctx } from "type-graphql"
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
}
