import { Resolver, Query, Ctx, Arg, Int, Mutation, UseMiddleware, InputType, Field } from "type-graphql";
import { Plan } from "../entities/Plan";
import { MyContext } from "src/types";
import { isAuth } from "../database/middleware/isAuth";

@InputType()
class PlanInputType {
  @Field()
  destination: string

  @Field(() => Int)
  numberOfDay: number
}


@Resolver()
export class PlanResolver {
  @Query(() => [Plan])
  getAllPlans(): Promise<Plan[]> {
    return Plan.find()
  }

  @Query(() => Plan)
  getPlanById (
    @Arg('plan_id', () => Int ) plan_id: number,
  ): Promise<Plan | undefined> {
    return Plan.findOne(plan_id);
  }

  @Mutation(() => Plan)
  async createPlan(
    @Arg('planData') planData: PlanInputType,
    @Ctx() { req }: MyContext
  ):Promise<Plan> {
    return Plan.create({
      ...planData,
      plannerId: req.session.userId,
    }).save();
  }

  @Mutation(() => Plan, { nullable: true })
  async updatePlan(
    @Arg('plan_id', () => Int ) plan_id: number,
    @Arg('destination', () => String, { nullable: true }) destination: string,
    @Arg('numberOfDay', () => Int, { nullable: true }) numberOfDay: number,
  ): Promise<Plan | null> {
    const updatedPlan = await Plan.findOne(plan_id)
    if(!updatedPlan) {
      return null
    }
    updatedPlan.destination = destination || updatedPlan.destination
    updatedPlan.numberOfDay = numberOfDay || updatedPlan.numberOfDay
    await Plan.update({plan_id}, updatedPlan)
    return updatedPlan
  }

  @Mutation(() => Boolean)
  async deletePlan(
    @Arg('plan_id', () => Int) plan_id: number,
  ): Promise<boolean> {
    const plan = await Plan.findOne(plan_id)
    if (!plan) {
      return false
    }
    try {
      await Plan.delete(plan_id)
    } catch {
      return false
    }
    return true
  }
}
