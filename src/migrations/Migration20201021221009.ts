import { Migration } from '@mikro-orm/migrations';

export class Migration20201021221009 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "plan" add column "number_of_day" int4 not null, add column "created_at" timestamptz(0) not null, add column "updated_at" timestamptz(0) not null;');
    this.addSql('alter table "plan" drop constraint if exists "plan_destination_check";');
    this.addSql('alter table "plan" alter column "destination" type varchar(255) using ("destination"::varchar(255));');
    this.addSql('alter table "plan" alter column "destination" set not null;');
  }

}
