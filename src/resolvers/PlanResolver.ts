import {
  Resolver,
  Query,
  Ctx,
  Arg,
  Int,
  Mutation,
  UseMiddleware,
  InputType,
  Field
} from "type-graphql";
import { Plan } from "../entities/Plan";
import { MyContext } from "src/types";
import { isAuth } from "../database/middleware/isAuth";
import { getConnection } from "typeorm";

@InputType()
class PlanInputType {
  @Field()
  destination: string;

  @Field()
  numberOfDay: number;
}

@Resolver()
export class PlanResolver {
  @Query(() => [Plan])
  getAllPlans(
    @Arg("limit") limit: number,
    @Arg("cursor", () => String, { nullable: true }) cursor: string | null // cursor is to set results where there is some condition
  ): Promise<Plan[]> {
    const realLimit = Math.min(50, limit)
    const queryBuilder = getConnection()
      .getRepository(Plan)
      .createQueryBuilder("plans")
      .orderBy("plans.createdAt", 'DESC') // or ('"createdAt"')
      .take(realLimit )
    if(cursor) {
      queryBuilder.where('"createdAt" < :cursor', { cursor: new Date(parseInt(cursor))}) // return results where their's date is less than cursor
    }
    return queryBuilder.getMany();
  }

  @Query(() => Plan)
  getPlanById(
    @Arg("plan_id", () => Int) plan_id: number
  ): Promise<Plan | undefined> {
    return Plan.findOne(plan_id);
  }

  @Mutation(() => Plan)
  @UseMiddleware(isAuth)
  async createPlan(
    @Arg("inputPlan", () => PlanInputType) inputPlan: PlanInputType,
    @Ctx() { req }: MyContext
  ): Promise<Plan> {
    return Plan.create({
      ...inputPlan,
      plannerId: req.session.userId
    }).save();
  }

  @Mutation(() => Plan, { nullable: true })
  async updatePlan(
    @Arg("plan_id", () => Int) plan_id: number,
    @Arg("destination", () => String, { nullable: true }) destination: string,
    @Arg("numberOfDay", () => Int, { nullable: true }) numberOfDay: number
  ): Promise<Plan | null> {
    const updatedPlan = await Plan.findOne(plan_id);
    if (!updatedPlan) {
      return null;
    }
    updatedPlan.destination = destination || updatedPlan.destination;
    updatedPlan.numberOfDay = numberOfDay || updatedPlan.numberOfDay;
    await Plan.update({ plan_id }, updatedPlan);
    return updatedPlan;
  }

  @Mutation(() => Boolean)
  async deletePlan(
    @Arg("plan_id", () => Int) plan_id: number
  ): Promise<boolean> {
    const plan = await Plan.findOne(plan_id);
    if (!plan) {
      return false;
    }
    try {
      await Plan.delete(plan_id);
    } catch {
      return false;
    }
    return true;
  }
}
